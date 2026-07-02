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
} from "lucide-react";
import toast from "react-hot-toast";
import { quizApi } from "../../api/quizApi";

const input =
  "w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 focus:border-blue-500";

const QuizForm = ({ quiz = null, onClose, onSuccess }) => {
  const { getToken } = useAuth();
  const editMode = !!quiz;

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: quiz?.title || "",
    description: quiz?.description || "",
    difficulty: quiz?.difficulty || "Easy",
    duration: quiz?.duration || 30,
    passingMarks: quiz?.passingMarks || 5,
    isPublished: quiz?.isPublished || false,
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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.type === "number"
          ? Number(e.target.value)
          : e.target.value,
    }));
  };

  const updateQuestion = (index, field, value) => {
    const questions = [...formData.questions];
    questions[index][field] = value;
    setFormData({ ...formData, questions });
  };

  const updateOption = (qIndex, optionIndex, value) => {
    const questions = [...formData.questions];
    questions[qIndex].options[optionIndex] = value;
    setFormData({ ...formData, questions });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
          marks: 1,
          explanation: "",
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    if (formData.questions.length === 1) {
      toast.error("Quiz must contain at least one question.");
      return;
    }
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
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

      toast.error(
        error.response?.data?.message || "Failed to save quiz."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl shadow-blue-950/20 overflow-hidden border border-slate-100"
      >

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6 bg-gradient-to-r from-blue-50 via-white to-white">

          <div>

            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {editMode ? "Edit Quiz" : "Create Quiz"}
            </h2>

            <p className="text-slate-500 mt-1">
              {editMode
                ? "Update quiz details and questions."
                : "Build a new quiz for your candidates."}
            </p>

          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-11 h-11 rounded-xl hover:bg-blue-100 text-slate-500 hover:text-blue-700 flex items-center justify-center transition"
          >
            <X />
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8 max-h-[80vh] overflow-y-auto"
        >

          {/* Quiz Details */}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
          >

            <div className="flex items-center gap-2 mb-6">

              <BookOpen className="text-blue-600" />

              <h3 className="text-xl font-semibold text-slate-900">
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
                  placeholder="Duration"
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
                  placeholder="Passing Marks"
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
                rows={4}
                name="description"
                className={`${input} resize-none`}
                placeholder="Briefly describe what this quiz covers..."
                value={formData.description}
                onChange={handleChange}
              />

            </div>

          </motion.div>

          {/* Questions */}

          <div className="space-y-6">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <HelpCircle className="text-blue-600" />

                <h3 className="text-2xl font-bold text-slate-900">
                  Questions
                </h3>

              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 flex items-center gap-2 transition shadow-sm shadow-blue-600/20"
              >
                <Plus size={18} />
                Add Question
              </button>

            </div>

            <AnimatePresence initial={false}>

              {formData.questions.map((question, index) => (

                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-50 rounded-3xl p-6 border border-slate-200"
                >

                  <div className="flex justify-between items-center mb-6">

                    <h4 className="text-lg font-semibold text-slate-900">
                      Question {index + 1}
                    </h4>

                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="w-10 h-10 rounded-xl hover:bg-red-100 text-slate-400 hover:text-red-600 flex justify-center items-center transition"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                  {/* Question */}

                  <textarea
                    rows={3}
                    className={input}
                    placeholder="Enter Question..."
                    value={question.question}
                    onChange={(e) =>
                      updateQuestion(index, "question", e.target.value)
                    }
                  />

                  {/* Options */}

                  <div className="grid md:grid-cols-2 gap-4 mt-6">

                    {question.options.map((option, optionIndex) => (

                      <input
                        key={optionIndex}
                        className={input}
                        placeholder={`Option ${optionIndex + 1}`}
                        value={option}
                        onChange={(e) =>
                          updateOption(index, optionIndex, e.target.value)
                        }
                      />

                    ))}

                  </div>

                  {/* Correct Answer */}

                  <div className="grid md:grid-cols-3 gap-5 mt-6">

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

                    <div className="flex items-end">

                      <label className="flex gap-3 items-center text-slate-700 select-none">

                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-blue-600"
                          checked={formData.isPublished}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isPublished: e.target.checked,
                            })
                          }
                        />

                        Publish Quiz

                      </label>

                    </div>

                  </div>

                  {/* Explanation */}

                  <div className="mt-6">

                    <label className="block mb-2 font-medium text-slate-700">
                      Explanation (Optional)
                    </label>

                    <textarea
                      rows={4}
                      className={input}
                      placeholder="Explain the answer..."
                      value={question.explanation}
                      onChange={(e) =>
                        updateQuestion(index, "explanation", e.target.value)
                      }
                    />

                  </div>

                </motion.div>

              ))}

            </AnimatePresence>

          </div>

          {/* Footer */}

          <div className="flex justify-end gap-4 border-t border-slate-200 pt-6">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-60 transition shadow-sm shadow-blue-600/20"
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

            </button>

          </div>

        </form>

      </motion.div>

    </div>
  );
};

export default QuizForm;