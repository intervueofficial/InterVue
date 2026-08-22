import { useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";

const emptyJob = {
  title: "",
  description: "",
  fieldOfStudy: "",
  location: "Remote",
  employmentType: "Full-time",
  expectedResponseDays: 7,
  criteria: {
    requiredDegrees: [],
    minExperience: 0,
    requiredSkills: [],
    qualificationNote: "",
  },
};

const JobForm = ({ open, job, onCancel, onSubmit, loading }) => {
  // Spread over emptyJob (not just `job || emptyJob`) so editing a job
  // created before the department -> fieldOfStudy rename doesn't leave
  // the input uncontrolled (undefined value) if that job doc predates
  // the field.
  const [form, setForm] = useState(job ? { ...emptyJob, ...job } : emptyJob);
  const [degreeInput, setDegreeInput] = useState("");
  const [skillInput, setSkillInput] = useState("");

  if (!open) return null;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const updateCriteria = (field, value) =>
    setForm((f) => ({ ...f, criteria: { ...f.criteria, [field]: value } }));

  const addTag = (field, value, setValue) => {
    if (!value.trim()) return;
    updateCriteria(field, [...(form.criteria[field] || []), value.trim()]);
    setValue("");
  };

  const removeTag = (field, index) =>
    updateCriteria(
      field,
      form.criteria[field].filter((_, i) => i !== index)
    );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex justify-between items-center px-8 py-6 border-b">
          <h2 className="text-2xl font-bold">
            {job ? "Edit Job" : "Post New Job"}
          </h2>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          >
            <X />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="text-sm font-semibold text-slate-700">Job Title</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Role summary, responsibilities..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Field of Study</label>
              <input
                value={form.fieldOfStudy}
                onChange={(e) => update("fieldOfStudy", e.target.value)}
                placeholder="e.g. Computer Science"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Matches the "Field of Study" candidates fill in their own profile — e.g.
                "Computer Science", "Electronics", "Mechanical Engineering".
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Location</label>
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Employment Type</label>
            <select
              value={form.employmentType}
              onChange={(e) => update("employmentType", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Expected Response Time (days)
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={form.expectedResponseDays ?? 7}
              onChange={(e) => update("expectedResponseDays", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Shown to candidates in their "application received" email — e.g. "You can
              expect to hear back within {form.expectedResponseDays ?? 7} days." Set an
              honest window your team can actually meet.
            </p>
          </div>

          <div className="border-t pt-5">
            <h3 className="font-bold text-slate-800 mb-3">Eligibility Criteria</h3>
            <p className="text-xs text-slate-500 mb-4">
              Candidates must match every criterion below to be eligible to apply.
            </p>

            <label className="text-sm font-semibold text-slate-700">Accepted Degrees</label>
            <div className="flex gap-2 mt-1">
              <input
                value={degreeInput}
                onChange={(e) => setDegreeInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), addTag("requiredDegrees", degreeInput, setDegreeInput))
                }
                placeholder="e.g. B.Tech — press Enter"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => addTag("requiredDegrees", degreeInput, setDegreeInput)}
                className="px-4 rounded-xl bg-slate-100 hover:bg-slate-200"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.criteria.requiredDegrees.map((d, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {d}
                  <Trash2
                    size={12}
                    className="cursor-pointer"
                    onClick={() => removeTag("requiredDegrees", i)}
                  />
                </span>
              ))}
            </div>

            <label className="text-sm font-semibold text-slate-700 mt-4 block">
              Minimum Experience (years)
            </label>
            <input
              type="number"
              min={0}
              value={form.criteria.minExperience}
              onChange={(e) => updateCriteria("minExperience", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="text-sm font-semibold text-slate-700 mt-4 block">
              Required Skills
            </label>
            <div className="flex gap-2 mt-1">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), addTag("requiredSkills", skillInput, setSkillInput))
                }
                placeholder="e.g. React — press Enter"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => addTag("requiredSkills", skillInput, setSkillInput)}
                className="px-4 rounded-xl bg-slate-100 hover:bg-slate-200"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.criteria.requiredSkills.map((s, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {s}
                  <Trash2
                    size={12}
                    className="cursor-pointer"
                    onClick={() => removeTag("requiredSkills", i)}
                  />
                </span>
              ))}
            </div>

            <label className="text-sm font-semibold text-slate-700 mt-4 block">
              Qualification Note (shown to candidates, not auto-matched)
            </label>
            <input
              value={form.criteria.qualificationNote}
              onChange={(e) => updateCriteria("qualificationNote", e.target.value)}
              placeholder="e.g. CS/IT specialization preferred"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t px-8 py-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 rounded-xl border hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={loading || !form.title.trim()}
            onClick={() => onSubmit(form)}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Saving...
              </>
            ) : job ? (
              "Save Changes"
            ) : (
              "Post Job"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobForm;
