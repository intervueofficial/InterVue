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
  SparklesIcon,
} from "lucide-react";

import useAuthUser from "../../hooks/useAuthUser";
import { useActiveSessions, useMyRecentSessions } from "../../hooks/useSessions";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import StatCard from "../admin/StatCard";
import SessionGrid from "../../components/session/SessionGrid";
import CandidateDashboardLoading from "./CandidateDashboardLoading";
import { THEME } from "../../constants/theme";

function QuickLink({ to, icon: Icon, title, subtitle, delay = 0 }) {
  return (
    <Link
      to={to}
      className="block group animate-[fadeSlideIn_0.5s_ease-out_both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.15)]"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
      >
        <div className="flex items-center justify-between">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{ background: THEME.surface2 }}
          >
            <Icon size={16} color={THEME.inkMuted} strokeWidth={2} />
          </div>
          <ArrowRightIcon
            size={14}
            color={THEME.inkFaint}
            className="transition-transform duration-200 group-hover:translate-x-1"
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
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors group"
        style={{ color: THEME.primary }}
      >
        View all
        <ArrowRightIcon size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
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

  if (loadingActive || loadingRecent) {
    return (
      <AppShell scope="candidate">
        <CandidateDashboardLoading />
      </AppShell>
    );
  }

  const hasUpcoming = myUpcoming.length > 0;

  return (
    <AppShell scope="candidate">
      <div className="space-y-12">
        <div className="animate-[fadeSlideIn_0.5s_ease-out_both]">
          <PageHeader
            eyebrow="Candidate"
            title="Dashboard"
            description={`Welcome back, ${firstName}. Here's what's happening with your interviews.`}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="animate-[fadeSlideIn_0.5s_ease-out_both] transition-transform duration-200 hover:-translate-y-1" style={{ animationDelay: "0ms" }}>
            <StatCard
              title="Upcoming Interviews"
              value={myUpcoming.length}
              subtitle="Scheduled, waiting, or live"
              icon={CalendarClockIcon}
              color={THEME.primary}
            />
          </div>
          <div className="animate-[fadeSlideIn_0.5s_ease-out_both] transition-transform duration-200 hover:-translate-y-1" style={{ animationDelay: "60ms" }}>
            <StatCard
              title="Completed"
              value={recentSessions.length}
              subtitle="Interviews you've finished"
              icon={CheckCircle2Icon}
              color={THEME.success}
            />
          </div>
          <div className="animate-[fadeSlideIn_0.5s_ease-out_both] transition-transform duration-200 hover:-translate-y-1" style={{ animationDelay: "120ms" }}>
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
          <div className="animate-[fadeSlideIn_0.5s_ease-out_both] transition-transform duration-200 hover:-translate-y-1" style={{ animationDelay: "180ms" }}>
            <StatCard
              title="Total Interviews"
              value={myUpcoming.length + recentSessions.length}
              subtitle="All-time sessions"
              icon={ActivityIcon}
              color={THEME.warning}
            />
          </div>
        </div>

        {/* Upcoming interviews */}
        <div className="animate-[fadeSlideIn_0.5s_ease-out_both]" style={{ animationDelay: "220ms" }}>
          <SectionHeader
            icon={CalendarClockIcon}
            title="Upcoming Interviews"
            count={myUpcoming.length}
            viewAllTo="/candidate/interviews"
          />

          {hasUpcoming ? (
            <SessionGrid
              sessions={myUpcoming.slice(0, 3)}
              emptyTitle="No upcoming interviews"
              emptySubtitle="Once you join a scheduled session, it will show up here."
            />
          ) : (
            <div
              className="rounded-2xl p-10 flex flex-col items-center text-center"
              style={{ background: THEME.surface, border: `1px dashed ${THEME.border}` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: THEME.primaryTint }}
              >
                <CalendarClockIcon size={22} color={THEME.primary} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: THEME.ink }}>
                No upcoming interviews
              </h3>
              <p className="text-sm mt-1.5 max-w-sm" style={{ color: THEME.inkFaint }}>
                Once you join a scheduled session, it will show up here.
              </p>
              <Link
                to="/candidate/sessions"
                className="mt-5 flex items-center gap-2 rounded-lg font-semibold text-[13px] px-4 py-2.5 transition-colors"
                style={{ background: THEME.ink, color: THEME.surface }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Browse Available Sessions
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="animate-[fadeSlideIn_0.5s_ease-out_both]" style={{ animationDelay: "260ms" }}>
          <h2
            className="mb-5 flex items-center gap-2"
            style={{ fontFamily: THEME.fontDisplay, fontSize: 19, fontWeight: 600, color: THEME.ink, letterSpacing: "-0.01em" }}
          >
            <SparklesIcon size={16} color={THEME.inkFaint} />
            Quick Links
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickLink
              to="/candidate/sessions"
              icon={CalendarDaysIcon}
              title="Browse Sessions"
              subtitle="Find and join an available interview"
              delay={300}
            />
            <QuickLink
              to="/candidate/interviews"
              icon={ClipboardListIcon}
              title="My Interviews"
              subtitle="See everything you're scheduled for"
              delay={340}
            />
            <QuickLink
              to="/candidate/results"
              icon={BarChart3Icon}
              title="My Results"
              subtitle="Review your past interview outcomes"
              delay={380}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
};

export default CandidateDashboard;