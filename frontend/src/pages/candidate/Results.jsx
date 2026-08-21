import { useState } from "react";
import {
  CalendarIcon,
  UserCheckIcon,
  Code2Icon,
  HelpCircleIcon,
  BarChart3Icon,
  InboxIcon,
  SparklesIcon,
  DownloadIcon,
  Loader2Icon,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

import { useMyRecentSessions } from "../../hooks/useSessions";
import { sessionApi } from "../../api/sessions";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import RatingBadge from "../../components/RatingBadge";
import StatCard from "../admin/StatCard";
import { THEME, DIFFICULTY } from "../../constants/theme";
import { scoreToRating } from "../../utils/rating";

function DifficultyBadge({ difficulty }) {
  const d = DIFFICULTY[difficulty?.toLowerCase()] || DIFFICULTY.medium;
  return (
    <span
      className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: d.bg, color: d.text, boxShadow: `inset 0 0 0 1px ${d.border}` }}
    >
      {difficulty}
    </span>
  );
}

function DownloadReportButton({ sessionId }) {
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
      disabled={downloading}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60"
      style={{ background: THEME.primary, color: "#fff" }}
    >
      {downloading ? (
        <Loader2Icon size={12} className="animate-spin" />
      ) : (
        <DownloadIcon size={12} />
      )}
      Download Report (PDF)
    </button>
  );
}

function PerformanceReportSection({ session }) {
  const report = session.performanceReport;
  if (!report?.generatedAt) return null;

  const ratingRow = (label, value) => (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: THEME.inkMuted }}>{label}</span>
      <RatingBadge rating={scoreToRating(value)} size="sm" />
    </div>
  );

  return (
    <div
      className="mt-4 rounded-lg p-4"
      style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)", border: `1px solid ${THEME.border}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon size={14} color="#8B5CF6" />
        <span className="text-sm font-semibold" style={{ color: THEME.ink }}>
          AI Performance Report
        </span>
      </div>

      <p className="text-xs leading-relaxed mb-3" style={{ color: THEME.inkMuted }}>
        {report.summary}
      </p>

      <div className="grid grid-cols-1 gap-2 mb-3">
        {ratingRow("Coding", report.codingScore)}
        {ratingRow("Quiz", report.quizScore)}
        {ratingRow("Confidence", report.confidenceScore)}
      </div>

      <DownloadReportButton sessionId={session._id} />
    </div>
  );
}

