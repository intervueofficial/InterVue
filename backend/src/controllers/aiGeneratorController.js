import axios from "axios";
import crypto from "crypto";
import { jsonrepair } from "jsonrepair";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PRIMARY_MODEL = "openai/gpt-3.5-turbo";
const FALLBACK_MODELS = [
  "mistralai/mistral-7b-instruct",
  "meta-llama/llama-3.3-70b-instruct",
];

if (!process.env.OPENROUTER_API_KEY) {
  console.error("⚠️  OPENROUTER_API_KEY is missing from environment variables.");
} else {
  console.log(`OPENROUTER_API_KEY loaded (starts with: ${process.env.OPENROUTER_API_KEY.slice(0, 8)}...)`);
}

const RATE_LIMIT_CACHE = new Map();
const RESPONSE_CACHE = new Map();
const REQUEST_QUEUE = [];
let PROCESSING = false;
const MAX_QUEUE = 50;
const QUEUE_TIMEOUT = 30000;

const TOKEN_LIMITS = {
  problem: 1600,
  quiz: 1800,
};

const FALLBACK_RESPONSES = {
  problem: {
    title: "Array Sum Problem",
    difficulty: "Medium",
    tags: ["array", "mathematics"],
    description:
      "Given an array of integers and a target sum, find all unique pairs that add up to the target. Return pairs in sorted order.",
    starterCode: "function findPairs(arr, target) {\n  // your implementation\n}",
    testCases: [
      { input: "[1, 2, 3, 4, 5], 6", expectedOutput: "[[1, 5], [2, 4]]" },
      { input: "[1, 1, 1], 2", expectedOutput: "[[1, 1]]" },
    ],
    timeLimit: 60,
    complexity: "O(n²)",
    language: "JavaScript",
    hints: [
      "Consider using a hash set for O(1) lookups",
      "Track seen numbers to avoid duplicates",
    ],
  },
  quiz: [
    {
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correctAnswer: 1,
      marks: 1,
      explanation:
        "Binary search divides the search space in half each time, resulting in logarithmic time complexity.",
    },
    {
      question: "Which data structure uses LIFO principle?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correctAnswer: 1,
      marks: 1,
      explanation:
        "A Stack uses Last-In-First-Out (LIFO) principle where the last element added is the first one to be removed.",
    },
    {
      question: "What does REST stand for?",
      options: [
        "Representational State Transfer",
        "Remote Server Transfer",
        "Restricted State Transmission",
        "Real-time Server Trigger",
      ],
      correctAnswer: 0,
      marks: 1,
      explanation:
        "REST (Representational State Transfer) is an architectural style for designing networked applications.",
    },
  ],
};

class TokenCounter {
  static estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
  static estimateResponseTokens(type, count = 1) {
    return type === "problem" ? count * 300 : count * 200;
  }
  static canFitInLimit(promptTokens, responseTokens, modelLimit = 4096) {
    return promptTokens + responseTokens <= modelLimit * 0.8;
  }
}

class RateLimiter {
  static checkLimit(key) {
    const now = Date.now();
    const record = RATE_LIMIT_CACHE.get(key) || { count: 0, resetTime: now + 60000 };
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + 60000;
    }
    record.count++;
    RATE_LIMIT_CACHE.set(key, record);
    return {
      allowed: record.count <= 10,
      remaining: Math.max(0, 10 - record.count),
      resetTime: record.resetTime,
    };
  }
}

class ResponseCache {
  static generateKey(params) {
    return crypto.createHash("md5").update(JSON.stringify(params)).digest("hex");
  }
  static get(key) {
    const cached = RESPONSE_CACHE.get(key);
    if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
      return cached.data;
    }
    if (cached) RESPONSE_CACHE.delete(key);
    return null;
  }
  static set(key, data) {
    RESPONSE_CACHE.set(key, { data, timestamp: Date.now() });
    if (RESPONSE_CACHE.size > 100) {
      const firstKey = RESPONSE_CACHE.keys().next().value;
      RESPONSE_CACHE.delete(firstKey);
    }
  }
  static clear() {
    RESPONSE_CACHE.clear();
  }
}

class PromptOptimizer {
  static buildProblemPrompt(params) {
    const { role, experience, skills, topics, difficulty } = params;
    const skillStr = skills.substring(0, 100);
    const topicStr = topics ? ` Focus: ${topics.substring(0, 50)}.` : "";

    return `Generate 1 coding problem. Respond with STRICT, VALID JSON only — no markdown, no commentary.
IMPORTANT JSON RULES:
- Escape all newlines inside string values as \\n (never use literal line breaks inside a string).
- Use only straight double quotes ("), never curly/smart quotes.
- No trailing commas.
- Do not include any text before or after the JSON object.

Role: ${role} | Level: ${experience} | Skills: ${skillStr}${topicStr} | Difficulty: ${difficulty}

{
  "title": "string",
  "difficulty": "${difficulty}",
  "tags": ["tag1","tag2"],
  "description": "2-4 sentences",
  "starterCode": "function signature",
  "testCases": [{"input": "string", "expectedOutput": "string"}],
  "timeLimit": 60,
  "complexity": "O(n)",
  "language": "JavaScript",
  "hints": ["hint1"]
}`;
  }

