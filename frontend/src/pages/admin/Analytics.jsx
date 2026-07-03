import {
  CalendarClock,
  CheckCircle2,
  Clock,
  MonitorPlay,
} from "lucide-react";

import { useAdminAnalytics } from "../../hooks/useAdmin";
import StatCard from "./StatCard";
import AnalyticsChart from "./AnalyticsChart";

const STATUS_META = {
  scheduled: { label: "Scheduled", color: "#2563EB" },
  waiting: { label: "Waiting", color: "#B45309" },
  live: { label: "Live", color: "#15803D" },
  completed: { label: "Completed", color: "#475569" },
  cancelled: { label: "Cancelled", color: "#DC2626" },
};

const DIFFICULTY_META = {
  Easy: { label: "Easy", color: "#15803D" },
  Medium: { label: "Medium", color: "#B45309" },
  Hard: { label: "Hard", color: "#DC2626" },
};

const ROLE_META = {
  candidate: { label: "Candidates", color: "#2563EB" },
  interviewer: { label: "Interviewers", color: "#7C3AED" },
  admin: { label: "Admins", color: "#0F172A" },
  unassigned: { label: "Unassigned", color: "#94A3B8" },
};

const BreakdownCard = ({ title, subtitle, entries, meta, total }) => {
  return (
    <>
      <style>{`
        .breakdown-card{
          background:#fff;
          border:1px solid #E2E8F0;
          border-radius:22px;
          padding:26px;
          transition:.25s;
        }

        .breakdown-card:hover{
          box-shadow:0 20px 45px rgba(15,23,42,.06);
          border-color:#CBD5E1;
        }

        .breakdown-title{
          font-size:16px;
          font-weight:700;
          color:#0F172A;
        }

        .breakdown-subtitle{
          font-size:13px;
          color:#94A3B8;
          margin-top:4px;
        }

        .breakdown-row{
          margin-top:18px;
        }

        .breakdown-row-top{
          display:flex;
          justify-content:space-between;
          align-items:center;
          font-size:13px;
          margin-bottom:6px;
        }

        .breakdown-label{
          display:flex;
          align-items:center;
          gap:8px;
          color:#334155;
          font-weight:600;
        }

        .breakdown-dot{
          width:8px;
          height:8px;
          border-radius:50%;
          flex-shrink:0;
        }

        .breakdown-value{
          color:#0F172A;
          font-weight:700;
        }

        .breakdown-track{
          height:8px;
          border-radius:99px;
          background:#EFF6FF;
          overflow:hidden;
        }

        .breakdown-fill{
          height:100%;
          border-radius:99px;
          transition:width .4s cubic-bezier(.4,0,.2,1);
        }
      `}</style>

      <div className="breakdown-card">
        <div className="breakdown-title">{title}</div>
        {subtitle && <div className="breakdown-subtitle">{subtitle}</div>}

        {entries.length === 0 && (
          <div style={{ marginTop: 18, fontSize: 13, color: "#94A3B8" }}>
            No data yet.
          </div>
        )}

        {entries.map(([key, count]) => {
          const info = meta[key] || { label: key, color: "#94A3B8" };
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div className="breakdown-row" key={key}>
              <div className="breakdown-row-top">
                <span className="breakdown-label">
                  <span
                    className="breakdown-dot"
                    style={{ background: info.color }}
                  />
                  {info.label}
                </span>
                <span className="breakdown-value">
                  {count} <span style={{ color: "#94A3B8", fontWeight: 500 }}>({pct}%)</span>
                </span>
              </div>

              <div className="breakdown-track">
                <div
                  className="breakdown-fill"
                  style={{ width: `${pct}%`, background: info.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Analytics = () => {
  const { data, isLoading, isError } = useAdminAnalytics();

  const analytics = data?.analytics;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span
          className="loading loading-spinner loading-lg"
          style={{ color: "#2563EB" }}
        ></span>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div>
        <h1 className="text-4xl font-bold" style={{ color: "#2563EB" }}>
          Analytics
        </h1>
        <p className="text-slate-500 mt-3">
          Couldn't load analytics data. Please try again shortly.
        </p>
      </div>
    );
  }

  const {
    totalSessions,
    completionRate,
    avgDurationMinutes,
    sessionsByStatus,
    problemsByDifficulty,
    usersByRole,
    sessionsOverTime,
  } = analytics;

  const liveSessions = sessionsByStatus.live || 0;

  const statusEntries = Object.entries(sessionsByStatus).sort(
    (a, b) => b[1] - a[1]
  );
  const difficultyEntries = Object.entries(problemsByDifficulty).sort(
    (a, b) => b[1] - a[1]
  );
  const roleEntries = Object.entries(usersByRole).sort((a, b) => b[1] - a[1]);

  const totalProblems = difficultyEntries.reduce((sum, [, c]) => sum + c, 0);
  const totalUsers = roleEntries.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-4xl font-bold"
          style={{ color: "#2563EB", letterSpacing: "-0.5px" }}
        >
          Analytics
        </h1>

        <p className="text-slate-500 mt-2">
          Platform activity and performance at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Sessions"
          value={totalSessions}
          subtitle="All time interview sessions"
          icon={MonitorPlay}
          color="#2563EB"
        />

        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtitle="Sessions marked completed"
          icon={CheckCircle2}
          color="#15803D"
        />

        <StatCard
          title="Avg. Duration"
          value={avgDurationMinutes > 0 ? `${avgDurationMinutes}m` : "--"}
          subtitle="Average completed session length"
          icon={Clock}
          color="#B45309"
        />

        <StatCard
          title="Live Right Now"
          value={liveSessions}
          subtitle="Sessions currently in progress"
          icon={CalendarClock}
          color="#7C3AED"
        />
      </div>

      <AnalyticsChart
        data={sessionsOverTime}
        title="Sessions Created"
        subtitle="Last 14 days"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <BreakdownCard
          title="Sessions by Status"
          subtitle={`${totalSessions} total`}
          entries={statusEntries}
          meta={STATUS_META}
          total={totalSessions}
        />

        <BreakdownCard
          title="Problems by Difficulty"
          subtitle={`${totalProblems} total`}
          entries={difficultyEntries}
          meta={DIFFICULTY_META}
          total={totalProblems}
        />

        <BreakdownCard
          title="Users by Role"
          subtitle={`${totalUsers} total`}
          entries={roleEntries}
          meta={ROLE_META}
          total={totalUsers}
        />
      </div>
    </div>
  );
};

export default Analytics;
