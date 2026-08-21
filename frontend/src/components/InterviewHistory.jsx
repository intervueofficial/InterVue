import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  ArchiveIcon,
  DownloadIcon,
  Loader2Icon,
  RefreshCwIcon,
  AlertTriangleIcon,
  UserCircle2,
  XIcon,
  MailIcon,
  PhoneIcon,
  GraduationCapIcon,
  BriefcaseIcon,
} from "lucide-react";

import { sessionApi } from "../api/sessions";
import PageHeader from "./PageHeader";
import RatingBadge from "./RatingBadge";
import EmptyState from "../pages/admin/EmptyState";
import Loading from "../pages/admin/Loading";
import { THEME } from "../constants/theme";

const DECISION_BADGE = {
  hired: { text: "#059669", bg: "#ECFDF5", label: "Hired" },
  rejected: { text: "#DC2626", bg: "#FEF2F2", label: "Rejected" },
  waitlisted: { text: "#D97706", bg: "#FFFBEB", label: "Waitlisted" },
  pending: { text: "#6B6B76", bg: "#F5F4F1", label: "Pending" },
};

function DecisionBadge({ decision }) {
  const tokens = DECISION_BADGE[decision] || DECISION_BADGE.pending;
  return (
    <span
      className="text-[10.5px] font-semibold px-2.5 py-1 rounded-md whitespace-nowrap"
      style={{ background: tokens.bg, color: tokens.text }}
    >
      {tokens.label}
    </span>
  );
}

function Person({ user }) {
  if (!user) {
    return (
      <span className="flex items-center gap-2 text-sm" style={{ color: THEME.inkFaint }}>
        <UserCircle2 size={16} />
        Unknown
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <img
        src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "")}`}
        alt={user.name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        style={{ border: `1px solid ${THEME.border}` }}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: THEME.ink }}>{user.name}</p>
        <p className="text-xs truncate" style={{ color: THEME.inkFaint }}>{user.email}</p>
      </div>
    </div>
  );
}

function DownloadReportButton({ sessionId, disabled }) {
  const { getToken } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const token = await getToken();
      const blob = await sessionApi.downloadReport(sessionId, token);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `performance-report-${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Couldn't download the report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || downloading}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      style={{ background: disabled ? THEME.surface2 : THEME.primary, color: disabled ? THEME.inkFaint : "#fff" }}
      title={disabled ? "No report generated for this session yet" : "Download PDF report"}
    >
      {downloading ? <Loader2Icon size={12} className="animate-spin" /> : <DownloadIcon size={12} />}
      PDF
    </button>
  );
}

