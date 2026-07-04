import {
  CalendarIcon,
  UserCheckIcon,
  Code2Icon,
  HelpCircleIcon,
  BarChart3Icon,
  InboxIcon,
} from "lucide-react";

import { useMyRecentSessions } from "../../hooks/useSessions";
import Navbar from "../../components/Navbar";
import StatCard from "../admin/StatCard";

const DIFF = {
  easy: { text: "#059669", bg: "#ECFDF5", border: "rgba(5,150,105,0.18)" },
  medium: { text: "#D97706", bg: "#FFFBEB", border: "rgba(217,119,6,0.18)" },
  hard: { text: "#DC2626", bg: "#FEF2F2", border: "rgba(220,38,38,0.18)" },
};

function DifficultyBadge({ difficulty }) {
  const d = DIFF[difficulty?.toLowerCase()] || DIFF.medium;
  return (
    <span
      className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: d.bg, color: d.text, border: `1px solid ${d.border}` }}
    >
      {difficulty}
    </span>
  );
}

function ResultCard({ session }) {
  const quizPct = session.quizResult?.total
    ? Math.round((session.quizResult.score / session.quizResult.total) * 100)
    : null;

  const hasContent = session.activeProblem || session.activeQuiz;

  return (
    <div
      className="rounded-xl bg-white border p-5"
      style={{ borderColor: "#E5E9F0" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{session.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
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
          style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E5E9F0" }}
        >
          COMPLETED
        </span>
      </div>

      <div className="h-px my-4" style={{ background: "#EEF2F7" }} />

      <div className="flex items-center gap-2.5 text-sm text-slate-500 mb-4">
        <UserCheckIcon size={14} color="#94A3B8" />
        Interviewer:
        <span className="font-medium text-slate-700">
          {session.interviewer?.name || "Unknown"}
        </span>
      </div>

      {!hasContent ? (
        <div
          className="flex items-center gap-2.5 text-sm text-slate-400 rounded-lg px-3.5 py-3"
          style={{ background: "#F8FAFC" }}
        >
          <InboxIcon size={15} />
          No problem or quiz was recorded for this session.
        </div>
      ) : (
        <div className="space-y-3">
          {session.activeProblem && (
            <div
              className="flex items-center justify-between rounded-lg px-3.5 py-3"
              style={{ background: "#F8FAFC" }}
            >
              <div className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                <Code2Icon size={14} color="#2563EB" />
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
              style={{ background: "#F8FAFC" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                  <HelpCircleIcon size={14} color="#8B5CF6" />
                  {session.activeQuiz.title}
                </div>
                {quizPct !== null ? (
                  <span className="text-sm font-bold text-slate-900">
                    {session.quizResult.score}/{session.quizResult.total}
                    <span className="text-xs text-slate-400 font-medium ml-1">
                      ({quizPct}%)
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Not attempted</span>
                )}
              </div>

              {quizPct !== null && (
                <div
                  className="h-1.5 rounded-full mt-2.5 overflow-hidden"
                  style={{ background: "#E2E8F0" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${quizPct}%`,
                      background: quizPct >= 70 ? "#10B981" : quizPct >= 40 ? "#F59E0B" : "#DC2626",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyResults() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border"
      style={{ borderColor: "#E5E9F0", background: "#fff" }}
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
      >
        <BarChart3Icon size={20} color="#94A3B8" strokeWidth={2} />
      </div>
      <h2 className="text-sm font-semibold text-slate-800 mt-4">No results yet</h2>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">
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
    <div className="min-h-screen bg-[#EFF6FF]">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8 space-y-10">
        <div>
          <h1
            className="text-4xl font-bold"
            style={{ color: "#2563EB", letterSpacing: "-0.5px" }}
          >
            My Results
          </h1>
          <p className="text-slate-500 mt-2">
            A record of every interview you've completed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="Interviews Completed"
            value={sessions.length}
            subtitle="All-time"
            icon={UserCheckIcon}
            color="#2563EB"
          />
          <StatCard
            title="Coding Problems Given"
            value={problemsGiven}
            subtitle="Across all sessions"
            icon={Code2Icon}
            color="#10B981"
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
                  className="rounded-xl bg-white border animate-pulse"
                  style={{ borderColor: "#E5E9F0", minHeight: 220 }}
                >
                  <div className="p-5 space-y-4">
                    <div className="h-5 w-2/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                    <div className="h-px my-2 bg-slate-100" />
                    <div className="h-10 w-full rounded bg-slate-100" />
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
    </div>
  );
};

export default Results;
