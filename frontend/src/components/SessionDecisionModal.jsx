import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

const OPTIONS = [
  {
    key: "hired",
    label: "Select Candidate",
    desc: "Sends a hiring email with your feedback.",
    icon: CheckCircle2,
    activeCls: "border-green-500 bg-green-50 text-green-700",
    iconCls: "text-green-600",
  },
  {
    key: "rejected",
    label: "Reject Candidate",
    desc: "Sends a rejection email with your feedback.",
    icon: XCircle,
    activeCls: "border-red-500 bg-red-50 text-red-700",
    iconCls: "text-red-600",
  },
  {
    key: "waitlisted",
    label: "Keep on Wait",
    desc: "No email sent — decide later from the Waitlist.",
    icon: Clock,
    activeCls: "border-amber-500 bg-amber-50 text-amber-700",
    iconCls: "text-amber-600",
  },
];

/**
 * Shown right after an interviewer ends a session that's linked to
 * a job application. Lets them pick Select / Reject / Wait and
 * attach feedback, which (for select/reject) is emailed to the candidate.
 */
const SessionDecisionModal = ({ open, application, onSubmit, onSkip, loading }) => {
  const [decision, setDecision] = useState(null);
  const [feedback, setFeedback] = useState("");

  if (!open || !application) return null;

  return (
    <div className="fixed inset-0 z-[10050] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8">
        <h2 className="text-xl font-bold text-slate-900">Interview Complete</h2>
        <p className="text-slate-500 text-sm mt-1">
          Record a decision for{" "}
          <span className="font-semibold text-slate-700">{application.candidate?.name}</span>{" "}
          — {application.job?.title}
        </p>

        <div className="mt-6 space-y-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = decision === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDecision(opt.key)}
                className={`w-full text-left flex items-start gap-3 rounded-2xl border-2 px-4 py-3 transition-colors ${
                  active ? opt.activeCls : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className={`shrink-0 mt-0.5 ${active ? "" : opt.iconCls}`} size={20} />
                <div>
                  <div className={`font-semibold ${active ? "" : "text-slate-900"}`}>
                    {opt.label}
                  </div>
                  <div className={`text-xs ${active ? "opacity-80" : "text-slate-500"}`}>
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <label className="text-sm font-semibold text-slate-700">
            Feedback / message to candidate {decision === "waitlisted" && "(internal note)"}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder={
              decision === "rejected"
                ? "Optional — e.g. specific areas to improve"
                : decision === "hired"
                ? "Optional — e.g. what impressed you"
                : "Optional — note for yourself, not emailed"
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6 flex justify-between gap-3">
          <button
            onClick={onSkip}
            disabled={loading}
            className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Decide later
          </button>
          <button
            onClick={() => onSubmit(decision, feedback)}
            disabled={!decision || loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-40"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Confirm Decision
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDecisionModal;