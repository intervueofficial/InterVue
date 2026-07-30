import { Link } from "react-router";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react";

import useAuthUser from "../../hooks/useAuthUser";
import { useActiveSessions, useMyRecentSessions } from "../../hooks/useSessions";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import SessionGrid from "../../components/session/SessionGrid";
import { THEME } from "../../constants/theme";

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

function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
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
  );
}

function StatCard({ icon: Icon, label, value, delay }) {
  return (
    <div
      className="group flex items-center gap-4 rounded-xl px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-default animate-[fadeUp_0.4s_ease-out_both]"
      style={{
        background: THEME.surface,
        border: `1px solid ${THEME.border}`,
        animationDelay: `${delay}ms`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.03)")}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ background: THEME.primaryTint, border: `1px solid ${THEME.primaryTintBorder}` }}
      >
        <Icon size={17} color={THEME.primary} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}>
          {value}
        </p>
        <p className="text-xs mt-1" style={{ color: THEME.inkFaint }}>
          {label}
        </p>
      </div>
    </div>
  );
}

const MyInterviews = () => {
  const { data: authUser } = useAuthUser();

  const { data: activeSessionsData, isLoading: loadingActive } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecent } = useMyRecentSessions();

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const myUpcoming = activeSessions.filter(
    (s) => s.candidate?._id === authUser?._id
  );

  const firstName = authUser?.name?.split(" ")?.[0];

  return (
    <AppShell scope="candidate">
      <div className="space-y-12">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-9 animate-[fadeUp_0.4s_ease-out_both]"
          style={{
            background: `linear-gradient(135deg, ${THEME.ink} 0%, #1f2937 55%, ${THEME.ink} 100%)`,
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: THEME.primary }}
          />
          <div
            className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ background: THEME.primary }}
          />

          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon size={15} color={THEME.primary} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Candidate Dashboard
                </span>
              </div>
              <h1
                className="text-2xl md:text-[28px] font-bold tracking-tight"
                style={{ fontFamily: THEME.fontDisplay, color: "#fff" }}
              >
                {firstName ? `Welcome back, ${firstName}` : "My Interviews"}
              </h1>
              <p className="text-sm mt-2 max-w-md" style={{ color: "rgba(255,255,255,0.6)" }}>
                Everything you're scheduled for, live in, or have completed — all in one place.
              </p>
            </div>

            <Link
              to="/candidate/sessions"
              className="group flex items-center gap-2 rounded-md font-semibold text-[13px] px-5 py-3 transition-all duration-200 hover:-translate-y-0.5 w-fit"
              style={{ background: "#fff", color: THEME.ink }}
            >
              Browse Available Sessions
              <ArrowRightIcon size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md">
          <StatCard icon={CalendarClockIcon} label="Upcoming & live" value={myUpcoming.length} delay={60} />
          <StatCard icon={CheckCircle2Icon} label="Completed" value={recentSessions.length} delay={120} />
        </div>

        {/* Upcoming / live */}
        <div className="animate-[fadeUp_0.4s_ease-out_both]" style={{ animationDelay: "160ms" }}>
          <SectionHeader
            icon={CalendarClockIcon}
            title="Upcoming & Live"
            count={myUpcoming.length}
          />

          {loadingActive ? (
            <SkeletonSessionGrid />
          ) : (
            <SessionGrid
              sessions={myUpcoming}
              emptyTitle="No upcoming interviews"
              emptySubtitle="Browse available sessions and join one to get started."
            />
          )}
        </div>

        {/* Completed */}
        <div className="animate-[fadeUp_0.4s_ease-out_both]" style={{ animationDelay: "220ms" }}>
          <SectionHeader
            icon={CheckCircle2Icon}
            title="Completed"
            count={recentSessions.length}
          />

          {loadingRecent ? (
            <SkeletonSessionGrid />
          ) : (
            <SessionGrid
              sessions={recentSessions}
              emptyTitle="No completed interviews yet"
              emptySubtitle="Interviews you finish will show up here, along with results."
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
};

export default MyInterviews;