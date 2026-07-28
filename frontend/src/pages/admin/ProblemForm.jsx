import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Tag,
  BookOpen,
  Save,
  Loader2,
  Code2,
  FlaskConical,
  Plus,
  Trash2,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  AlertCircle,
  Copy as CopyIcon,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { problemApi } from "../../api/problemApi";
import AIGeneratorWizard from "../../components/AIGeneratorWizard";

const inputStyle =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const textareaStyle =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const monoTextareaStyle =
  "w-full rounded-xl border border-slate-300 bg-slate-900 text-slate-100 px-4 py-3 outline-none transition resize-y focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-mono text-sm";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, delay: i * 0.05 },
  }),
};

const ProblemForm = ({ problem = null, onClose, onSuccess }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [expandedSection, setExpandedSection] = useState("basic");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [formData, setFormData] = useState({
    title: problem?.title || "",
    difficulty: problem?.difficulty || "Easy",
    tags: problem?.tags?.join(", ") || "",
    description: problem?.description || "",
    starterCode: problem?.starterCode || "",
    testCases:
      problem?.testCases?.length > 0
        ? problem.testCases
        : [{ input: "", expectedOutput: "" }],
    timeLimit: problem?.timeLimit || 60,
    complexity: problem?.complexity || "O(n)",
    language: problem?.language || "JavaScript",
    hints: problem?.hints || [""],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "timeLimit" ? Number(value) : value,
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    const testCases = [...formData.testCases];
    testCases[index] = { ...testCases[index], [field]: value };
    setFormData((prev) => ({ ...prev, testCases }));
  };

  const handleHintChange = (index, value) => {
    const hints = [...formData.hints];
    hints[index] = value;
    setFormData((prev) => ({ ...prev, hints }));
  };

  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "" }],
    }));
  };

  const removeTestCase = (index) => {
    if (formData.testCases.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  const addHint = () => {
    setFormData((prev) => ({
      ...prev,
      hints: [...prev.hints, ""],
    }));
  };

  const removeHint = (index) => {
    setFormData((prev) => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index),
    }));
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

 const handleAIApply = (data) => {
  setFormData({
    title:      data.title      || "",
    difficulty: data.difficulty || "Medium",
    tags:       Array.isArray(data.tags) ? data.tags.join(", ") : "",
    description: data.description || "",
    starterCode: data.starterCode || "",
    testCases:
      Array.isArray(data.testCases) && data.testCases.length > 0
        ? data.testCases
        : [{ input: "", expectedOutput: "" }],
    timeLimit:  data.timeLimit  || 60,
    complexity: data.complexity || "O(n)",
    language:   data.language   || "JavaScript",
    hints:
      Array.isArray(data.hints) && data.hints.length > 0
        ? data.hints
        : [""],
  });
  // Expand Basic Information section so the user sees the filled fields immediately
  setExpandedSection("basic");
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      const token = await getToken();

      const payload = {
        title: formData.title.trim(),
        difficulty: formData.difficulty,
        description: formData.description.trim(),
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        starterCode: formData.starterCode,
        testCases: formData.testCases.filter(
          (tc) => tc.input.trim() || tc.expectedOutput.trim()
        ),
        timeLimit: formData.timeLimit,
        complexity: formData.complexity,
        language: formData.language,
        hints: formData.hints.filter((h) => h.trim()),
      };

      if (problem) {
        await problemApi.updateProblem(problem._id, payload, token);
        toast.success("Problem updated successfully");
      } else {
        await problemApi.createProblem(payload, token);
        toast.success("Problem created successfully");
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          (problem ? "Failed to update problem." : "Failed to create problem.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showWizard && (
          <AIGeneratorWizard
            type="problem"
            onClose={handleCloseWizard}
            onApply={handleAIApply}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={() => !showWizard && onClose()}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6 bg-gradient-to-r from-slate-50 to-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-3xl font-bold text-slate-900">
                {problem ? "Edit Coding Problem" : "Add Coding Problem"}
              </h2>
              <p className="text-slate-500 mt-1">
                {problem
                  ? "Update the coding challenge."
                  : "Create a new interview coding challenge."}
              </p>
            </motion.div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-semibold shadow-md shadow-black/20 transition"
              >
                <Sparkles size={16} />
                Generate with AI
              </motion.button>

              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X size={18} className="text-slate-500" />
              </motion.button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-8 space-y-6 max-h-[85vh] overflow-y-auto"
          >
            <motion.div
              custom={0}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "basic" ? null : "basic"
                  )
                }
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Basic Information
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === "basic" ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown
                    size={20}
                    className="text-slate-400 group-hover:text-slate-600 transition"
                  />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedSection === "basic" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-6 grid md:grid-cols-2 gap-6"
                  >
                    <div>
                      <label className="block mb-2 font-medium text-slate-700">
                        Problem Title
                      </label>
                      <input
                        required
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={inputStyle}
                        placeholder="Example: Two Sum"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-slate-700">
                        Difficulty
                      </label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleChange}
                        className={inputStyle}
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-slate-700">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={120}
                        name="timeLimit"
                        value={formData.timeLimit}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-slate-700">
                        Programming Language
                      </label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className={inputStyle}
                      >
                        <option>JavaScript</option>
                        <option>Python</option>
                        <option>Java</option>
                        <option>C++</option>
                        <option>Go</option>
                        <option>Rust</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-slate-700">
                        Time Complexity
                      </label>
                      <input
                        name="complexity"
                        value={formData.complexity}
                        onChange={handleChange}
                        className={inputStyle}
                        placeholder="O(n), O(log n), etc."
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              custom={1}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Tag size={20} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Tags</h3>
              </div>

              <input
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className={inputStyle}
                placeholder="Array, HashMap, Graph, DP"
              />
              <p className="text-sm text-slate-400 mt-2">
                Separate multiple tags using commas.
              </p>
            </motion.div>

            <motion.div
              custom={2}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BookOpen size={20} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Problem Description
                </h3>
              </div>

              <textarea
                required
                rows={10}
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={textareaStyle}
                placeholder="Describe the coding problem..."
              />
            </motion.div>

            <motion.div
              custom={3}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Code2 size={20} className="text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Starter Code
                </h3>
              </div>

              <textarea
                rows={8}
                name="starterCode"
                value={formData.starterCode}
                onChange={handleChange}
                className={monoTextareaStyle}
                placeholder={`function solve() {\n  // starter code shown to the candidate\n}`}
              />

              <p className="text-sm text-slate-400 mt-2">
                Optional. Shown in the candidate's code editor when this problem is pushed to a
                session.
              </p>
            </motion.div>

            <motion.div
              custom={4}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <FlaskConical size={20} className="text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Test Cases</h3>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addTestCase}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  <Plus size={16} />
                  Add Case
                </motion.button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {formData.testCases.map((tc, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="grid md:grid-cols-2 gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition"
                    >
                      <div>
                        <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Input
                        </label>
                        <input
                          value={tc.input}
                          onChange={(e) =>
                            handleTestCaseChange(index, "input", e.target.value)
                          }
                          className={inputStyle}
                          placeholder="nums = [2,7,11,15], target = 9"
                        />
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Expected Output
                          </label>
                          <input
                            value={tc.expectedOutput}
                            onChange={(e) =>
                              handleTestCaseChange(
                                index,
                                "expectedOutput",
                                e.target.value
                              )
                            }
                            className={inputStyle}
                            placeholder="[0, 1]"
                          />
                        </div>

                        <div className="flex gap-1 self-end mb-[1px]">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() =>
                              copyToClipboard(tc.expectedOutput, index)
                            }
                            className="w-11 h-[46px] flex items-center justify-center rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                          >
                            {copiedIndex === index ? (
                              <Check size={16} className="text-green-600" />
                            ) : (
                              <CopyIcon size={16} />
                            )}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => removeTestCase(index)}
                            disabled={formData.testCases.length === 1}
                            className="w-11 h-[46px] flex items-center justify-center rounded-xl border border-slate-300 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <p className="text-sm text-slate-400 mt-3">
                Optional. Shown to the candidate as sample cases alongside the problem.
              </p>
            </motion.div>

            <motion.div
              custom={5}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <AlertCircle size={20} className="text-cyan-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Hints</h3>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addHint}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  <Plus size={16} />
                  Add Hint
                </motion.button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {formData.hints.map((hint, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex gap-2"
                    >
                      <div className="flex-1">
                        <input
                          value={hint}
                          onChange={(e) => handleHintChange(index, e.target.value)}
                          className={inputStyle}
                          placeholder={`Hint ${index + 1}`}
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => removeHint(index)}
                        disabled={formData.hints.length === 1}
                        className="w-11 flex items-center justify-center rounded-xl border border-slate-300 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <p className="text-sm text-slate-400 mt-3">
                Optional. Candidates can request hints during the interview.
              </p>
            </motion.div>

            <motion.div
              custom={6}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="flex justify-end gap-4 border-t border-slate-200 pt-6"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 transition disabled:opacity-60 font-medium"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-60 transition font-medium shadow-sm shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {problem ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {problem ? "Update Problem" : "Save Problem"}
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
};

export default ProblemForm;
