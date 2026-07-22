import axios from "axios";
import { jsonrepair } from "jsonrepair";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || "openai/gpt-4o-mini";
const FALLBACK_MODELS = process.env.OPENROUTER_FALLBACK_MODELS
  ? process.env.OPENROUTER_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean)
  : ["meta-llama/llama-3.3-70b-instruct:free", "qwen/qwen3-coder:free"];

function buildPrompt({
  candidateName,
  jobTitle,
  codingScore,
  quizScore,
  confidenceScore,
  violationCount,
  interviewerFeedback,
}) {
  return `You are an experienced technical interview panel writing an internal performance summary for a candidate. Be honest, specific, and constructive — reference the actual numbers given below, don't write anything generic.

Candidate: ${candidateName}
Role interviewed for: ${jobTitle}
Coding test result: ${
    codingScore !== null && codingScore !== undefined
      ? `${codingScore}% of test cases passed`
      : "No coding exercise was completed/submitted during this session"
  }
Quiz result: ${
    quizScore !== null && quizScore !== undefined
      ? `${quizScore}% correct`
      : "No quiz was completed during this session"
  }
Engagement/attention during session: ${
    confidenceScore !== null && confidenceScore !== undefined
      ? `${confidenceScore}/100 (derived from ${violationCount} attention flag(s) logged by the proctoring system during the session — fewer flags means a higher score)`
      : "Not tracked for this session"
  }
Interviewer's own comments: "${interviewerFeedback || "(no additional comments provided)"}"

Write a JSON object with exactly these fields:
{
  "overallSummary": "3-4 sentence overall performance summary in a professional tone, referencing the actual scores above",
  "codingFeedback": "1-2 sentences specifically about the coding result",
  "quizFeedback": "1-2 sentences specifically about the quiz result",
  "confidenceFeedback": "1-2 sentences about engagement/composure during the session, based on the attention data"
}

If a section has no data (e.g. no quiz was taken), say so briefly in 1 short sentence rather than inventing detail. Respond with STRICT valid JSON only — no markdown fences, no commentary before or after.`;
}

function extractJSON(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1].trim() : raw.trim();
  const objMatch = text.match(/\{[\s\S]*\}/);
  const candidate = objMatch?.[0] || text;

  try {
    return JSON.parse(candidate);
  } catch (firstError) {
    return JSON.parse(jsonrepair(candidate));
  }
}

async function callModel(prompt, model) {
  const response = await axios.post(
    OPENROUTER_URL,
    {
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.5,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "https://intervue.site",
        "X-Title": "InterVue Performance Report",
      },
      timeout: 15000,
    }
  );

  return response.data.choices[0].message.content.trim();
}

const FALLBACK_SUMMARY = (reason) => ({
  overallSummary: `AI-generated summary unavailable (${reason}). See raw scores and interviewer comments below.`,
  codingFeedback: "",
  quizFeedback: "",
  confidenceFeedback: "",
});

/**
 * Generates a narrative performance summary from real session metrics.
 * Never throws — on any failure (missing key, all models down, bad JSON)
 * it returns a plain fallback object so the PDF/report generation
 * (and the hire/reject email it's attached to) is never blocked by an
 * AI-provider hiccup.
 */
export async function generatePerformanceSummary(metrics) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("generatePerformanceSummary: OPENROUTER_API_KEY not set, using fallback text.");
    return FALLBACK_SUMMARY("AI service not configured");
  }

  const prompt = buildPrompt(metrics);
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  for (const model of modelsToTry) {
    try {
      const raw = await callModel(prompt, model);
      const parsed = extractJSON(raw);

      return {
        overallSummary: parsed.overallSummary || "",
        codingFeedback: parsed.codingFeedback || "",
        quizFeedback: parsed.quizFeedback || "",
        confidenceFeedback: parsed.confidenceFeedback || "",
      };
    } catch (error) {
      console.error(`generatePerformanceSummary: model "${model}" failed:`, error.message);
    }
  }

  return FALLBACK_SUMMARY("all AI models were unavailable");
}
