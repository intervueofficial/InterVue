import axios from "axios";
import crypto from "crypto";
import { jsonrepair } from "jsonrepair";
import { runCode, buildHarness } from "../lib/judge.js";

// Maps the free-text "language" the AI puts on a generated problem
// (e.g. "JavaScript", "Python 3") to the judge's language keys.
function toJudgeLanguage(language = "") {
  const l = language.toLowerCase();
  if (l.includes("java") && !l.includes("script")) return "java";
  if (l.includes("python")) return "python";
  if (l.includes("js") || l.includes("javascript") || l.includes("node")) return "javascript";
  return null;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || "openai/gpt-4o-mini";
const FALLBACK_MODELS = process.env.OPENROUTER_FALLBACK_MODELS
  ? process.env.OPENROUTER_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean)
  : ["meta-llama/llama-3.3-70b-instruct:free", "qwen/qwen3-coder:free"];

const IS_PROD = process.env.NODE_ENV === "production";

if (!process.env.OPENROUTER_API_KEY) {
  console.error("⚠️  OPENROUTER_API_KEY is missing from environment variables.");
} else if (!IS_PROD) {
  console.log(`OPENROUTER_API_KEY loaded (starts with: ${process.env.OPENROUTER_API_KEY.slice(0, 8)}...)`);
}

/**
 * The AI writes both the problem AND the reference "answer" (solutionCode)
 * in the same call, but LLM-guessed expectedOutput strings are frequently
 * a little off from what real execution actually produces (spacing,
 * bracket/array formatting, key order, etc). Rather than trusting that
 * guess blindly, we actually call solutionCode's entryPoint function with
 * each test case's arguments — the exact same harness used later to grade
 * the candidate — and overwrite expectedOutput with what the reference
 * answer really returns. So the "answer" the candidate is graded against
 * is a verified, real result, not an LLM's guess at what it should look
 * like. Best-effort: any execution failure just leaves the AI's original
 * guess in place instead of blocking generation.
 */
async function verifyProblemAgainstItsOwnSolution(problem) {
  if (
    !problem?.solutionCode ||
    !problem?.entryPoint ||
    !Array.isArray(problem.testCases) ||
    problem.testCases.length === 0
  ) {
    return problem;
  }

  const judgeLanguage = toJudgeLanguage(problem.language);
  if (!judgeLanguage) return problem;

  const harness = buildHarness(judgeLanguage, problem.solutionCode, problem.entryPoint);
  if (!harness) return problem;

  const verifiedTestCases = await Promise.all(
    problem.testCases.map(async (tc) => {
      try {
        const result = await runCode({
          language: judgeLanguage,
          code: harness,
          stdin: tc.input || "[]",
        });

        if (result.success && result.output) {
          // Round-trip through JSON.parse/stringify to normalize
          // formatting (whitespace, key order) rather than trusting the
          // raw printed text verbatim.
          const parsed = JSON.parse(result.output.trim());
          return { ...tc, expectedOutput: JSON.stringify(parsed) };
        }
      } catch (_) {
        // fall through to original test case below
      }
      return tc;
    })
  );

  return { ...problem, testCases: verifiedTestCases };
}

const RATE_LIMIT_CACHE = new Map();
const RESPONSE_CACHE = new Map();

// Simple in-memory counter for "AI generations made today", read by
// Admin → System Health. Resets automatically whenever the calendar day
// rolls over (checked lazily on each recordGeneration() call — no
// scheduled job needed). In-memory means this resets on every server
// restart/deploy, which is an acceptable trade-off for a lightweight
// usage indicator; it's not meant to be a billing-grade counter.
const GENERATION_STATS = { day: todayKey(), total: 0, fallback: 0 };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function recordGeneration(result) {
  const key = todayKey();
  if (GENERATION_STATS.day !== key) {
    GENERATION_STATS.day = key;
    GENERATION_STATS.total = 0;
    GENERATION_STATS.fallback = 0;
  }
  GENERATION_STATS.total += 1;
  if (result?.fallback) GENERATION_STATS.fallback += 1;
}

