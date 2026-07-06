import { Link } from "react-router";
import { CalendarClockIcon, CheckCircle2Icon, ArrowRightIcon } from "lucide-react";

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

const MyInterviews = () => {
  const { data: authUser } = useAuthUser();

  const { data: activeSessionsData, isLoading: loadingActive } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecent } = useMyRecentSessions();

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const myUpcoming = activeSessions.filter(
    (s) => s.candidate?._id === authUser?._id
  );

  return (
    <AppShell scope="candidate">
      <div className="space-y-12">
        <PageHeader
          title="My Interviews"
          description="Everything you're scheduled for, live in, or have completed."
          actions={
            <Link
              to="/candidate/sessions"
              className="flex items-center gap-2 rounded-md font-semibold text-[13px] px-4 py-2.5 transition-colors"
              style={{ background: THEME.ink, color: THEME.surface }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Browse Available Sessions
              <ArrowRightIcon size={15} />
            </Link>
          }
        />

        {/* Upcoming / live */}
        <div>
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
        <div>
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
    </AppShell>
  );
};

export default MyInterviews;