  static buildQuizPrompt(params) {
    const { role, experience, skills, topics, difficulty, count } = params;
    const skillStr = skills.substring(0, 100);
    const topicStr = topics ? ` Focus: ${topics.substring(0, 50)}.` : "";
    const qCount = Math.min(count, 10);

    return `Generate ${qCount} MCQ questions. Respond with STRICT, VALID JSON array only — no markdown, no commentary.
IMPORTANT JSON RULES:
- Escape all newlines inside string values as \\n (never use literal line breaks inside a string).
- Use only straight double quotes ("), never curly/smart quotes.
- No trailing commas.
- Do not include any text before or after the JSON array.

Role: ${role} | Level: ${experience} | Skills: ${skillStr}${topicStr} | Difficulty: ${difficulty}

[
  {
    "question": "string",
    "options": ["opt1","opt2","opt3","opt4"],
    "correctAnswer": 0,
    "marks": 1,
    "explanation": "string"
  }
]`;
  }
}

class ModelSelector {
  static selectModel(attemptIndex = 0) {
    if (attemptIndex === 0) return PRIMARY_MODEL;
    if (attemptIndex <= FALLBACK_MODELS.length) return FALLBACK_MODELS[attemptIndex - 1];
    return null;
  }
  static getMaxTokens(model) {
    if (model.includes("gpt-4")) return 8192;
    if (model.includes("gpt-3.5")) return 4096;
    return 4096;
  }
}

function extractJSON(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1].trim() : raw.trim();

  const arrMatch = text.match(/(\[[\s\S]*\])/);
  const objMatch = text.match(/(\{[\s\S]*\})/);

  const jsonStr = arrMatch ? arrMatch[1] : objMatch ? objMatch[1] : text;

  // First try a plain parse
  try {
    return JSON.parse(jsonStr);
  } catch (firstError) {
    // Fall back to auto-repair for common LLM JSON issues:
    // unescaped newlines/control chars inside strings, trailing commas,
    // smart quotes, single quotes, etc.
    try {
      const repaired = jsonrepair(jsonStr);
      return JSON.parse(repaired);
    } catch (repairError) {
      throw firstError; // surface the original error for logging
    }
  }
}

