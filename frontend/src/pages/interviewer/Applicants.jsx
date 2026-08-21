import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, Loader2, Users, UserCircle, Eye, RefreshCw, ArrowUpDown, CalendarClock, Zap, X } from "lucide-react";

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

// How often to quietly re-check for new applicants in the background.
// A candidate applying shows up within this window without the
// interviewer having to do anything — the manual refresh button next to
// it is for "I want it right now" instead of waiting out the interval.
const AUTO_REFRESH_MS = 15000;

// Every sort option an interviewer could reasonably need when there are
// hundreds of applicants and no time to open each profile individually.
// Not-eligible candidates are always sunk to the bottom regardless of
// the chosen sort — they already failed the automated screening, so
// they shouldn't compete with eligible candidates for the top slots.
const SORT_OPTIONS = [
  {
    value: "experience_desc",
    label: "Most Experienced",
    compare: (a, b) =>
      (b.profileSnapshot?.experienceYears ?? -1) - (a.profileSnapshot?.experienceYears ?? -1),
  },
  {
    value: "experience_asc",
    label: "Least Experienced",
    compare: (a, b) =>
      (a.profileSnapshot?.experienceYears ?? 999) - (b.profileSnapshot?.experienceYears ?? 999),
  },
  {
    value: "skill_match_desc",
    label: "Best Skill Match",
    compare: (a, b) => (b.skillMatchCount ?? 0) - (a.skillMatchCount ?? 0),
  },
  {
    value: "skills_count_desc",
    label: "Most Skills Listed",
    compare: (a, b) =>
      (b.profileSnapshot?.skills?.length ?? 0) - (a.profileSnapshot?.skills?.length ?? 0),
  },
  {
    value: "grad_year_desc",
    label: "Most Recent Graduate",
    compare: (a, b) =>
      (b.profileSnapshot?.yearOfGraduation ?? -Infinity) -
      (a.profileSnapshot?.yearOfGraduation ?? -Infinity),
  },
  {
    value: "newest",
    label: "Newest Applied",
    compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  },
  {
    value: "oldest",
    label: "Oldest Applied",
    compare: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  },
  {
    value: "name_asc",
    label: "Name (A–Z)",
    compare: (a, b) => (a.candidate?.name || "").localeCompare(b.candidate?.name || ""),
  },
];

function sortApplications(applications, sortKey) {
  const option = SORT_OPTIONS.find((o) => o.value === sortKey) || SORT_OPTIONS[0];

  return [...applications].sort((a, b) => {
    // Eligible candidates always sit above not-eligible ones, no matter
    // which field the interviewer is sorting by.
    if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
    return option.compare(a, b);
  });
}

