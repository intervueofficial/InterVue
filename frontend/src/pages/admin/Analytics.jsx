import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  MonitorPlay,
  RefreshCw,
  TrendingUp,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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

/* ─── Donut ring built from stacked SVG arcs (real proportions, no filler) ─── */
function DonutRing({ entries, meta, total, size = 132, stroke = 16 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth={stroke}
      />
      {total > 0 &&
        entries.map(([key, count]) => {
          const info = meta[key] || { label: key, color: "#94A3B8" };
          const fraction = count / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const offset = -cumulative * circumference;
          cumulative += fraction;

          if (count === 0) return null;

          return (
            <circle
              key={key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={info.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray .5s ease" }}
            />
          );
        })}
    </svg>
  );
}

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

        .breakdown-body{
          display:flex;
          align-items:center;
          gap:24px;
          margin-top:22px;
        }

        .breakdown-ring-wrap{
          position:relative;
          flex-shrink:0;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .breakdown-ring-center{
          position:absolute;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
        }

        .breakdown-ring-total{
          font-size:24px;
          font-weight:800;
          color:#0F172A;
          letter-spacing:-0.3px;
          line-height:1;
        }

        .breakdown-ring-label{
          font-size:10.5px;
          color:#94A3B8;
          font-weight:600;
          text-transform:uppercase;
          letter-spacing:0.4px;
          margin-top:3px;
        }

        .breakdown-legend{
          flex:1;
          display:flex;
          flex-direction:column;
          gap:11px;
          min-width:0;
        }

        .legend-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        }

        .legend-label{
          display:flex;
          align-items:center;
          gap:8px;
          font-size:12.5px;
          font-weight:600;
          color:#334155;
          min-width:0;
        }

        .legend-dot{
          width:9px;
          height:9px;
          border-radius:3px;
          flex-shrink:0;
        }

        .legend-value{
          display:flex;
          align-items:baseline;
          gap:5px;
          flex-shrink:0;
        }

        .legend-count{
          font-size:13px;
          font-weight:700;
          color:#0F172A;
          font-variant-numeric:tabular-nums;
        }

        .legend-pct{
          font-size:11px;
          font-weight:600;
          color:#94A3B8;
          min-width:32px;
          text-align:right;
          font-variant-numeric:tabular-nums;
        }

        .breakdown-empty{
          margin-top:22px;
          font-size:13px;
          color:#94A3B8;
        }
      `}</style>

      <div className="breakdown-card">
        <div className="breakdown-title">{title}</div>
        {subtitle && <div className="breakdown-subtitle">{subtitle}</div>}

        {entries.length === 0 || total === 0 ? (
          <div className="breakdown-empty">No data yet.</div>
        ) : (
          <div className="breakdown-body">
            <div className="breakdown-ring-wrap">
              <DonutRing entries={entries} meta={meta} total={total} />
              <div className="breakdown-ring-center">
                <span className="breakdown-ring-total">{total}</span>
                <span className="breakdown-ring-label">Total</span>
              </div>
            </div>

            <div className="breakdown-legend">
              {entries.map(([key, count]) => {
                const info = meta[key] || { label: key, color: "#94A3B8" };
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div className="legend-row" key={key}>
                    <span className="legend-label">
                      <span
                        className="legend-dot"
                        style={{ background: info.color }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {info.label}
                      </span>
                    </span>

                    <span className="legend-value">
                      <span className="legend-count">{count}</span>
                      <span className="legend-pct">{pct}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* ─── Health signal strip: derived, from the same analytics payload ────────
   No new endpoint — these are ratios computed client-side from fields
   the controller already returns (sessionsByStatus, completionRate). ── */
function HealthStrip({ sessionsByStatus, totalSessions, completionRate }) {
  const cancelled = sessionsByStatus.cancelled || 0;
  const cancelRate = totalSessions > 0 ? Math.round((cancelled / totalSessions) * 100) : 0;
  const live = sessionsByStatus.live || 0;
  const waiting = sessionsByStatus.waiting || 0;

  const items = [
    {
      icon: Zap,
      label: "In progress",
      value: live + waiting,
      detail: `${live} live · ${waiting} waiting`,
      color: "#15803D",
    },
    {
      icon: TrendingUp,
      label: "Completion rate",
      value: `${completionRate}%`,
      detail: "of all sessions ever created",
      color: "#2563EB",
    },
    {
      icon: AlertTriangle,
      label: "Cancellation rate",
      value: `${cancelRate}%`,
      detail: `${cancelled} cancelled total`,
      color: cancelRate > 20 ? "#DC2626" : "#94A3B8",
    },
  ];

  return (
    <>
      <style>{`
        .health-strip{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:1px;
          background:#E2E8F0;
          border:1px solid #E2E8F0;
          border-radius:22px;
          overflow:hidden;
        }
        .health-item{
          background:#fff;
          padding:22px 24px;
          display:flex;
          align-items:flex-start;
          gap:14px;
        }
        .health-icon{
          width:38px;
          height:38px;
          border-radius:12px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        }
        .health-value{
          font-size:22px;
          font-weight:800;
          color:#0F172A;
          letter-spacing:-0.3px;
          line-height:1.1;
        }
        .health-label{
          font-size:12px;
          font-weight:600;
          color:#475569;
          margin-top:2px;
        }
        .health-detail{
          font-size:11px;
          color:#94A3B8;
          margin-top:3px;
        }
      `}</style>

      <div className="health-strip">
        {items.map(({ icon: Icon, label, value, detail, color }) => (
          <div className="health-item" key={label}>
            <div className="health-icon" style={{ background: `${color}14` }}>
              <Icon size={17} color={color} />
            </div>
            <div>
              <div className="health-value">{value}</div>
              <div className="health-label">{label}</div>
              <div className="health-detail">{detail}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const Analytics = () => {
  const { data, isLoading, isError, isFetching, refetch } = useAdminAnalytics();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const analytics = data?.analytics;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof refetch === "function") {
        await refetch();
      } else {
        await queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const spinning = isRefreshing || isFetching;

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
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold" style={{ color: "#2563EB" }}>
            Analytics
          </h1>
          <button
            onClick={handleRefresh}
            disabled={spinning}
            className="flex items-center gap-2 rounded-full font-semibold text-[13px] px-4 py-2.5 border transition-colors disabled:opacity-60"
            style={{ borderColor: "#E2E8F0", color: "#334155" }}
          >
            <RefreshCw size={14} className={spinning ? "animate-spin" : ""} />
            Retry
          </button>
        </div>
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
      <div className="flex items-start justify-between gap-4">
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

        <button
          onClick={handleRefresh}
          disabled={spinning}
          className="flex items-center gap-2 rounded-full font-semibold text-[13px] px-4 py-2.5 border transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
          style={{ borderColor: "#E2E8F0", color: "#334155", background: "#fff" }}
          onMouseEnter={(e) => {
            if (!spinning) e.currentTarget.style.background = "#F8FAFC";
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
          <RefreshCw size={14} className={spinning ? "animate-spin" : ""} />
          Refresh
        </button>
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

      {/* New: derived health signals — same payload, ratios not shown elsewhere */}
      <HealthStrip
        sessionsByStatus={sessionsByStatus}
        totalSessions={totalSessions}
        completionRate={completionRate}
      />

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