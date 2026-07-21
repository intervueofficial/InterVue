import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { aiGeneratorApi } from "../api/aiGeneratorApi";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm";

const selectCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm";

const STEPS = ["Configure", "Preview & Apply"];

const AIGeneratorWizard = ({ type, onClose, onApply }) => {
  const { getToken } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [validationError, setValidationError] = useState("");

  const [form, setForm] = useState({
    role: "Software Engineer",
    experience: "Mid-level (2–4 years)",
    skills: "",
    topics: "",
    difficulty: "Medium",
    count: type === "quiz" ? 5 : 1,
  });

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError("");
  };

  const validateForm = () => {
    if (!form.skills || !form.skills.trim()) {
      setValidationError("Please enter at least one skill.");
      return false;
    }

    if (type === "quiz") {
      const countNum = parseInt(form.count) || 5;
      if (countNum < 1 || countNum > 15) {
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

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication failed. Please sign in again.");
      }

      const payload = {
        type,
        role: form.role.trim(),
        experience: form.experience,
        skills: form.skills.trim(),
        topics: form.topics.trim(),
        difficulty: form.difficulty,
        count: type === "quiz" ? Math.min(Math.max(parseInt(form.count) || 5, 1), 15) : 1,
      };

      const response = await aiGeneratorApi.generate(payload, token);

      if (!response.success) {
        throw new Error(response.message || "Generation failed");
      }

      setResult(response.data);
      setStep(1);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Generation failed. Please try again.";
      setValidationError(errorMessage);
      toast.error(errorMessage);
      console.error("Generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) {
      toast.error("No result to apply.");
      return;
    }

    try {
      onApply(result);
      onClose();
      toast.success("Form updated with AI-generated content!");
    } catch (error) {
      toast.error("Failed to apply content. Please try again.");
      console.error("Apply error:", error);
    }
  };

  const handleBack = () => {
    setStep(0);
    setResult(null);
    setValidationError("");
  };

  const handleClose = () => {
    setStep(0);
    setResult(null);
    setValidationError("");
    onClose();
  };

  const questionCount = Array.isArray(result) ? result.length : 0;

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
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-5 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <Sparkles size={18} className="text-white" />
            </motion.div>
            <div>
              <p className="text-white font-semibold text-base leading-tight">
                Generate with AI
              </p>
              <p className="text-blue-100 text-xs mt-0.5">
                {type === "problem" ? "Coding Problem" : "Quiz Questions"} • {STEPS[step]}
              </p>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            aria-label="Close wizard"
          >
            <X size={16} className="text-white" />
          </motion.button>
        </div>

        <div className="flex gap-1.5 px-6 pt-5 pb-2">
          {STEPS.map((s, i) => (
            <motion.div
              key={s}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 flex flex-col gap-1.5"
            >
              <motion.div
                animate={{ scaleX: i <= step ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                className={`h-1 rounded-full origin-left ${
                  i <= step ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors ${
                  i <= step ? "text-blue-600" : "text-slate-400"
                }`}
              >
                {s}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="px-6 pt-6 pb-6 max-h-[65vh] overflow-y-auto scroll-smooth">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                  >
                    <p className="text-sm text-red-700 font-medium">{validationError}</p>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role / Job Title
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Software Engineer, Backend Developer"
                    value={form.role}
                    onChange={(e) => updateForm("role", e.target.value)}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    className={selectCls}
                    value={form.experience}
                    onChange={(e) => updateForm("experience", e.target.value)}
                  >
                    <option>Entry-level (0–1 years)</option>
                    <option>Junior (1–2 years)</option>
                    <option>Mid-level (2–4 years)</option>
                    <option>Senior (4–7 years)</option>
                    <option>Staff / Lead (7+ years)</option>
                  </select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Required Skills <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. React, Node.js, System Design"
                    value={form.skills}
                    onChange={(e) => updateForm("skills", e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Separate multiple skills with commas.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Optional Topics / Focus Areas
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Recursion, REST APIs, Caching"
                    value={form.topics}
                    onChange={(e) => updateForm("topics", e.target.value)}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      className={selectCls}
                      value={form.difficulty}
                      onChange={(e) => updateForm("difficulty", e.target.value)}
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>

                  {type === "quiz" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Questions
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        className={inputCls}
                        value={form.count}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : 5;
                          updateForm("count", Math.min(Math.max(val, 1), 15));
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {step === 1 && result && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-3"
                >
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5 }}>
                    <Sparkles size={16} className="text-green-600 shrink-0" />
                  </motion.div>
                  <p className="text-sm text-green-700 font-medium">
                    {type === "problem"
                      ? "Problem generated successfully. Click Apply to auto-fill the form."
                      : `${questionCount} question${questionCount !== 1 ? "s" : ""} generated. Click Apply to auto-fill the quiz.`}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-slate-200 bg-slate-50 max-h-56 overflow-y-auto"
                >
                  <pre className="p-4 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-slate-500"
                >
                  Review the generated content above. Click Apply to populate the form, or go back to
                  regenerate.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3 bg-slate-50"
        >
          {step === 0 ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition"
              >
                <ChevronLeft size={15} />
                Back
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApply}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition"
              >
                <Sparkles size={15} />
                Apply to Form
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AIGeneratorWizard;
