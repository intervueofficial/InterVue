import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  BarChart3Icon,
  ActivityIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  CalendarDaysIcon,
} from "lucide-react";

import useAuthUser from "../../hooks/useAuthUser";
import { useActiveSessions, useMyRecentSessions } from "../../hooks/useSessions";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import StatCard from "../admin/StatCard";
import SessionGrid from "../../components/session/SessionGrid";
import CandidateDashboardLoading from "./CandidateDashboardLoading";
import { THEME } from "../../constants/theme";

/* ─── Skeleton for the session grid while loading ───────────────────────── */
function SkeletonSessionGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl animate-pulse"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, minHeight: 240 }}
        >
          <div className="p-5 space-y-4">
            <div className="h-5 w-2/3 rounded" style={{ background: THEME.surface2 }} />
            <div className="h-3 w-1/3 rounded" style={{ background: THEME.surface2 }} />
            <div className="h-px my-2" style={{ background: THEME.surface2 }} />
            <div className="h-3 w-1/2 rounded" style={{ background: THEME.surface2 }} />
            <div className="h-3 w-1/2 rounded" style={{ background: THEME.surface2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

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

function SectionHeader({ icon: Icon, title, count, viewAllTo }) {
  return (
    <div className="flex items-center justify-between mb-5">
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

      <Link
        to={viewAllTo}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
        style={{ color: THEME.primary }}
      >
        View all
        <ArrowRightIcon size={14} />
      </Link>
    </div>
  );
}

const CandidateDashboard = () => {
  const { user } = useUser();
  const { data: authUser } = useAuthUser();

  const { data: activeSessionsData, isLoading: loadingActive } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecent } = useMyRecentSessions();

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  // "My" upcoming interviews = active/waiting/live sessions I've already joined
  const myUpcoming = activeSessions.filter(
    (s) => s.candidate?._id === authUser?._id
  );

  const quizzesWithScore = recentSessions.filter((s) => s.quizResult?.total);
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

  const firstName = user?.firstName || "there";

  // Full-page skeleton while the primary data this view depends on is loading
  if (loadingActive || loadingRecent) {
    return (
      <AppShell scope="candidate">
        <CandidateDashboardLoading />
      </AppShell>
    );
  }

  return (
    <AppShell scope="candidate">
      <div className="space-y-12">
        <PageHeader
          eyebrow="Candidate"
          title="Dashboard"
          description={`Welcome back, ${firstName}. Here's what's happening with your interviews.`}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Upcoming Interviews"
            value={myUpcoming.length}
            subtitle="Scheduled, waiting, or live"
            icon={CalendarClockIcon}
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
          <StatCard
            title="Total Interviews"
            value={myUpcoming.length + recentSessions.length}
            subtitle="All-time sessions"
            icon={ActivityIcon}
            color={THEME.warning}
          />
        </div>

        {/* Upcoming interviews */}
        <div>
          <SectionHeader
            icon={CalendarClockIcon}
            title="Upcoming Interviews"
            count={myUpcoming.length}
            viewAllTo="/candidate/interviews"
          />

          {loadingActive ? (
            <SkeletonSessionGrid />
          ) : (
            <SessionGrid
              sessions={myUpcoming.slice(0, 3)}
              emptyTitle="No upcoming interviews"
              emptySubtitle="Once you join a scheduled session, it will show up here."
            />
          )}
        </div>

        {/* Quick links */}
        <div>
          <h2
            className="mb-5"
            style={{ fontFamily: THEME.fontDisplay, fontSize: 19, fontWeight: 600, color: THEME.ink, letterSpacing: "-0.01em" }}
          >
            Quick Links
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickLink
              to="/candidate/sessions"
              icon={CalendarDaysIcon}
              title="Browse Sessions"
              subtitle="Find and join an available interview"
            />
            <QuickLink
              to="/candidate/interviews"
              icon={ClipboardListIcon}
              title="My Interviews"
              subtitle="See everything you're scheduled for"
            />
            <QuickLink
              to="/candidate/results"
              icon={BarChart3Icon}
              title="My Results"
              subtitle="Review your past interview outcomes"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default CandidateDashboard;