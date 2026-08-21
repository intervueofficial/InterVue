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
  Clock,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Layers,
  Building2,
} from "lucide-react";

import { jobApi } from "../../api/jobApi";
import { applicationApi } from "../../api/applicationApi";
import { identityApi } from "../../api/auth";
import useAuthUser from "../../hooks/useAuthUser";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import { THEME } from "../../constants/theme";

/* ─── Status badge config — data-driven, no hardcoded copy in JSX ───────── */
const STATUS_CONFIG = {
  applied: {
    label: "Awaiting Review",
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
    dot: "#2563EB",
  },
  not_eligible: {
    label: "Not Eligible",
    bg: "#FEF2F2",
    text: "#B91C1C",
    border: "#FECACA",
    dot: "#DC2626",
  },
  selected: {
    label: "Selected",
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#BBF7D0",
    dot: "#16A34A",
  },
  rejected: {
    label: "Not Selected",
    bg: "#F8FAFC",
    text: "#475569",
    border: "#E2E8F0",
    dot: "#64748B",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
      style={{ background: config.bg, color: config.text, boxShadow: `inset 0 0 0 1px ${config.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}

/* ─── Eligibility result modal ───────────────────────────────────────────── */
const EligibilityModal = ({ result, onClose }) => {
  if (!result) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15, 23, 42, 0.45)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white"
        style={{ border: `1px solid ${THEME.border}`, boxShadow: "0 20px 60px rgba(15,23,42,0.25)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: THEME.inkFaint }}
          onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <X size={16} />
        </button>

        <div className="p-8">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
            style={{
              background: result.isEligible ? "#F0FDF4" : "#FEF2F2",
            }}
          >
            {result.isEligible ? (
              <CheckCircle2 size={22} color="#16A34A" strokeWidth={2} />
            ) : (
              <XCircle size={22} color="#DC2626" strokeWidth={2} />
            )}
          </div>

          <h2
            style={{ fontFamily: THEME.fontDisplay, fontSize: 18, fontWeight: 600, color: THEME.ink }}
          >
            {result.isEligible ? "Application submitted" : "Criteria not met"}
          </h2>

          {result.isEligible ? (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: THEME.inkMuted }}>
              Your application has been sent to the interviewer for review. You'll be notified
              once a decision has been made.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: THEME.inkMuted }}>
                Your profile does not currently meet the requirements for this role:
              </p>
              <ul
                className="mt-4 rounded-xl p-4 space-y-2 text-sm"
                style={{ background: THEME.surface2, color: THEME.ink }}
              >
                {(result.failedCriteria || []).map((reason, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0" style={{ background: THEME.inkFaint }} />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors"
            style={{ background: THEME.ink, color: THEME.surface }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Job details modal ──────────────────────────────────────────────────── */
const JobDetailsModal = ({ job, onClose, profileComplete, identityRequired, onApply, isApplying }) => {
  if (!job) return null;

  const canApply = profileComplete && !identityRequired;

  const status = job.applicationStatus;
  const criteria = job.criteria || {};
  const hasCriteria =
    (criteria.requiredDegrees && criteria.requiredDegrees.length > 0) ||
    (criteria.requiredSkills && criteria.requiredSkills.length > 0) ||
    (criteria.minExperience && criteria.minExperience > 0) ||
    criteria.qualificationNote;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15, 23, 42, 0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white"
        style={{ border: `1px solid ${THEME.border}`, boxShadow: "0 20px 60px rgba(15,23,42,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors z-10"
          style={{ color: THEME.inkFaint, background: THEME.surface }}
          onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
          onMouseLeave={(e) => (e.currentTarget.style.background = THEME.surface)}
        >
          <X size={16} />
        </button>

        <div className="p-8">
          <div className="flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: THEME.surface2 }}
            >
              <Briefcase size={20} color={THEME.inkMuted} strokeWidth={2} />
            </div>

            <div className="min-w-0 flex-1 pr-8">
              <h2
                style={{ fontFamily: THEME.fontDisplay, fontSize: 19, fontWeight: 600, color: THEME.ink }}
              >
                {job.title}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs" style={{ color: THEME.inkFaint }}>
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    {job.location}
                  </span>
                )}
                {job.employmentType && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {job.employmentType}
                  </span>
                )}
                {job.department && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={12} />
                    {job.department}
                  </span>
                )}
              </div>

              {status && (
                <div className="mt-3">
                  <StatusBadge status={status} />
                </div>
              )}
            </div>
          </div>

          {job.description && (
            <div className="mt-6">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: THEME.inkFaint, letterSpacing: "0.04em" }}
              >
                About the role
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: THEME.inkMuted }}>
                {job.description}
              </p>
            </div>
          )}

          {hasCriteria && (
            <div className="mt-6">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: THEME.inkFaint, letterSpacing: "0.04em" }}
              >
                Requirements
              </p>

              <div className="space-y-3">
                {criteria.requiredDegrees && criteria.requiredDegrees.length > 0 && (
                  <div
                    className="flex items-start gap-3 rounded-lg px-3.5 py-3"
                    style={{ background: THEME.surface2 }}
                  >
                    <GraduationCap size={16} className="flex-shrink-0 mt-0.5" color={THEME.inkFaint} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: THEME.ink }}>
                        Accepted degrees
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: THEME.inkMuted }}>
                        {criteria.requiredDegrees.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {criteria.minExperience > 0 && (
                  <div
                    className="flex items-start gap-3 rounded-lg px-3.5 py-3"
                    style={{ background: THEME.surface2 }}
                  >
                    <Clock size={16} className="flex-shrink-0 mt-0.5" color={THEME.inkFaint} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: THEME.ink }}>
                        Minimum experience
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: THEME.inkMuted }}>
                        {criteria.minExperience} {criteria.minExperience === 1 ? "year" : "years"}
                      </p>
                    </div>
                  </div>
                )}

                {criteria.requiredSkills && criteria.requiredSkills.length > 0 && (
                  <div
                    className="flex items-start gap-3 rounded-lg px-3.5 py-3"
                    style={{ background: THEME.surface2 }}
                  >
                    <Layers size={16} className="flex-shrink-0 mt-0.5" color={THEME.inkFaint} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: THEME.ink }}>
                        Required skills
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {criteria.requiredSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-md"
                            style={{ background: THEME.surface, color: THEME.ink, border: `1px solid ${THEME.border}` }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {criteria.qualificationNote && (
                  <div
                    className="flex items-start gap-3 rounded-lg px-3.5 py-3"
                    style={{ background: THEME.surface2 }}
                  >
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" color={THEME.inkFaint} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: THEME.ink }}>
                        Additional note
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: THEME.inkMuted }}>
                        {criteria.qualificationNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3">
            {job.hasApplied ? (
              <button
                disabled
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold cursor-not-allowed"
                style={{ background: THEME.surface2, color: THEME.inkFaint }}
              >
                Already Applied
              </button>
            ) : (
              <button
                disabled={!canApply || isApplying}
                onClick={onApply}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: THEME.ink, color: THEME.surface }}
                onMouseEnter={(e) => !isApplying && (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                title={
                  identityRequired
                    ? "Verify your identity via DigiLocker in your Profile before applying"
                    : undefined
                }
              >
                {isApplying ? <Loader2 className="animate-spin" size={14} /> : null}
                {isApplying ? "Applying" : "Apply for this role"}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg py-2.5 px-5 text-sm font-semibold transition-colors"
              style={{ background: THEME.surface, color: THEME.ink, border: `1px solid ${THEME.border}` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = THEME.surface)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Loading skeleton ───────────────────────────────────────────────────── */
function JobListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl p-5 animate-pulse"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg" style={{ background: THEME.surface2 }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded" style={{ background: THEME.surface2 }} />
              <div className="h-3 w-1/4 rounded" style={{ background: THEME.surface2 }} />
            </div>
            <div className="h-8 w-20 rounded-lg" style={{ background: THEME.surface2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div
      className="rounded-xl p-12 text-center"
      style={{ background: THEME.surface, border: `1px dashed ${THEME.border}` }}
    >
      <div
        className="w-11 h-11 mx-auto rounded-xl flex items-center justify-center mb-3"
        style={{ background: THEME.surface2 }}
      >
        <Briefcase size={18} color={THEME.inkFaint} />
      </div>
      <p className="text-sm font-semibold" style={{ color: THEME.ink }}>
        No open roles right now
      </p>
      <p className="text-sm mt-1" style={{ color: THEME.inkFaint }}>
        New openings will appear here as soon as they're published.
      </p>
    </div>
  );
}

/* ─── Single job row ─────────────────────────────────────────────────────── */
function JobRow({ job, profileComplete, identityRequired, onApply, isApplying, onOpenDetails }) {
  const status = job.applicationStatus;
  const canApply = profileComplete && !identityRequired;

  return (
    <div
      className="rounded-xl transition-colors cursor-pointer"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
      onClick={onOpenDetails}
    >
      <div className="p-5 flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: THEME.surface2 }}
        >
          <Briefcase size={18} color={THEME.inkMuted} strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3
              style={{ fontFamily: THEME.fontDisplay, fontSize: 15, fontWeight: 600, color: THEME.ink }}
            >
              {job.title}
            </h3>
            {status && <StatusBadge status={status} />}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs" style={{ color: THEME.inkFaint }}>
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} />
                {job.location}
              </span>
            )}
            {job.employmentType && (
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {job.employmentType}
              </span>
            )}
            {job.department && (
              <span className="flex items-center gap-1.5">
                <ChevronRight size={12} />
                {job.department}
              </span>
            )}
          </div>

          {job.description && (
            <p className="mt-2.5 text-sm leading-relaxed line-clamp-2" style={{ color: THEME.inkMuted }}>
              {job.description}
            </p>
          )}

          {job.criteria?.qualificationNote && (
            <div
              className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
              style={{ background: THEME.surface2, color: THEME.inkMuted }}
            >
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" color={THEME.inkFaint} />
              <span>{job.criteria.qualificationNote}</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 md:pt-0.5">
          {job.hasApplied ? null : (
            <button
              disabled={!canApply || isApplying}
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="flex items-center gap-2 rounded-lg font-semibold text-[13px] px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: THEME.ink, color: THEME.surface }}
              onMouseEnter={(e) => !isApplying && (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {isApplying ? <Loader2 className="animate-spin" size={14} /> : null}
              {isApplying ? "Applying" : "Apply"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
const CandidateJobs = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["open-jobs"],
    queryFn: async () => jobApi.getOpenJobs(await getToken()),
  });

  const { data: identityStatus } = useQuery({
    queryKey: ["identity-status"],
    queryFn: async () => identityApi.getStatus(await getToken()),
  });

  const jobs = data?.jobs || [];
  const profileComplete = authUser?.candidateProfile?.isComplete;
  // Only actually blocks applying once the server has identity
  // verification turned on (REQUIRE_IDENTITY_VERIFICATION=true) — see
  // backend/IDENTITY_VERIFICATION_SETUP.md.
  const identityRequired =
    Boolean(identityStatus?.required) && !identityStatus?.verification?.verified;
  const selectedJob = jobs.find((j) => j._id === selectedJobId) || null;

  const applyMutation = useMutation({
    mutationFn: async (jobId) => applicationApi.applyToJob(jobId, await getToken()),
    onSuccess: (res) => {
      setSelectedJobId(null);
      setEligibilityResult(res);
      queryClient.invalidateQueries({ queryKey: ["open-jobs"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to submit application"),
  });

  const notAppliedCount = jobs.filter((j) => !j.hasApplied).length;
  const appliedCount = jobs.length - notAppliedCount;

  return (
    <AppShell scope="candidate">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Candidate"
          title="Jobs Board"
          description="Browse open roles. Your profile is checked against each role's criteria automatically when you apply."
        />

        {!profileComplete && (
          <div
            className="rounded-xl px-4 py-3.5 flex items-center justify-between gap-4"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
          >
            <div className="flex items-center gap-2.5 text-sm" style={{ color: "#92400E" }}>
              <AlertCircle size={16} />
              <span>Complete your profile before applying to a role.</span>
            </div>
            <Link
              to="/candidate/profile"
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: "#92400E" }}
            >
              Complete Profile
            </Link>
          </div>
        )}

        {profileComplete && identityRequired && (
          <div
            className="rounded-xl px-4 py-3.5 flex items-center justify-between gap-4"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
          >
            <div className="flex items-center gap-2.5 text-sm" style={{ color: "#92400E" }}>
              <AlertCircle size={16} />
              <span>Verify your identity via DigiLocker before applying to a role.</span>
            </div>
            <Link
              to="/candidate/profile"
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: "#92400E" }}
            >
              Verify Identity
            </Link>
          </div>
        )}

        {!isLoading && jobs.length > 0 && (
          <div className="flex items-center gap-2 text-sm" style={{ color: THEME.inkFaint }}>
            <span className="font-semibold" style={{ color: THEME.ink }}>{jobs.length}</span>
            <span>{jobs.length === 1 ? "role listed" : "roles listed"}</span>
            <span>·</span>
            <span className="font-semibold" style={{ color: THEME.ink }}>{appliedCount}</span>
            <span>applied</span>
            <span>·</span>
            <span className="font-semibold" style={{ color: THEME.ink }}>{notAppliedCount}</span>
            <span>not applied yet</span>
          </div>
        )}

        {isLoading ? (
          <JobListSkeleton />
        ) : jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobRow
                key={job._id}
                job={job}
                profileComplete={profileComplete}
                identityRequired={identityRequired}
                isApplying={applyMutation.isPending && applyMutation.variables === job._id}
                onApply={() => applyMutation.mutate(job._id)}
                onOpenDetails={() => setSelectedJobId(job._id)}
              />
            ))}
          </div>
        )}
      </div>

      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJobId(null)}
        profileComplete={profileComplete}
        identityRequired={identityRequired}
        isApplying={applyMutation.isPending && applyMutation.variables === selectedJobId}
        onApply={() => selectedJobId && applyMutation.mutate(selectedJobId)}
      />

      <EligibilityModal result={eligibilityResult} onClose={() => setEligibilityResult(null)} />
    </AppShell>
  );
};

export default CandidateJobs;