import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sparkles, Loader2, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, RefreshCw,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { aiGeneratorApi } from "../api/aiGeneratorApi";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm";

const selectCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm";

const STEPS = ["Configure", "Preview & Apply"];

// Normalizes any AI response shape into the exact object ProblemForm.handleAIApply expects
function normalizeProblem(raw) {
  const p = raw?.problem || raw;
  if (!p || typeof p !== "object" || Array.isArray(p)) {
    throw new Error("AI did not return a valid problem object.");
  }
  return {
    title:       p.title       || p.name             || "",
    difficulty:  p.difficulty                         || "Medium",
    tags:        Array.isArray(p.tags) ? p.tags       : [],
    description: p.description || p.problemStatement  || p.statement || "",
    starterCode: p.starterCode || p.starter_code      || p.template  || "",
    testCases:   Array.isArray(p.testCases)  ? p.testCases
               : Array.isArray(p.test_cases) ? p.test_cases
               : [],
    timeLimit:   p.timeLimit   || p.time_limit        || 60,
    complexity:  p.complexity  || p.timeComplexity    || p.time_complexity || "O(n)",
    language:    p.language                           || "JavaScript",
    hints:       Array.isArray(p.hints) ? p.hints     : [],
  };
}

// Normalizes quiz response
function normalizeQuiz(raw) {
  const arr = Array.isArray(raw)
    ? raw
    : raw?.questions || raw?.quiz || [];
  if (!arr.length) throw new Error("No questions found in AI response.");
  return arr.map((q, i) => ({
    question:      q.question      || q.text          || `Question ${i + 1}`,
    options:       Array.isArray(q.options) ? q.options : q.choices || [],
    correctAnswer: q.correctAnswer  !== undefined ? q.correctAnswer
                 : q.correct_answer !== undefined ? q.correct_answer
                 : q.answer || 0,
    marks:         q.marks || q.points || 1,
    explanation:   q.explanation || q.rationale || "",
  }));
}

function normalizeResult(type, raw) {
  return type === "problem" ? normalizeProblem(raw) : normalizeQuiz(raw);
}