class APIClient {
  static async callOpenRouter(prompt, model, maxTokens = 1400) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw { code: "AUTH_ERROR", message: "OPENROUTER_API_KEY is not set", retry: false };
    }

    try {
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.4, // lowered slightly — reduces creative formatting drift
          top_p: 0.9,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.FRONTEND_URL || "https://intervue.site",
            "X-Title": "InterVue AI Generator",
          },
          timeout: 12000,
        }
      );

      return {
        success: true,
        content: response.data.choices[0].message.content.trim(),
        model,
        usage: response.data.usage,
        finishReason: response.data.choices[0].finish_reason,
      };
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      const message = data?.error?.message || error.message;

      console.error(
        `[OpenRouter Error] model=${model} status=${status || "N/A"} code=${error.code || "N/A"} message=${message}`,
        data ? JSON.stringify(data) : ""
      );

      if (status === 429) throw { code: "RATE_LIMITED", message: "API rate limit exceeded", retry: true };
      if (status === 401 || status === 403) throw { code: "AUTH_ERROR", message: `API authentication failed: ${message}`, retry: false };
      if (status === 402) throw { code: "NO_CREDITS", message: "OpenRouter account has insufficient credits", retry: false };
      if (status === 404) throw { code: "MODEL_NOT_FOUND", message: `Model not found: ${model}`, retry: true };
      if (status >= 500) throw { code: "SERVER_ERROR", message: "API server error", retry: true };
      if (error.code === "ECONNABORTED") throw { code: "TIMEOUT", message: "Model response timed out", retry: true };

      throw { code: "REQUEST_FAILED", message, retry: true };
    }
  }

  static async callWithFallback(prompt, type, maxAttempts = 3) {
    let lastError = null;

    for (let i = 0; i < maxAttempts; i++) {
      const model = ModelSelector.selectModel(i);
      if (!model) break;

      try {
        const maxTokens = type === "problem" ? TOKEN_LIMITS.problem : TOKEN_LIMITS.quiz;
        const result = await APIClient.callOpenRouter(prompt, model, maxTokens);

        if (result.finishReason === "length") {
          console.warn(`Model ${model} hit max_tokens limit — response may be truncated.`);
        }

        try {
          const parsed = extractJSON(result.content);
          return { ...result, parsed };
        } catch (parseError) {
          console.error(`Parse failed for ${model}: ${parseError.message}`);
          console.error(`Raw content from ${model}:`, result.content);
          lastError = { code: "PARSE_FAILED", message: `Model returned invalid JSON: ${parseError.message}` };

          if (i < maxAttempts - 1) await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed with ${model}: [${error.code}] ${error.message}`);
        lastError = error;

        if (!error.retry) throw error;
        if (i < maxAttempts - 1) await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    throw {
      code: lastError?.code || "ALL_ATTEMPTS_FAILED",
      message: lastError?.message || "All AI models failed. Using fallback.",
    };
  }
}

async function processQueue() {
  if (PROCESSING || REQUEST_QUEUE.length === 0) return;
  PROCESSING = true;

  while (REQUEST_QUEUE.length > 0) {
    const item = REQUEST_QUEUE.shift();
    const elapsed = Date.now() - item.timestamp;

    if (elapsed > QUEUE_TIMEOUT) {
      item.reject(new Error("Request timeout in queue"));
      continue;
    }

    try {
      const result = await item.process();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  PROCESSING = false;
}

export const generateQuestions = async (req, res) => {
  const userId = req.auth?.userId || "anonymous";
  const { type, role, experience, skills, topics, difficulty, count = 5 } = req.body;

  if (!type || !role || !experience || !skills || !difficulty) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: type, role, experience, skills, difficulty",
    });
  }

  const rateLimitCheck = RateLimiter.checkLimit(userId);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Try again later.",
      remaining: rateLimitCheck.remaining,
      resetTime: rateLimitCheck.resetTime,
    });
  }

  const safeCount = Math.min(Math.max(parseInt(count) || 5, 1), type === "quiz" ? 15 : 1);

  const cacheKey = ResponseCache.generateKey({ type, role, experience, skills, topics, difficulty, count: safeCount });

  const cached = ResponseCache.get(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, data: cached, cached: true, remaining: rateLimitCheck.remaining });
  }

  const prompt =
    type === "problem"
      ? PromptOptimizer.buildProblemPrompt({ role, experience, skills, topics, difficulty, count: safeCount })
      : PromptOptimizer.buildQuizPrompt({ role, experience, skills, topics, difficulty, count: safeCount });

  const promptTokens = TokenCounter.estimateTokens(prompt);
  const responseTokens = TokenCounter.estimateResponseTokens(type, safeCount);

  if (!TokenCounter.canFitInLimit(promptTokens, responseTokens, ModelSelector.getMaxTokens(PRIMARY_MODEL))) {
    return res.status(400).json({
      success: false,
      message: "Request too large for token budget. Try fewer questions or simpler parameters.",
      details: { promptTokens, responseTokens },
    });
  }

  const queueItem = {
    process: async () => {
      try {
        const result = await APIClient.callWithFallback(prompt, type);
        ResponseCache.set(cacheKey, result.parsed);
        return {
          success: true,
          data: result.parsed,
          model: result.model,
          usage: result.usage,
          cached: false,
          remaining: rateLimitCheck.remaining,
        };
      } catch (error) {
        console.error("Generation error:", `[${error.code}]`, error.message);

        const fallback = type === "problem" ? FALLBACK_RESPONSES.problem : FALLBACK_RESPONSES.quiz;
        ResponseCache.set(cacheKey, fallback);
        return {
          success: true,
          data: fallback,
          model: "fallback",
          fallback: true,
          debugError: { code: error.code, message: error.message }, // TEMP — remove after confirming fix works
          cached: false,
          remaining: rateLimitCheck.remaining,
        };
      }
    },
    resolve: (result) => {
      res.status(200).json(result);
    },
    reject: (error) => {
      console.error("Queue processing error:", error);
      res.status(503).json({
        success: false,
        message: error.message || "AI service temporarily unavailable. Please try again.",
        fallbackAvailable: true,
      });
    },
    timestamp: Date.now(),
  };

  if (REQUEST_QUEUE.length >= MAX_QUEUE) {
    return res.status(503).json({ success: false, message: "Server queue full. Please try again in a moment." });
  }

  REQUEST_QUEUE.push(queueItem);
  processQueue();
};

export const clearCache = async (req, res) => {
  ResponseCache.clear();
  res.status(200).json({ success: true, message: "Cache cleared successfully" });
};

export const getStats = async (req, res) => {
  res.status(200).json({
    success: true,
    stats: {
      cacheSize: RESPONSE_CACHE.size,
      queueLength: REQUEST_QUEUE.length,
      rateLimitRecords: RATE_LIMIT_CACHE.size,
    },
  });
};
