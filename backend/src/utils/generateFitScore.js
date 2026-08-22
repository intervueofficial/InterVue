import axios from "axios";
import { jsonrepair } from "jsonrepair";

// Same OpenRouter multi-model fallback pattern as
// generatePerformanceSummary.js — kept as a separate, small copy rather
// than a shared import so each caller can tune its own prompt/token
// budget independently without risking cross-feature regressions.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || "openai/gpt-4o-mini";
const FALLBACK_MODELS = process.env.OPENROUTER_FALLBACK_MODELS
  ? process.env.OPENROUTER_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean)
  : ["meta-llama/llama-3.3-70b-instruct:free", "qwen/qwen3-coder:free"];

function buildPrompt({
  candidateName,
  jobTitle,
  jobDescription,
  requiredDegrees,
  requiredSkills,
  minExperience,
  qualificationNote,
  sampleResumeText,
  candidateDegree,
  candidateFieldOfStudy,
  candidateExperienceYears,
  candidateSkills,
  candidateResumeText,
}) {
  return `You are an experienced technical recruiter assessing how strong a candidate's application is for a specific role — not just whether they meet the hard minimum bar (that's already been checked separately), but how compelling their actual background is.

Role: ${jobTitle}
Job description: ${(jobDescription || "").slice(0, 800) || "(none provided)"}
Required degree(s): ${requiredDegrees?.length ? requiredDegrees.join(", ") : "(none specified)"}
Required skills: ${requiredSkills?.length ? requiredSkills.join(", ") : "(none specified)"}
Minimum experience: ${minExperience || 0} year(s)
Additional qualification note: ${qualificationNote || "(none)"}
${
  sampleResumeText
    ? `Reference — an example of a strong resume for this role: ${sampleResumeText.slice(0, 1500)}`
    : ""
}

Candidate: ${candidateName}
Degree / field of study: ${[candidateDegree, candidateFieldOfStudy].filter(Boolean).join(", ") || "(not provided)"}
Years of experience: ${candidateExperienceYears ?? "(not provided)"}
Listed skills: ${candidateSkills?.length ? candidateSkills.join(", ") : "(none listed)"}
${
  candidateResumeText
    ? `Resume text: ${candidateResumeText.slice(0, 3000)}`
    : "(No resume text available — base the assessment on the profile fields above only, and reflect that limitation in resumeQualitySignal.)"
}

Write a JSON object with exactly these fields:
{
  "score": <integer 0-100, how strong a fit this candidate is for this specific role>,
  "summary": "1-2 sentence, specific, professional explanation of the score — reference actual skills/experience, not generic filler",
  "skillsMatched": ["skills from the candidate's background that align with this role"],
  "skillsMissing": ["skills the role wants that the candidate's background doesn't clearly show"],
  "experienceFit": "1 short sentence on how their experience level compares to what the role needs",
  "educationFit": "1 short sentence on how their education compares to what the role needs",
  "resumeQualitySignal": "1 short sentence noting anything notable about resume clarity/depth/red flags, or that none were observed"
}

Be honest and calibrated — most real candidates land in the 40-85 range; reserve 90+ for genuinely exceptional matches and under 30 for weak matches. Respond with STRICT valid JSON only — no markdown fences, no commentary before or after.`;
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
      max_tokens: 600,
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "https://intervue.site",
        "X-Title": "InterVue Fit Score",
      },
      timeout: 15000,
    }
  );

  return response.data.choices[0].message.content.trim();
}

const clampScore = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

const FALLBACK_RESULT = (reason) => ({
  score: null,
  summary: `AI fit score unavailable (${reason}). Use the automated eligibility check and skill match count instead.`,
  skillsMatched: [],
  skillsMissing: [],
  experienceFit: "",
  educationFit: "",
  resumeQualitySignal: "",
});

/**
 * Generates an explainable 0-100 AI fit assessment for one application.
 * Never throws — on any failure (missing key, all models down, bad
 * JSON) it returns a fallback object with score: null, so callers can
 * treat "not yet scored" and "scoring failed" the same way and never
 * block the apply flow or a decision on this.
 */
export async function generateFitScore(input) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("generateFitScore: OPENROUTER_API_KEY not set, skipping.");
    return FALLBACK_RESULT("AI service not configured");
  }

  const prompt = buildPrompt(input);
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  for (const model of modelsToTry) {
    try {
      const raw = await callModel(prompt, model);
      const parsed = extractJSON(raw);

      return {
        score: clampScore(parsed.score),
        summary: parsed.summary || "",
        skillsMatched: Array.isArray(parsed.skillsMatched) ? parsed.skillsMatched : [],
        skillsMissing: Array.isArray(parsed.skillsMissing) ? parsed.skillsMissing : [],
        experienceFit: parsed.experienceFit || "",
        educationFit: parsed.educationFit || "",
        resumeQualitySignal: parsed.resumeQualitySignal || "",
      };
    } catch (error) {
      console.error(`generateFitScore: model "${model}" failed:`, error.message);
    }
  }

  return FALLBACK_RESULT("all AI models were unavailable");
}
