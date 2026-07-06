import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { problemApi } from "../../api/problemApi";

const inputStyle =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const textareaStyle =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const monoTextareaStyle =
  "w-full rounded-xl border border-slate-300 bg-slate-900 text-slate-100 px-4 py-3 outline-none transition resize-y focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-mono text-sm";

const ProblemForm = ({ problem = null, onClose, onSuccess }) => {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);

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
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    const testCases = [...formData.testCases];
    testCases[index] = { ...testCases[index], [field]: value };
    setFormData((prev) => ({ ...prev, testCases }));
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
          (problem
            ? "Failed to update problem."
            : "Failed to create problem.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">

      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">

          <div>

            <h2 className="text-3xl font-bold text-slate-900">
              {problem ? "Edit Coding Problem" : "Add Coding Problem"}
            </h2>

            <p className="text-slate-500 mt-1">
              {problem
                ? "Update the coding challenge."
                : "Create a new interview coding challenge."}
            </p>

          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X />
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8 max-h-[85vh] overflow-y-auto"
        >

          {/* Basic */}

          <div className="bg-slate-50 rounded-2xl p-6">

            <div className="flex items-center gap-2 mb-6">

              <FileText className="text-blue-600" />

              <h3 className="text-lg font-semibold">
                Basic Information
              </h3>

            </div>

            <div className="grid md:grid-cols-2 gap-6">

              <div>

                <label className="block mb-2 font-medium">
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

                <label className="block mb-2 font-medium">
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

            </div>

          </div>

          {/* Tags */}

          <div className="bg-slate-50 rounded-2xl p-6">

            <div className="flex items-center gap-2 mb-5">

              <Tag className="text-green-600" />

              <h3 className="text-lg font-semibold">
                Tags
              </h3>

            </div>

            <input
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className={inputStyle}
              placeholder="Array, HashMap, Graph, DP"
            />

            <p className="text-sm text-slate-500 mt-2">
              Separate multiple tags using commas.
            </p>

          </div>

          {/* Description */}

          <div className="bg-slate-50 rounded-2xl p-6">

            <div className="flex items-center gap-2 mb-5">

              <BookOpen className="text-purple-600" />

              <h3 className="text-lg font-semibold">
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

          </div>

          {/* Starter Code */}

          <div className="bg-slate-50 rounded-2xl p-6">

            <div className="flex items-center gap-2 mb-5">

              <Code2 className="text-blue-600" />

              <h3 className="text-lg font-semibold">
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

            <p className="text-sm text-slate-500 mt-2">
              Optional. Shown in the candidate's code editor when this problem is pushed to a session.
            </p>

          </div>

          {/* Test Cases */}

          <div className="bg-slate-50 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-2">

                <FlaskConical className="text-amber-600" />

                <h3 className="text-lg font-semibold">
                  Test Cases
                </h3>

              </div>

              <button
                type="button"
                onClick={addTestCase}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus size={16} />
                Add Case
              </button>

            </div>

            <div className="space-y-4">
              {formData.testCases.map((tc, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-2 gap-3 bg-white rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Input
                    </label>
                    <input
                      value={tc.input}
                      onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
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
                        onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)}
                        className={inputStyle}
                        placeholder="[0, 1]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      disabled={formData.testCases.length === 1}
                      className="self-end mb-[1px] w-11 h-[46px] flex items-center justify-center rounded-xl border border-slate-300 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-500 mt-3">
              Optional. Shown to the candidate as sample cases alongside the problem.
            </p>

          </div>

          {/* Footer */}

          <div className="flex justify-end gap-4 border-t pt-6">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-60 transition"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  {problem ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {problem ? "Update Problem" : "Save Problem"}
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default ProblemForm;