const AIGeneratorWizard = ({ type, onClose, onApply }) => {
  const { getToken } = useAuth();
  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [normalized, setNormalized]   = useState(null);
  const [isFallback, setIsFallback]   = useState(false);
  const [validationError, setValidationError] = useState("");

  const [form, setForm] = useState({
    role:       "Software Engineer",
    experience: "Mid-level (2–4 years)",
    skills:     "",
    topics:     "",
    difficulty: "Medium",
    count:      type === "quiz" ? 5 : 1,
  });

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError("");
  };

  const validateForm = () => {
    if (!form.skills.trim()) {
      setValidationError("Please enter at least one skill.");
      return false;
    }
    if (type === "quiz") {
      const n = parseInt(form.count) || 5;
      if (n < 1 || n > 15) {
        setValidationError("Number of questions must be between 1 and 15.");
        return false;
      }
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setValidationError("");
    setIsFallback(false);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed. Please sign in again.");

      const payload = {
        type,
        role:       form.role.trim(),
        experience: form.experience,
        skills:     form.skills.trim(),
        topics:     form.topics.trim(),
        difficulty: form.difficulty,
        count:      type === "quiz"
          ? Math.min(Math.max(parseInt(form.count) || 5, 1), 15)
          : 1,
      };

      const response = await aiGeneratorApi.generate(payload, token);
      if (!response.success) throw new Error(response.message || "Generation failed.");

      // Normalize here — if it fails, user sees the error on step 0, not after Apply
      const norm = normalizeResult(type, response.data);
      setNormalized(norm);
      setIsFallback(!!response.fallback);
      setStep(1);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Generation failed. Please try again.";
      setValidationError(msg);
      toast.error(msg);
      console.error("Generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!normalized) { toast.error("Nothing to apply."); return; }
    // onApply receives a guaranteed-correct shape — ProblemForm's guard will never fire
    onApply(normalized);
    onClose();
    toast.success(
      type === "problem"
        ? "Problem applied to form!"
        : `${normalized.length} question${normalized.length !== 1 ? "s" : ""} applied!`
    );
  };

  const handleBack = () => {
    setStep(0);
    setNormalized(null);
    setIsFallback(false);
    setValidationError("");
  };

  const handleClose = () => {
    handleBack();
    onClose();
  };

  const questionCount = Array.isArray(normalized) ? normalized.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <Sparkles size={18} className="text-white" />
            </motion.div>
            <div>
              <p className="text-white font-semibold text-base leading-tight">Generate with AI</p>
              <p className="text-blue-100 text-xs mt-0.5">
                {type === "problem" ? "Coding Problem" : "Quiz Questions"} • {STEPS[step]}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X size={16} className="text-white" />
          </motion.button>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex gap-1.5 px-6 pt-5 pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col gap-1.5">
              <motion.div
                animate={{ scaleX: i <= step ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                className={`h-1 rounded-full origin-left ${i <= step ? "bg-blue-600" : "bg-slate-200"}`}
              />
              <span className={`text-xs font-medium ${i <= step ? "text-blue-600" : "text-slate-400"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="px-6 pt-4 pb-6 max-h-[65vh] overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* Step 0 — Configure */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2"
                  >
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{validationError}</p>
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role / Job Title</label>
                  <input type="text" className={inputCls} placeholder="e.g. Software Engineer"
                    value={form.role} onChange={(e) => updateForm("role", e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Experience Level</label>
                  <select className={selectCls} value={form.experience} onChange={(e) => updateForm("experience", e.target.value)}>
                    <option>Entry-level (0–1 years)</option>
                    <option>Junior (1–2 years)</option>
                    <option>Mid-level (2–4 years)</option>
                    <option>Senior (4–7 years)</option>
                    <option>Staff / Lead (7+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Required Skills <span className="text-red-500">*</span>
                  </label>
                  <input type="text" className={inputCls} placeholder="e.g. React, Node.js, System Design"
                    value={form.skills} onChange={(e) => updateForm("skills", e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">Separate multiple skills with commas.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Optional Topics / Focus Areas</label>
                  <input type="text" className={inputCls} placeholder="e.g. Recursion, REST APIs"
                    value={form.topics} onChange={(e) => updateForm("topics", e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                    <select className={selectCls} value={form.difficulty} onChange={(e) => updateForm("difficulty", e.target.value)}>
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                  {type === "quiz" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Questions</label>
                      <input type="number" min="1" max="15" className={inputCls} value={form.count}
                        onChange={(e) => updateForm("count", Math.min(Math.max(parseInt(e.target.value) || 5, 1), 15))} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 1 — Preview */}
            {step === 1 && normalized && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
                  isFallback ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"
                }`}>
                  {isFallback
                    ? <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    : <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  }
                  <p className={`text-sm font-medium ${isFallback ? "text-amber-700" : "text-green-700"}`}>
                    {isFallback
                      ? "AI was unavailable — this is a sample problem. Retry for a custom one, or apply as a starting point."
                      : type === "problem"
                      ? "Problem generated! Click Apply to fill the form automatically."
                      : `${questionCount} question${questionCount !== 1 ? "s" : ""} generated. Click Apply to fill the quiz.`
                    }
                  </p>
                </div>

                {/* Preview the exact data that will be applied */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 max-h-64 overflow-y-auto">
                  <pre className="p-4 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {JSON.stringify(normalized, null, 2)}
                  </pre>
                </div>

                <p className="text-xs text-slate-500">
                  This is exactly what will be applied to your form. Go back to regenerate if needed.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3 bg-slate-50">
          {step === 0 ? (
            <>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition">
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition min-w-[130px] justify-center"
              >
                {loading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Loader2 size={15} />
                    </motion.div>
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Generate
                    <ChevronRight size={15} />
                  </>
                )}
              </motion.button>
            </>
          ) : (
            <>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition">
                <ChevronLeft size={15} />
                Back
              </motion.button>

              <div className="flex items-center gap-2">
                {isFallback && (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleBack}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-50 transition">
                    <RefreshCw size={13} />
                    Retry
                  </motion.button>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleApply}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition">
                  <Sparkles size={15} />
                  Apply to Form
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIGeneratorWizard;
