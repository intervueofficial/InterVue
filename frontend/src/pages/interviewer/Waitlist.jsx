import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Clock, Loader2, X } from "lucide-react";

import { applicationApi } from "../../api/applicationApi";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";

const DecisionPopover = ({ application, decision, onCancel, onConfirm, loading }) => {
  const [feedback, setFeedback] = useState("");

  const isHire = decision === "hired";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isHire ? "Select" : "Reject"} {application.candidate?.name}
            </h2>
            <p className="text-sm text-slate-500">{application.job?.title}</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <label className="text-sm font-semibold text-slate-700 mt-5 block">
          Feedback / message to candidate
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="Optional — this is included in the email sent to them"
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="px-5 py-2.5 rounded-xl border text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(feedback)}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 ${
              isHire ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Confirm & Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

const Waitlist = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(null); // { application, decision }

  const { data, isLoading } = useQuery({
    queryKey: ["waitlist"],
    queryFn: async () => applicationApi.getWaitlist(await getToken()),
  });

  const applications = data?.applications || [];

  const decisionMutation = useMutation({
    mutationFn: async ({ id, decision, feedback }) =>
      applicationApi.submitDecision(id, decision, feedback, await getToken()),
    onSuccess: (_, vars) => {
      toast.success(
        vars.decision === "hired"
          ? "Candidate selected — email sent"
          : "Candidate rejected — email sent"
      );
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      setPending(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to submit decision"),
  });

  return (
    <AppShell scope="interviewer">
      <PageHeader
        eyebrow="Interviewer"
        title="Waitlist"
        description="Candidates you interviewed but held for later — approve or reject when ready."
      />

      <div className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading waitlist...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Clock size={28} />
            No one is on the waitlist right now.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => (
              <div key={app._id} className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{app.candidate?.name}</div>
                  <div className="text-xs text-slate-400">{app.candidate?.email}</div>
                  <div className="text-sm text-slate-600 mt-1">{app.job?.title}</div>
                  {app.feedback && (
                    <p className="text-xs text-slate-400 mt-2 italic max-w-md">
                      Note: {app.feedback}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPending({ application: app, decision: "hired" })}
                    className="flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 text-sm font-semibold"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button
                    onClick={() => setPending({ application: app, decision: "rejected" })}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 text-sm font-semibold"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending && (
        <DecisionPopover
          application={pending.application}
          decision={pending.decision}
          loading={decisionMutation.isPending}
          onCancel={() => setPending(null)}
          onConfirm={(feedback) =>
            decisionMutation.mutate({
              id: pending.application._id,
              decision: pending.decision,
              feedback,
            })
          }
        />
      )}
    </AppShell>
  );
};

export default Waitlist;