// Read-only snapshot for the System Health controller — imported there
// rather than duplicating this tracking logic.
export function getGenerationStatsToday() {
  const key = todayKey();
  if (GENERATION_STATS.day !== key) {
    return { day: key, total: 0, fallback: 0 };
  }
  return { ...GENERATION_STATS };
}
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
    entryPoint: "findPairs",
    starterCode: "function findPairs(arr, target) {\n  // your implementation\n}",
    solutionCode:
      "function findPairs(arr, target) {\n  const seen = new Set();\n  const pairs = [];\n  const used = new Set();\n  for (const n of arr) {\n    const complement = target - n;\n    const key = [Math.min(n, complement), Math.max(n, complement)].join(',');\n    if (seen.has(complement) && !used.has(key)) {\n      pairs.push([Math.min(n, complement), Math.max(n, complement)]);\n      used.add(key);\n    }\n    seen.add(n);\n  }\n  return pairs.sort((a, b) => a[0] - b[0]);\n}",
    testCases: [
      { input: "[[1, 2, 3, 4, 5], 6]", expectedOutput: "[[1,5],[2,4]]" },
      { input: "[[1, 1, 1], 2]", expectedOutput: "[[1,1]]" },
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

Design this as a LeetCode-style function problem, not a stdin/stdout
program:
- "entryPoint" is the exact name of the one function/method the
  candidate implements (must match the function name used in
  "starterCode" and "solutionCode").
- "solutionCode" is a correct, complete, working reference implementation
  of that function — this is the answer key the candidate's own code will
  be graded against, by calling their function directly with each test
  case's arguments (any correct approach/imports/logic is accepted — only
  the returned value is checked).
- Each testCases[].input is a JSON array of the arguments to pass to
  entryPoint, e.g. "[[2,7,11,15],9]" for a two-argument call.
- Each testCases[].expectedOutput is the JSON-encoded return value for
  those arguments, e.g. "[0,1]". It MUST be exactly what solutionCode
  actually returns for that input — do not guess formatting.

{
  "title": "string",
  "difficulty": "${difficulty}",
  "tags": ["tag1","tag2"],
  "description": "2-4 sentences",
  "entryPoint": "functionName",
  "starterCode": "function signature only, matching entryPoint",
  "solutionCode": "a full, correct, working reference solution — the answer key",
  "testCases": [{"input": "JSON array of arguments", "expectedOutput": "JSON-encoded return value"}],
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

function extractJSON(raw, expectArray) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1].trim() : raw.trim();

  const arrMatch = text.match(/\[[\s\S]*\]/);
  const objMatch = text.match(/\{[\s\S]*\}/);

  // A response can legitimately contain BOTH bracket types — a problem
  // object has array *fields* (tags, testCases, hints), and a quiz array
  // has object *elements* with their own "options" array. Blindly
  // preferring one bracket type over the other (as this used to) means
  // that for a problem response, the regex slices out just the first
  // array field instead of the surrounding object — jsonrepair then
  // "successfully" repairs that fragment into a small, wrong-shaped
  // array, which used to sail through as a false "success". The correct
  // top-level value is whichever bracket actually opens first in the text.
  let candidate;
  if (arrMatch && objMatch) {
    candidate = arrMatch.index <= objMatch.index ? arrMatch[0] : objMatch[0];
  } else {
    candidate = arrMatch?.[0] || objMatch?.[0] || text;
  }

  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch (firstError) {
    // Fall back to auto-repair for common LLM JSON issues:
    // unescaped newlines/control chars inside strings, trailing commas,
    // smart quotes, single quotes, etc.
    try {
      parsed = JSON.parse(jsonrepair(candidate));
    } catch (repairError) {
      throw firstError; // surface the original error for logging
    }
  }

  // Defense-in-depth: even a "successfully parsed" result can be the
  // wrong shape if a weaker model doesn't follow the schema, or if the
  // bracket-selection heuristic above ever picks wrong on malformed
  // output. Treat a shape mismatch the same as a parse failure so the
  // caller retries the next model instead of returning bad data to the
  // client with success: true.
  const isArrayResult = Array.isArray(parsed);

  if (expectArray && !isArrayResult) {
    throw new Error("Expected a JSON array but the model returned an object.");
  }

  if (!expectArray && isArrayResult) {
    throw new Error("Expected a JSON object but the model returned an array.");
  }

  return parsed;
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
          const parsed = extractJSON(result.content, type === "quiz");
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
  const userId = req.user?._id?.toString() || req.user?.clerkId || "anonymous";
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

        const data =
          type === "problem"
            ? await verifyProblemAgainstItsOwnSolution(result.parsed)
            : result.parsed;

        ResponseCache.set(cacheKey, data);
        return {
          success: true,
          data,
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
          ...(!IS_PROD && {
            debugError: { code: error.code, message: error.message },
          }),
          cached: false,
          remaining: rateLimitCheck.remaining,
        };
      }
    },
    resolve: (result) => {
      recordGeneration(result);
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