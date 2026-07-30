import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Loader2, Users, UserCircle, Eye } from "lucide-react";

import { jobApi } from "../../api/jobApi";
import { applicationApi } from "../../api/applicationApi";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import CandidateProfileModal from "./CandidateProfileModal";

const STATUS_BADGE = {
  applied: "bg-blue-50 text-blue-700",
  not_eligible: "bg-red-50 text-red-600",
  selected: "bg-green-50 text-green-700",
  rejected: "bg-slate-100 text-slate-500",
};

const Applicants = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState("");
  const [actingOn, setActingOn] = useState(null);
  const [viewingApplication, setViewingApplication] = useState(null);

  // Interviewers see all jobs (open + closed) so they can review past postings too
  const { data: jobsData } = useQuery({
    queryKey: ["all-jobs-for-applicants"],
    queryFn: async () => jobApi.getAllJobs(await getToken()),
  });

  const jobs = jobsData?.jobs || [];

  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0]._id);
    }
  }, [jobs, selectedJobId]);

  const { data: appsData, isLoading } = useQuery({
    queryKey: ["applicants", selectedJobId],
    queryFn: async () => applicationApi.getApplicantsForJob(selectedJobId, await getToken()),
    enabled: !!selectedJobId,
  });

  const applications = appsData?.applications || [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["applicants", selectedJobId] });

  const selectMutation = useMutation({
    mutationFn: async (id) => applicationApi.selectApplicant(id, await getToken()),
    onSuccess: () => {
      toast.success("Candidate selected — session created & email sent");
      invalidate();
      setActingOn(null);
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || "Failed to select candidate");
      setActingOn(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => applicationApi.rejectApplicant(id, await getToken()),
    onSuccess: () => {
      toast.success("Candidate rejected");
      invalidate();
      setActingOn(null);
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || "Failed to reject candidate");
      setActingOn(null);
    },
  });

  return (
    <AppShell scope="interviewer">
      <PageHeader
        eyebrow="Interviewer"
        title="Applicants"
        description="Review candidates who applied to a job, filtered by automated eligibility check."
      />

      <div className="mt-6 flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">Job:</label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[260px]"
        >
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.title} ({job.status})
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading applicants...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Users size={28} />
            No applicants for this job yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-6 py-4">Candidate</th>
                <th className="text-left px-6 py-4">Degree</th>
                <th className="text-left px-6 py-4">Experience</th>
                <th className="text-left px-6 py-4">Skills</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-right px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden shrink-0">
                        {app.candidate?.profileImage ? (
                          <img
                            src={app.candidate.profileImage}
                            alt={app.candidate?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserCircle className="text-blue-600" size={18} />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{app.candidate?.name}</div>
                        <div className="text-slate-400 text-xs">{app.candidate?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {app.profileSnapshot?.degree}
                    <div className="text-xs text-slate-400">
                      {app.profileSnapshot?.fieldOfStudy}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {app.profileSnapshot?.experienceYears} yrs
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {(app.profileSnapshot?.skills || []).map((s, i) => (
                        <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[app.status]}`}>
                      {app.status.replace("_", " ")}
                    </span>
                    {!app.isEligible && app.failedCriteria?.length > 0 && (
                      <div className="text-[11px] text-red-500 mt-1 max-w-[200px]">
                        {app.failedCriteria.join("; ")}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => setViewingApplication(app)}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 text-xs font-semibold"
                      >
                        <Eye size={14} />
                        View Profile
                      </button>

                      {app.status === "applied" && (
                        <>
                          <button
                            disabled={actingOn === app._id}
                            onClick={() => {
                              setActingOn(app._id);
                              selectMutation.mutate(app._id);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          >
                            {actingOn === app._id && selectMutation.isPending ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            Select
                          </button>
                          <button
                            disabled={actingOn === app._id}
                            onClick={() => {
                              setActingOn(app._id);
                              rejectMutation.mutate(app._id);
                            }}
                            className="flex items-center gap-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          >
                            {actingOn === app._id && rejectMutation.isPending ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <XCircle size={14} />
                            )}
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CandidateProfileModal
        application={viewingApplication}
        onClose={() => setViewingApplication(null)}
      />
    </AppShell>
  );
};

export default Applicants;