function ResultCard({ session }) {
  const quizPct = session.quizResult?.total
    ? Math.round((session.quizResult.score / session.quizResult.total) * 100)
    : null;

  const hasContent = session.activeProblem || session.activeQuiz;

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold truncate" style={{ color: THEME.ink }}>
            {session.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: THEME.inkFaint }}>
            <CalendarIcon size={12} />
            {new Date(session.scheduledAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        <span
          className="text-[10.5px] font-semibold px-2.5 py-1 rounded-md whitespace-nowrap"
          style={{ background: THEME.surface2, color: THEME.inkMuted, border: `1px solid ${THEME.border}` }}
        >
          COMPLETED
        </span>
      </div>

      <div className="h-px my-4" style={{ background: THEME.border }} />

      <div className="flex items-center gap-2.5 text-sm mb-4" style={{ color: THEME.inkMuted }}>
        <UserCheckIcon size={14} color={THEME.inkFaint} />
        Interviewer:
        <span className="font-medium" style={{ color: THEME.ink }}>
          {session.interviewer?.name || "Unknown"}
        </span>
      </div>

      {!hasContent ? (
        <div
          className="flex items-center gap-2.5 text-sm rounded-lg px-3.5 py-3"
          style={{ background: THEME.surface2, color: THEME.inkFaint }}
        >
          <InboxIcon size={15} />
          No problem or quiz was recorded for this session.
        </div>
      ) : (
        <div className="space-y-3">
          {session.activeProblem && (
            <div
              className="flex items-center justify-between rounded-lg px-3.5 py-3"
              style={{ background: THEME.surface2 }}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium" style={{ color: THEME.ink }}>
                <Code2Icon size={14} color={THEME.primary} />
                {session.activeProblem.title}
              </div>
              {session.activeProblem.difficulty && (
                <DifficultyBadge difficulty={session.activeProblem.difficulty} />
              )}
            </div>
          )}

          {session.activeQuiz && (
            <div
              className="rounded-lg px-3.5 py-3"
              style={{ background: THEME.surface2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm font-medium" style={{ color: THEME.ink }}>
                  <HelpCircleIcon size={14} color="#8B5CF6" />
                  {session.activeQuiz.title}
                </div>
                {quizPct !== null ? (
                  <span className="text-sm font-bold" style={{ color: THEME.ink }}>
                    {session.quizResult.score}/{session.quizResult.total}
                    <span className="text-xs font-medium ml-1" style={{ color: THEME.inkFaint }}>
                      ({quizPct}%)
                    </span>
                  </span>
                ) : (
                  <span className="text-xs font-medium" style={{ color: THEME.inkFaint }}>Not attempted</span>
                )}
              </div>

              {quizPct !== null && (
                <div
                  className="h-1.5 rounded-full mt-2.5 overflow-hidden"
                  style={{ background: THEME.border }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${quizPct}%`,
                      background: quizPct >= 70 ? THEME.success : quizPct >= 40 ? THEME.warning : THEME.danger,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <PerformanceReportSection session={session} />
    </div>
  );
}

function EmptyResults() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl"
      style={{ border: `1px solid ${THEME.border}`, background: THEME.surface }}
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center"
        style={{ background: THEME.surface2 }}
      >
        <BarChart3Icon size={20} color={THEME.inkFaint} strokeWidth={2} />
      </div>
      <h2 className="text-sm font-semibold mt-4" style={{ color: THEME.ink }}>No results yet</h2>
      <p className="text-sm mt-1 max-w-xs" style={{ color: THEME.inkFaint }}>
        Once you complete an interview, it'll show up here with whatever problem or quiz you were given.
      </p>
    </div>
  );
}

const Results = () => {
  const { data, isLoading } = useMyRecentSessions();
  const sessions = data?.sessions || [];

  const quizzesWithScore = sessions.filter((s) => s.quizResult?.total);
  const avgQuizScore =
    quizzesWithScore.length > 0
      ? Math.round(
          (quizzesWithScore.reduce(
            (sum, s) => sum + s.quizResult.score / s.quizResult.total,
            0
          ) /
            quizzesWithScore.length) *
            100
        )
      : null;

  const problemsGiven = sessions.filter((s) => s.activeProblem).length;

  return (
    <AppShell scope="candidate">
      <div className="space-y-10">
        <PageHeader
          title="My Results"
          description="A record of every interview you've completed."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Interviews Completed"
            value={sessions.length}
            subtitle="All-time"
            icon={UserCheckIcon}
            color={THEME.primary}
          />
          <StatCard
            title="Coding Problems Given"
            value={problemsGiven}
            subtitle="Across all sessions"
            icon={Code2Icon}
            color={THEME.success}
          />
          <StatCard
            title="Avg Quiz Score"
            value={avgQuizScore !== null ? `${avgQuizScore}%` : "--"}
            subtitle={
              quizzesWithScore.length > 0
                ? `Across ${quizzesWithScore.length} quiz${quizzesWithScore.length !== 1 ? "zes" : ""}`
                : "No quizzes taken yet"
            }
            icon={BarChart3Icon}
            color="#8B5CF6"
          />
        </div>

        <div>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl animate-pulse"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, minHeight: 220 }}
                >
                  <div className="p-5 space-y-4">
                    <div className="h-5 w-2/3 rounded" style={{ background: THEME.surface2 }} />
                    <div className="h-3 w-1/3 rounded" style={{ background: THEME.surface2 }} />
                    <div className="h-px my-2" style={{ background: THEME.surface2 }} />
                    <div className="h-10 w-full rounded" style={{ background: THEME.surface2 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <EmptyResults />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sessions.map((session) => (
                <ResultCard key={session._id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Results;
