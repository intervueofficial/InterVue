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
} from "lucide-react";

import { useActiveSessions, useMyRecentSessions } from "../hooks/useSessions";
import Navbar from "../components/Navbar";
import StatCard from "./admin/StatCard";
import SessionGrid from "../components/session/SessionGrid";

/* ─── Skeleton for the session grids while loading ──────────────────────── */
function SkeletonSessionGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl bg-white border animate-pulse"
          style={{ borderColor: "#E5E9F0", minHeight: 240 }}
        >
          <div className="p-6 space-y-4">
            <div className="h-5 w-2/3 rounded bg-slate-100" />
            <div className="h-3 w-1/3 rounded bg-slate-100" />
            <div className="h-px my-2 bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-px my-2 bg-slate-100" />
            <div className="h-8 w-24 rounded-xl bg-slate-100 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Simple, honest navigation shortcuts (no fake marketing / CTAs) ────── */
function QuickLink({ to, icon: Icon, title, subtitle, color }) {
  return (
    <Link to={to} className="block group">
      <div
        className="rounded-xl bg-white border p-5 transition-all duration-150"
        style={{ borderColor: "#E5E9F0" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,23,42,0.05)";
          e.currentTarget.style.borderColor = "#CBD5E1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "#E5E9F0";
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#F1F5F9" }}
          >
            <Icon size={16} color="#475569" strokeWidth={2} />
          </div>
          <ArrowRightIcon
            size={14}
            className="text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </div>
        <div className="mt-3.5 text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
      </div>
    </Link>
  );
}

/* ─── Section header used above each session grid ───────────────────────── */
function SectionHeader({ icon: Icon, title, count, viewAllTo }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
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

      <Link
        to={viewAllTo}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
        style={{ color: "#2563EB" }}
      >
        View all
        <ArrowRightIcon size={14} />
      </Link>
    </div>
  );
}

const DashboardPage = () => {
  const { user } = useUser();

  const { data: activeSessionsData, isLoading: loadingActive } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecent } = useMyRecentSessions();

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const uniqueCandidates = new Set(
    recentSessions.filter((s) => s.candidate?._id).map((s) => s.candidate._id)
  ).size;

  const firstName = user?.firstName || "there";

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8 space-y-12">
        {/* Header */}
        <div>
          <h1
            className="text-4xl font-bold"
            style={{ color: "#2563EB", letterSpacing: "-0.5px" }}
          >
            Interviewer Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Welcome back, {firstName}. Here's what's happening with your interviews.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            title="Active Sessions"
            value={activeSessions.length}
            subtitle="Scheduled, waiting, or live"
            icon={ZapIcon}
            color="#2563EB"
          />
          <StatCard
            title="Completed"
            value={recentSessions.length}
            subtitle="Interviews you've finished"
            icon={CheckCircle2Icon}
            color="#10B981"
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
            color="#F59E0B"
          />
        </div>

        {/* Active Sessions */}
        <div>
          <SectionHeader
            icon={ZapIcon}
            title="Active Sessions"
            count={activeSessions.length}
            viewAllTo="/sessions"
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

        {/* Recent Sessions */}
        <div>
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

        {/* Quick links */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-5">
            Quick Links
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              to="/sessions"
              icon={CalendarDaysIcon}
              title="All Sessions"
              subtitle="See every scheduled interview"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