// Local datetime formatted for an <input type="datetime-local"> default
// value — "now + 24h", rounded to the next 15 minutes for a tidy default.
function defaultScheduleValue() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function ScheduleInterviewModal({ application, onClose, onConfirm, isSubmitting }) {
  const [mode, setMode] = useState("later"); // "now" | "later"
  const [value, setValue] = useState(defaultScheduleValue());

  if (!application) return null;

  const candidateName = application.candidate?.name || "this candidate";
  const isPast = mode === "later" && value && new Date(value).getTime() <= Date.now();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Schedule Interview
            </p>
            <p className="text-base font-semibold text-slate-900 mt-0.5">{candidateName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMode("now")}
              className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                mode === "now"
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Zap size={14} />
              Instant Interview
            </button>
            <button
              type="button"
              onClick={() => setMode("later")}
              className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                mode === "later"
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CalendarClock size={14} />
              Pick Date & Time
            </button>
          </div>

          {mode === "now" ? (
            <p className="text-xs text-slate-500 leading-relaxed">
              The candidate will get their interview invite immediately with no scheduled
              date shown — they can join whenever they're ready.
            </p>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Interview Date & Time
              </label>
              <input
                type="datetime-local"
                value={value}
                min={defaultScheduleValueMin()}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isPast ? (
                <p className="text-xs text-red-600 mt-1.5">Pick a time in the future.</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1.5">
                  The candidate gets a "shortlisted" email now confirming this date & time
                  — their interview link and code follow separately, exactly 1 hour before
                  the interview.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 text-slate-600 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting || isPast}
            onClick={() => onConfirm(mode === "now" ? null : new Date(value).toISOString())}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
            {isSubmitting ? "Sending Invite..." : "Confirm & Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function defaultScheduleValueMin() {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const Applicants = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState("");
  const [actingOn, setActingOn] = useState(null);
  const [viewingApplication, setViewingApplication] = useState(null);
  const [schedulingApplication, setSchedulingApplication] = useState(null);
  const [sortKey, setSortKey] = useState("experience_desc");

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

  const {
    data: appsData,
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["applicants", selectedJobId],
    queryFn: async () => applicationApi.getApplicantsForJob(selectedJobId, await getToken()),
    enabled: !!selectedJobId,
    // New applicants appear on their own — no need to leave the page
    // open and hit refresh repeatedly. Still refetches on tab focus too
    // (react-query default), which covers "I switched away and came back".
    refetchInterval: AUTO_REFRESH_MS,
    refetchIntervalInBackground: false,
  });

  const applications = appsData?.applications || [];

  const sortedApplications = useMemo(
    () => sortApplications(applications, sortKey),
    [applications, sortKey]
  );

  // Toast when a background poll (not the very first load, not a manual
  // click) reveals more applicants than we last had, so the interviewer
  // notices without staring at the table.
  const prevCountRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  useEffect(() => {
    if (!appsData) return;
    const count = applications.length;

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevCountRef.current = count;
      return;
    }

    if (prevCountRef.current !== null && count > prevCountRef.current) {
      const diff = count - prevCountRef.current;
      toast.success(`${diff} new applicant${diff > 1 ? "s" : ""} just came in`);
    }
    prevCountRef.current = count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appsData]);

  // Reset the "seen count" baseline whenever the selected job changes,
  // so switching jobs doesn't fire a stale "new applicants" toast.
  useEffect(() => {
    isFirstLoadRef.current = true;
    prevCountRef.current = null;
  }, [selectedJobId]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["applicants", selectedJobId] });

  const selectMutation = useMutation({
    mutationFn: async ({ id, scheduledAt }) =>
      applicationApi.selectApplicant(id, scheduledAt, await getToken()),
    onSuccess: () => {
      toast.success("Candidate selected — session created & email sent");
      invalidate();
      setActingOn(null);
      setSchedulingApplication(null);
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

  const lastUpdatedLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <AppShell scope="interviewer">
      <PageHeader
        eyebrow="Interviewer"
        title="Applicants"
        description="Review candidates who applied to a job, filtered by automated eligibility check."
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
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

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60 transition-colors"
          title="Check for new applicants now"
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>

        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 ml-2">
          <ArrowUpDown size={14} className="text-slate-400" />
          Sort:
        </label>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[190px]"
          title="Sort applicants so the strongest candidates surface first — no need to open every profile"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Auto-refreshing every {AUTO_REFRESH_MS / 1000}s
          {lastUpdatedLabel && <span>&middot; last updated {lastUpdatedLabel}</span>}
        </div>
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
              {sortedApplications.map((app) => (
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
                    {app.totalRequiredSkills > 0 && (
                      <div className="text-[11px] font-semibold text-emerald-600 mb-1">
                        {app.skillMatchCount}/{app.totalRequiredSkills} required skills matched
                      </div>
                    )}
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
                            onClick={() => setSchedulingApplication(app)}
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

      <ScheduleInterviewModal
        application={schedulingApplication}
        isSubmitting={selectMutation.isPending}
        onClose={() => setSchedulingApplication(null)}
        onConfirm={(scheduledAt) => {
          setActingOn(schedulingApplication._id);
          selectMutation.mutate({ id: schedulingApplication._id, scheduledAt });
        }}
      />
    </AppShell>
  );
};

export default Applicants;