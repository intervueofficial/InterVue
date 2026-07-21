import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  Save,
  Loader2,
  BookOpen,
  HelpCircle,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  Zap,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { quizApi } from "../../api/quizApi";
import AIGeneratorWizard from "../../components/AIGeneratorWizard";

const input =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm";

const textarea =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition resize-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const questionVariants = {
  hidden: { opacity: 0, x: -12, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: 12, scale: 0.95, transition: { duration: 0.15 } },
};

const optionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, delay: i * 0.05 },
  }),
};

const QuizForm = ({ quiz = null, onClose, onSuccess }) => {
  const { getToken } = useAuth();
  const editMode = !!quiz;
  const [loading, setLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [copiedText, setCopiedText] = useState(null);

  const [formData, setFormData] = useState({
    title: quiz?.title || "",
    description: quiz?.description || "",
    difficulty: quiz?.difficulty || "Easy",
    duration: quiz?.duration || 30,
    passingMarks: quiz?.passingMarks || 5,
    isPublished: quiz?.isPublished || false,
    showAnswers: quiz?.showAnswers !== false,
    randomizeQuestions: quiz?.randomizeQuestions || false,
    randomizeOptions: quiz?.randomizeOptions || false,
    questions: quiz?.questions || [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        marks: 1,
        explanation: "",
      },
    ],
  });

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const updateQuestion = (index, field, value) => {
    const questions = [...formData.questions];
    questions[index] = { ...questions[index], [field]: value };
    setFormData((prev) => ({ ...prev, questions }));
  };

  const updateOption = (qIndex, optionIndex, value) => {
    const questions = [...formData.questions];
    const options = [...questions[qIndex].options];
    options[optionIndex] = value;
    questions[qIndex] = { ...questions[qIndex], options };
    setFormData((prev) => ({ ...prev, questions }));
  };

  const addQuestion = () => {
    const newQuestion = {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1,
      explanation: "",
    };
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
    setExpandedQuestion(formData.questions.length);
  };

  const removeQuestion = (index) => {
    if (formData.questions.length === 1) {
      toast.error("Quiz must contain at least one question.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const duplicateQuestion = (index) => {
    const questionToDuplicate = JSON.parse(
      JSON.stringify(formData.questions[index])
    );
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions.slice(0, index + 1),
        questionToDuplicate,
        ...prev.questions.slice(index + 1),
      ],
    }));
  };

  const handleAIApply = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      toast.error("Unexpected AI response format.");
      return;
    }
    const questions = data.map((q) => ({
      question: q.question || "",
      options:
        Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ["", "", "", ""],
      correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
      marks: typeof q.marks === "number" ? q.marks : 1,
      explanation: q.explanation || "",
    }));
    setFormData((prev) => ({ ...prev, questions }));
    setExpandedQuestion(0);
    toast.success(`${questions.length} questions auto-filled by AI!`);
  };

  const copyQuestion = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.title.trim()) {
      toast.error("Quiz title is required.");
      return;
    }

    if (!formData.questions.length) {
      toast.error("Add at least one question.");
      return;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];

      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is empty.`);
        return;
      }

      if (q.options.some((option) => !option.trim())) {
        toast.error(`Fill all options for Question ${i + 1}.`);
        return;
      }
    }

    try {
      setLoading(true);
      const token = await getToken();

      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      if (editMode) {
        await quizApi.updateQuiz(quiz._id, payload, token);
        toast.success("Quiz updated successfully.");
      } else {
        await quizApi.createQuiz(payload, token);
        toast.success("Quiz created successfully.");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWizard = () => setShowWizard(false);

  return (
    <>
      {/* Wizard renders first, always on top with z-50 */}
      <AnimatePresence mode="wait">
        {showWizard && (
          <AIGeneratorWizard
            type="quiz"
            onClose={handleCloseWizard}
            onApply={handleAIApply}
          />
        )}
      </AnimatePresence>

      {/* Form modal sits below the wizard with z-40 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => !showWizard && onClose()}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6 bg-gradient-to-r from-slate-50 to-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-3xl font-bold text-slate-900">
                {editMode ? "Edit Quiz" : "Create Quiz"}
              </h2>
              <p className="text-slate-500 mt-1">
                {editMode
                  ? "Update quiz details and questions."
                  : "Build a new quiz for your candidates."}
              </p>
            </motion.div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition"
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
            className="p-8 space-y-8 max-h-[80vh] overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen size={20} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Quiz Details
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-medium text-slate-700">
                    Quiz Title
                  </label>
                  <input
                    className={input}
                    name="title"
                    placeholder="Example: JavaScript Fundamentals"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-slate-700">
                    Difficulty
                  </label>
                  <select
                    className={input}
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-slate-700">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className={input}
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-slate-700">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    min={0}
                    className={input}
                    name="passingMarks"
                    value={formData.passingMarks}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block mb-2 font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  name="description"
                  className={textarea}
                  placeholder="Briefly describe what this quiz covers..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Publish
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="showAnswers"
                    checked={formData.showAnswers}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Show Answers
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="randomizeQuestions"
                    checked={formData.randomizeQuestions}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Shuffle Q
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="randomizeOptions"
                    checked={formData.randomizeOptions}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Shuffle Opts
                  </span>
                </label>
              </div>
            </motion.div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <HelpCircle size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Questions ({formData.questions.length})
                  </h3>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addQuestion}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 flex items-center gap-2 transition shadow-sm shadow-blue-600/20 font-medium text-sm"
                >
                  <Plus size={16} />
                  Add Question
                </motion.button>
              </div>

              <AnimatePresence initial={false}>
                {formData.questions.map((question, index) => (
                  <motion.div
                    key={index}
                    variants={questionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden"
                  >
                    <motion.button
                      type="button"
                      onClick={() =>
                        setExpandedQuestion(
                          expandedQuestion === index ? null : index
                        )
                      }
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-100 transition group"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 line-clamp-1">
                            {question.question || "Untitled Question"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {question.marks} mark{question.marks > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{
                            rotate: expandedQuestion === index ? 180 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown
                            size={18}
                            className="text-slate-400 group-hover:text-slate-600 transition"
                          />
                        </motion.div>
                      </div>
                    </motion.button>

                    <AnimatePresence>
                      {expandedQuestion === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-slate-200 p-5 space-y-5 bg-white"
                        >
                          <div>
                            <label className="block mb-2 font-medium text-slate-700">
                              Question
                            </label>
                            <textarea
                              rows={3}
                              className={textarea}
                              placeholder="Enter Question..."
                              value={question.question}
                              onChange={(e) =>
                                updateQuestion(index, "question", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="block mb-3 font-medium text-slate-700">
                              Options
                            </label>
                            <div className="grid md:grid-cols-2 gap-3">
                              <AnimatePresence>
                                {question.options.map((option, optionIndex) => (
                                  <motion.div
                                    key={optionIndex}
                                    custom={optionIndex}
                                    variants={optionVariants}
                                    initial="hidden"
                                    animate="visible"
                                  >
                                    <input
                                      className={input}
                                      placeholder={`Option ${optionIndex + 1}`}
                                      value={option}
                                      onChange={(e) =>
                                        updateOption(
                                          index,
                                          optionIndex,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                              <label className="block mb-2 font-medium text-slate-700">
                                Correct Answer
                              </label>
                              <select
                                className={input}
                                value={question.correctAnswer}
                                onChange={(e) =>
                                  updateQuestion(
                                    index,
                                    "correctAnswer",
                                    Number(e.target.value)
                                  )
                                }
                              >
                                <option value={0}>Option 1</option>
                                <option value={1}>Option 2</option>
                                <option value={2}>Option 3</option>
                                <option value={3}>Option 4</option>
                              </select>
                            </div>

                            <div>
                              <label className="block mb-2 font-medium text-slate-700">
                                Marks
                              </label>
                              <input
                                type="number"
                                min={1}
                                className={input}
                                value={question.marks}
                                onChange={(e) =>
                                  updateQuestion(
                                    index,
                                    "marks",
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block mb-2 font-medium text-slate-700">
                              Explanation (Optional)
                            </label>
                            <textarea
                              rows={3}
                              className={textarea}
                              placeholder="Explain why this answer is correct..."
                              value={question.explanation}
                              onChange={(e) =>
                                updateQuestion(index, "explanation", e.target.value)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => duplicateQuestion(index)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition text-sm font-medium"
                            >
                              <Copy size={14} />
                              Duplicate
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => removeQuestion(index)}
                              disabled={formData.questions.length === 1}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-red-600 hover:bg-red-50 disabled:opacity-40 transition text-sm font-medium disabled:cursor-not-allowed"
                            >
                              <Trash2 size={14} />
                              Delete
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
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
                    {editMode ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editMode ? "Update Quiz" : "Save Quiz"}
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

export default QuizForm;