function ProfileDetailModal({ entry, onClose }) {
  if (!entry) return null;
  const profile = entry.profile || {};
  const candidate = entry.candidate || {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(23,23,31,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: THEME.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: `1px solid ${THEME.border}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={candidate.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name || "")}`}
              alt={candidate.name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              style={{ border: `1px solid ${THEME.border}` }}
            />
            <div className="min-w-0">
              <p className="text-base font-semibold truncate" style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}>
                {candidate.name}
              </p>
              <p className="text-xs truncate flex items-center gap-1" style={{ color: THEME.inkMuted }}>
                <MailIcon size={11} /> {candidate.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md flex-shrink-0" style={{ color: THEME.inkFaint }}>
            <XIcon size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {entry.jobTitle && (
            <div className="flex items-center gap-2 text-sm" style={{ color: THEME.ink }}>
              <BriefcaseIcon size={14} color={THEME.inkFaint} />
              Applied for <span className="font-medium">{entry.jobTitle}</span>
            </div>
          )}

          {profile.phone && (
            <div className="flex items-center gap-2 text-sm" style={{ color: THEME.ink }}>
              <PhoneIcon size={14} color={THEME.inkFaint} />
              {profile.phone}
            </div>
          )}

          {(profile.degree || profile.institution) && (
            <div className="flex items-center gap-2 text-sm" style={{ color: THEME.ink }}>
              <GraduationCapIcon size={14} color={THEME.inkFaint} />
              {[profile.degree, profile.fieldOfStudy, profile.institution].filter(Boolean).join(" • ")}
              {profile.yearOfGraduation ? ` (${profile.yearOfGraduation})` : ""}
            </div>
          )}

          {profile.experienceYears !== undefined && profile.experienceYears !== null && (
            <p className="text-sm" style={{ color: THEME.inkMuted }}>
              {profile.experienceYears} year{profile.experienceYears === 1 ? "" : "s"} of experience
            </p>
          )}

          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-[11px] font-medium px-2 py-1 rounded-md"
                  style={{ background: THEME.surface2, color: THEME.inkMuted }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {profile.resumeUrl && (
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: THEME.surface2, color: THEME.ink }}
            >
              View Resume
            </a>
          )}

          <div className="h-px" style={{ background: THEME.border }} />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: THEME.inkFaint, fontFamily: THEME.fontMono }}>
              AI Performance Report
            </p>
            {entry.performanceReport ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <RatingBadge rating={entry.performanceReport.codingRating} size="sm" />
                  <RatingBadge rating={entry.performanceReport.quizRating} size="sm" />
                  <RatingBadge rating={entry.performanceReport.confidenceRating} size="sm" />
                </div>
                {entry.performanceReport.summary && (
                  <p className="text-sm leading-relaxed" style={{ color: THEME.inkMuted }}>
                    {entry.performanceReport.summary}
                  </p>
                )}
                <DownloadReportButton sessionId={entry._id} />
              </div>
            ) : (
              <p className="text-sm" style={{ color: THEME.inkFaint }}>
                No AI report was generated for this session (it wasn't part of a decided job application).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * History page content — shared by /admin/history and /history
 * (interviewer). Lists every completed interview session in a table
 * with the candidate's profile snapshot and their AI performance
 * report, shown as letteric ratings (Excellent/Best/Better/Good/Worst)
 * rather than raw percentages. This report used to be emailed to the
 * candidate as a PDF attachment — it now lives here instead, viewable
 * and downloadable by interviewers/admins only.
 */
function InterviewHistory({ scope = "interviewer" }) {
  const { getToken } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState(null);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["session-history", scope],
    queryFn: async () => sessionApi.getHistory(await getToken()),
    retry: 1,
  });

  const history = data?.history || [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={scope === "admin" ? "Insights" : "Interviewer"}
        title="History"
        description="Every completed interview — candidate profile, job, decision, and the AI-generated performance report."
        actions={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg disabled:opacity-60"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.ink }}
          >
            <RefreshCwIcon size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {isError ? (
        <div className="flex flex-col items-center text-center py-16 rounded-xl" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
          <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: THEME.dangerTint }}>
            <AlertTriangleIcon size={20} color={THEME.danger} />
          </div>
          <p className="text-sm font-semibold" style={{ color: THEME.ink }}>Couldn't load interview history</p>
          <button
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ background: THEME.ink, color: THEME.surface }}
          >
            <RefreshCwIcon size={14} />
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <Loading />
      ) : !history.length ? (
        <EmptyState
          title="No interview history yet"
          description="Completed interview sessions will show up here with the candidate's profile and AI performance report."
        />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
          <div className="flex items-center justify-between px-8 py-6" style={{ borderBottom: `1px solid ${THEME.border}` }}>
            <div>
              <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 18, fontWeight: 600, color: THEME.ink }}>
                Interview Sessions
              </h2>
              <p className="mt-1 text-sm" style={{ color: THEME.inkMuted }}>
                {history.length} completed session{history.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ArchiveIcon size={20} color={THEME.inkFaint} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: THEME.surface2 }}>
                <tr className="text-left text-sm" style={{ color: THEME.inkMuted }}>
                  <th className="px-8 py-4 font-semibold">Candidate</th>
                  {scope === "admin" && <th className="px-6 py-4 font-semibold">Interviewer</th>}
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Decision</th>
                  <th className="px-6 py-4 font-semibold">Coding</th>
                  <th className="px-6 py-4 font-semibold">Quiz</th>
                  <th className="px-6 py-4 font-semibold">Confidence</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {history.map((entry) => (
                  <tr key={entry._id} style={{ borderTop: `1px solid ${THEME.border}` }}>
                    <td className="px-8 py-4">
                      <Person user={entry.candidate} />
                    </td>

                    {scope === "admin" && (
                      <td className="px-6 py-4">
                        <span className="text-sm" style={{ color: THEME.inkMuted }}>
                          {entry.interviewer?.name || "—"}
                        </span>
                      </td>
                    )}

                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: THEME.ink }}>
                        {entry.jobTitle || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: THEME.inkMuted }}>
                        {entry.completedAt
                          ? new Date(entry.completedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <DecisionBadge decision={entry.finalDecision} />
                    </td>

                    <td className="px-6 py-4">
                      <RatingBadge
                        rating={entry.performanceReport?.codingRating || entry.codingRating}
                        size="sm"
                      />
                    </td>

                    <td className="px-6 py-4">
                      <RatingBadge
                        rating={entry.performanceReport?.quizRating || entry.quizRating}
                        size="sm"
                      />
                    </td>

                    <td className="px-6 py-4">
                      <RatingBadge rating={entry.performanceReport?.confidenceRating} size="sm" />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{ background: THEME.surface2, color: THEME.ink }}
                        >
                          View
                        </button>
                        <DownloadReportButton
                          sessionId={entry._id}
                          disabled={!entry.performanceReport}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProfileDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
}

export default InterviewHistory;
