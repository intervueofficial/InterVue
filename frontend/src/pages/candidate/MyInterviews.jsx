import { Link } from "react-router";
import { CalendarClockIcon, CheckCircle2Icon, ArrowRightIcon } from "lucide-react";

import useAuthUser from "../../hooks/useAuthUser";
import { useActiveSessions, useMyRecentSessions } from "../../hooks/useSessions";
import Navbar from "../../components/Navbar";
import SessionGrid from "../../components/session/SessionGrid";

function SkeletonSessionGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl bg-white border animate-pulse"
          style={{ borderColor: "#E5E9F0", minHeight: 240 }}
        >
          <div className="p-5 space-y-4">
            <div className="h-5 w-2/3 rounded bg-slate-100" />
            <div className="h-3 w-1/3 rounded bg-slate-100" />
            <div className="h-px my-2 bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      {Icon && <Icon size={18} className="text-slate-400" />}
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      {typeof count === "number" && (
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(37,99,235,0.08)",
            color: "#2563EB",
            border: "1px solid rgba(37,99,235,0.16)",
          }}
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
    <div className="min-h-screen bg-[#EFF6FF]">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1
              className="text-4xl font-bold"
              style={{ color: "#2563EB", letterSpacing: "-0.5px" }}
            >
              My Interviews
            </h1>
            <p className="text-slate-500 mt-2">
              Everything you're scheduled for, live in, or have completed.
            </p>
          </div>

          <Link
            to="/candidate/sessions"
            className="flex items-center gap-2 rounded-xl font-semibold text-white px-5 py-3 text-sm transition-colors"
            style={{ background: "#2563EB" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1D4ED8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2563EB")}
          >
            Browse Available Sessions
            <ArrowRightIcon size={15} />
          </Link>
        </div>

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
    </div>
  );
};

export default MyInterviews;
