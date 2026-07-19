import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
} from "lucide-react";

import { jobApi } from "../../api/jobApi";
import { applicationApi } from "../../api/applicationApi";
import useAuthUser from "../../hooks/useAuthUser";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";

const STATUS_LABEL = {
  applied: { text: "Applied — awaiting review", cls: "bg-blue-50 text-blue-700" },
  not_eligible: { text: "Not Eligible", cls: "bg-red-50 text-red-600" },
  selected: { text: "Selected 🎉", cls: "bg-green-50 text-green-700" },
  rejected: { text: "Not Selected", cls: "bg-slate-100 text-slate-500" },
};

const EligibilityModal = ({ result, onClose }) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 text-center">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center"
        >
          <X size={18} />
        </button>

        {result.isEligible ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">You're Eligible!</h2>
            <p className="text-slate-500 mt-2 text-sm">
              Your application has been sent to the interviewer for review.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <XCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Not Eligible</h2>
            <p className="text-slate-500 mt-2 text-sm mb-3">
              Your profile doesn't match this job's criteria:
            </p>
            <ul className="text-left text-sm text-red-600 space-y-1 bg-red-50 rounded-xl p-4">
              {result.failedCriteria.map((reason, i) => (
                <li key={i}>• {reason}</li>
              ))}
            </ul>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 font-medium"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

const CandidateJobs = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();
  const [eligibilityResult, setEligibilityResult] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["open-jobs"],
    queryFn: async () => jobApi.getOpenJobs(await getToken()),
  });

  const jobs = data?.jobs || [];
  const profileComplete = authUser?.candidateProfile?.isComplete;

  const applyMutation = useMutation({
    mutationFn: async (jobId) => applicationApi.applyToJob(jobId, await getToken()),
    onSuccess: (res) => {
      setEligibilityResult(res);
      queryClient.invalidateQueries({ queryKey: ["open-jobs"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to apply"),
  });

  return (
    <AppShell scope="candidate">
      <PageHeader
        eyebrow="Candidate"
        title="Jobs Board"
        description="Browse open roles and apply. We'll check your profile against the criteria instantly."
      />

      {!profileComplete && (
        <div className="mt-6 rounded-xl bg-amber-50 text-amber-700 text-sm px-4 py-3 flex items-center justify-between">
          <span>Complete your profile before applying to jobs.</span>
          <Link to="/candidate/profile" className="font-semibold underline">
            Go to Profile
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            No open jobs right now. Check back soon.
          </div>
        ) : (
          jobs.map((job) => {
            const status = job.applicationStatus && STATUS_LABEL[job.applicationStatus];

            return (
              <div
                key={job._id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Briefcase className="text-blue-600" size={24} />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {job.location}
                    </span>
                    <span>{job.employmentType}</span>
                  </div>
                  {job.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{job.description}</p>
                  )}
                  {job.criteria?.qualificationNote && (
                    <p className="text-xs text-slate-400 mt-2 italic">
                      {job.criteria.qualificationNote}
                    </p>
                  )}
                </div>

                <div>
                  {job.hasApplied ? (
                    <span className={`text-xs font-semibold px-3 py-2 rounded-full ${status?.cls}`}>
                      {status?.text}
                    </span>
                  ) : (
                    <button
                      disabled={!profileComplete || applyMutation.isPending}
                      onClick={() => applyMutation.mutate(job._id)}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium disabled:opacity-40 flex items-center gap-2"
                    >
                      {applyMutation.isPending && applyMutation.variables === job._id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <EligibilityModal result={eligibilityResult} onClose={() => setEligibilityResult(null)} />
    </AppShell>
  );
};

export default CandidateJobs;
