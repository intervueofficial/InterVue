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