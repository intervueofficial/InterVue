import { useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router";
import {
  ZapIcon,
  CheckCircle2Icon,
  UsersIcon,
  ActivityIcon,
  ClockIcon,
  ArrowRightIcon,
  BookOpenIcon,
  HelpCircleIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  TrophyIcon,
  FlameIcon,
  BriefcaseIcon,
  ListChecksIcon,
  SparklesIcon,
} from "lucide-react";

import { useActiveSessions, useMyRecentSessions } from "../hooks/useSessions";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import StatCard from "./admin/StatCard";
import SessionGrid from "../components/session/SessionGrid";
import { THEME, DIFFICULTY } from "../constants/theme";

/* ══════════════════════════════════════════════════════════════════════
   YouTube-style shimmer skeleton primitives
   A soft diagonal highlight sweeps left→right on a loop, layered over a
   flat base tone — same technique YouTube uses for its card skeletons.
   ══════════════════════════════════════════════════════════════════════ */

function Shimmer({ className = "", style = {}, radius = 8 }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: THEME.surface2, borderRadius: radius, ...style }}
    >
      <div
        className="absolute inset-0 shimmer-sweep"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)`,
        }}
      />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <Shimmer className="h-3 w-24" radius={4} />
        <Shimmer className="h-8 w-8" radius={10} />
      </div>
      <Shimmer className="h-7 w-16 mb-2" radius={6} />
      <Shimmer className="h-3 w-28" radius={4} />
    </div>
  );
}

function SessionCardSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, minHeight: 240 }}
    >
      {/* thumbnail-style top block, like a YouTube video card */}
      <Shimmer className="w-full" style={{ height: 110 }} radius={0} />

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-9 shrink-0" radius={9999} />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3.5 w-4/5" radius={4} />
            <Shimmer className="h-3 w-2/5" radius={4} />
          </div>
        </div>
        <div className="h-px my-1" style={{ background: THEME.border }} />
        <Shimmer className="h-3 w-3/5" radius={4} />
        <Shimmer className="h-3 w-2/5" radius={4} />
      </div>
    </div>
  );
}

function SkeletonSessionGrid({ count = 3 }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  );
}

function QuickLinkSkeleton() {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div className="flex items-center justify-between">
        <Shimmer className="h-9 w-9" radius={9999} />
        <Shimmer className="h-3.5 w-3.5" radius={4} />
      </div>
      <Shimmer className="h-3.5 w-2/3 mt-4" radius={4} />
      <Shimmer className="h-3 w-1/2 mt-2" radius={4} />
    </div>
  );
}

function ActivityRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <Shimmer className="h-9 w-9 shrink-0" radius={9999} />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3.5 w-1/3" radius={4} />
        <Shimmer className="h-3 w-1/5" radius={4} />
      </div>
      <Shimmer className="h-5 w-16 shrink-0" radius={9999} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Content components
   ══════════════════════════════════════════════════════════════════════ */

function QuickLink({ to, icon: Icon, title, subtitle }) {
  return (
    <Link to={to} className="block group">
      <div
        className="rounded-xl p-5 transition-colors duration-150"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
      >
        <div className="flex items-center justify-between">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: THEME.surface2 }}
          >
            <Icon size={16} color={THEME.inkMuted} strokeWidth={2} />
          </div>
          <ArrowRightIcon
            size={14}
            color={THEME.inkFaint}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </div>
        <div className="mt-3.5 text-sm font-semibold" style={{ color: THEME.ink }}>{title}</div>
        <div className="text-xs mt-1" style={{ color: THEME.inkFaint }}>{subtitle}</div>
      </div>
    </Link>
  );
}

function SectionHeader({ icon: Icon, title, count, viewAllTo, subtitle }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={18} color={THEME.inkFaint} />}
          <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 19, fontWeight: 600, color: THEME.ink, letterSpacing: "-0.01em" }}>
            {title}
          </h2>
          {typeof count === "number" && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: THEME.primaryTint, color: THEME.primary, border: `1px solid ${THEME.primaryTintBorder}` }}
            >
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: THEME.inkFaint }}>{subtitle}</p>
        )}
      </div>

      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors shrink-0"
          style={{ color: THEME.primary }}
        >
          View all
          <ArrowRightIcon size={14} />
        </Link>
      )}
    </div>
  );
}

function difficultyToken(difficulty) {
  const key = (difficulty || "").toLowerCase();
  return DIFFICULTY[key] || DIFFICULTY.easy;
}

function RecentActivityRow({ session }) {
  const candidateName = session.candidate?.name || "Unnamed candidate";
  const jobTitle = session.job?.title || session.title || "Interview session";
  const when = session.completedAt || session.updatedAt || session.createdAt;
  const whenLabel = when
    ? new Date(when).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "—";

  const quizPct =
    session.quizResult?.total > 0
      ? Math.round((session.quizResult.score / session.quizResult.total) * 100)
      : null;

  return (
    <div
      className="flex items-center gap-4 py-3.5"
      style={{ borderBottom: `1px solid ${THEME.border}` }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: THEME.primaryTint, color: THEME.primary }}
      >
        {candidateName.slice(0, 1).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: THEME.ink }}>
          {candidateName}
        </div>
        <div className="text-xs mt-0.5 truncate" style={{ color: THEME.inkFaint }}>
          {jobTitle} &middot; {whenLabel}
        </div>
      </div>

      {quizPct !== null ? (
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
          style={{
            background: quizPct >= 70 ? THEME.successTint : quizPct >= 40 ? THEME.warningTint : THEME.dangerTint,
            color: quizPct >= 70 ? THEME.success : quizPct >= 40 ? THEME.warning : THEME.danger,
          }}
        >
          {quizPct}% quiz
        </span>
      ) : (
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ background: THEME.surface2, color: THEME.inkFaint }}
        >
          Completed
        </span>
      )}
    </div>
  );
}

function ProgressBar({ label, value, tone }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span style={{ color: THEME.inkMuted }}>{label}</span>
        <span className="font-semibold" style={{ color: THEME.ink }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: THEME.surface2 }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: tone }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main dashboard
   ══════════════════════════════════════════════════════════════════════ */

const DashboardPage = () => {
  const { user } = useUser();

  const { data: activeSessionsData, isLoading: loadingActive } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecent } = useMyRecentSessions();

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const isLoading = loadingActive || loadingRecent;

  const uniqueCandidates = useMemo(
    () =>
      new Set(
        recentSessions.filter((s) => s.candidate?._id).map((s) => s.candidate._id)
      ).size,
    [recentSessions]
  );

  const { avgQuizPct, gradedQuizCount, codingSubmissions, hiredCount } = useMemo(() => {
    let quizTotal = 0;
    let quizCount = 0;
    let coding = 0;
    let hired = 0;

    for (const s of recentSessions) {
      if (s.quizResult?.total > 0) {
        quizTotal += (s.quizResult.score / s.quizResult.total) * 100;
        quizCount += 1;
      }
      if (s.codeResult?.total > 0) coding += 1;
      if (s.performanceReport?.generatedAt) hired += 1;
    }

    return {
      avgQuizPct: quizCount > 0 ? Math.round(quizTotal / quizCount) : 0,
      gradedQuizCount: quizCount,
      codingSubmissions: coding,
      hiredCount: hired,
    };
  }, [recentSessions]);

  const thisWeekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return recentSessions.filter((s) => {
      const t = new Date(s.completedAt || s.updatedAt || s.createdAt).getTime();
      return t >= weekAgo;
    }).length;
  }, [recentSessions]);

  const firstName = user?.firstName || "there";

  const recentActivity = recentSessions.slice(0, 5);

  return (
    <AppShell scope="interviewer">
      {/* Local styles for the shimmer animation */}
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-sweep {
          animation: shimmerSweep 1.6s ease-in-out infinite;
        }
      `}</style>

      <div className="space-y-12">
        <PageHeader
          eyebrow="Interviewer"
          title="Dashboard"
          description={`Welcome back, ${firstName}. Here's what's happening with your interviews.`}
        />

        {/* Primary stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Active Sessions"
              value={activeSessions.length}
              subtitle="Scheduled, waiting, or live"
              icon={ZapIcon}
              color={THEME.primary}
            />
            <StatCard
              title="Completed"
              value={recentSessions.length}
              subtitle="Interviews you've finished"
              icon={CheckCircle2Icon}
              color={THEME.success}
            />
            <StatCard
              title="Candidates Interviewed"
              value={uniqueCandidates}
              subtitle="Unique candidates met"
              icon={UsersIcon}
              color="#8B5CF6"
            />
            <StatCard
              title="Total Interviews"
              value={activeSessions.length + recentSessions.length}
              subtitle="All-time sessions"
              icon={ActivityIcon}
              color={THEME.warning}
            />
          </div>
        )}

        {/* Secondary stats — deeper signal, not just counts */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="This Week"
              value={thisWeekCount}
              subtitle="Interviews in the last 7 days"
              icon={FlameIcon}
              color={THEME.danger}
            />
            <StatCard
              title="Avg Quiz Score"
              value={gradedQuizCount > 0 ? `${avgQuizPct}%` : "—"}
              subtitle={gradedQuizCount > 0 ? `Across ${gradedQuizCount} graded quiz(zes)` : "No quizzes graded yet"}
              icon={TrophyIcon}
              color={THEME.info}
            />
            <StatCard
              title="Code Submissions"
              value={codingSubmissions}
              subtitle="Candidates graded on coding"
              icon={ListChecksIcon}
              color={THEME.success}
            />
            <StatCard
              title="Reports Generated"
              value={hiredCount}
              subtitle="AI performance reports sent"
              icon={SparklesIcon}
              color="#8B5CF6"
            />
          </div>
        )}

        {/* Active Sessions */}
        <div>
          <SectionHeader
            icon={ZapIcon}
            title="Active Sessions"
            count={isLoading ? undefined : activeSessions.length}
            viewAllTo="/sessions"
            subtitle="Sessions that are scheduled, waiting on someone, or currently live"
          />

          {loadingActive ? (
            <SkeletonSessionGrid />
          ) : (
            <SessionGrid
              sessions={activeSessions.slice(0, 3)}
              emptyTitle="No active sessions"
              emptySubtitle="Sessions waiting for an interviewer or candidate will show up here."
            />
          )}
        </div>

        {/* Two-column: Recent Sessions (wide) + Recent Activity feed (narrow) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <SectionHeader
              icon={ClockIcon}
              title="Recent Sessions"
              viewAllTo="/sessions"
            />

            {loadingRecent ? (
              <SkeletonSessionGrid />
            ) : (
              <SessionGrid
                sessions={recentSessions.slice(0, 3)}
                emptyTitle="No completed interviews yet"
                emptySubtitle="Interviews you've finished will show up here."
              />
            )}
          </div>

          <div>
            <SectionHeader
              icon={TrendingUpIcon}
              title="Recent Activity"
            />

            <div
              className="rounded-xl px-5"
              style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
            >
              {loadingRecent ? (
                <div className="divide-y" style={{ borderColor: THEME.border }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ActivityRowSkeleton key={i} />
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm" style={{ color: THEME.inkFaint }}>
                    No activity yet — completed interviews will appear here.
                  </p>
                </div>
              ) : (
                <div>
                  {recentActivity.map((s) => (
                    <RecentActivityRow key={s._id} session={s} />
                  ))}
                </div>
              )}
            </div>

            {!isLoading && gradedQuizCount > 0 && (
              <div
                className="rounded-xl p-5 mt-4 space-y-4"
                style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
              >
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: THEME.inkFaint }}>
                  Signal Snapshot
                </div>
                <ProgressBar label="Avg Quiz Accuracy" value={avgQuizPct} tone={THEME.info} />
                <ProgressBar
                  label="Candidates w/ Coding Data"
                  value={
                    recentSessions.length > 0
                      ? Math.round((codingSubmissions / recentSessions.length) * 100)
                      : 0
                  }
                  tone={THEME.success}
                />
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2
            className="mb-5"
            style={{ fontFamily: THEME.fontDisplay, fontSize: 19, fontWeight: 600, color: THEME.ink, letterSpacing: "-0.01em" }}
          >
            Quick Links
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <QuickLinkSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <QuickLink
                to="/problems"
                icon={BookOpenIcon}
                title="Coding Problems"
                subtitle="Browse the problem library"
              />
              <QuickLink
                to="/quiz"
                icon={HelpCircleIcon}
                title="Quizzes"
                subtitle="Review the quiz library"
              />
              <QuickLink
                to="/applicants"
                icon={BriefcaseIcon}
                title="Applicants"
                subtitle="Review candidates per job"
              />
              <QuickLink
                to="/waitlist"
                icon={ListChecksIcon}
                title="Waitlist"
                subtitle="Approve or reject held candidates"
              />
              <QuickLink
                to="/sessions"
                icon={CalendarDaysIcon}
                title="All Sessions"
                subtitle="See every scheduled interview"
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default DashboardPage;