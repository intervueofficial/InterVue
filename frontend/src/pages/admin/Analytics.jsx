import {
  CalendarClock,
  CheckCircle2,
  Clock,
  MonitorPlay,
  AlertTriangleIcon,
  RefreshCwIcon,
} from "lucide-react";
import AppLoader from "../../components/AppLoader";
import PageHeader from "../../components/PageHeader";
import AutoRefreshBar from "../../components/admin/AutoRefreshBar";
import { THEME } from "../../constants/theme";

import { useAdminAnalytics } from "../../hooks/useAdmin";
import StatCard from "./StatCard";
import AnalyticsChart from "./AnalyticsChart";

const STATUS_META = {
  scheduled: { label: "Scheduled", color: THEME.info },
  waiting: { label: "Waiting", color: THEME.warning },
  live: { label: "Live", color: THEME.success },
  completed: { label: "Completed", color: THEME.inkMuted },
  cancelled: { label: "Cancelled", color: THEME.danger },
};

const DIFFICULTY_META = {
  Easy: { label: "Easy", color: THEME.success },
  Medium: { label: "Medium", color: THEME.warning },
  Hard: { label: "Hard", color: THEME.danger },
};

const ROLE_META = {
  candidate: { label: "Candidates", color: THEME.primary },
  interviewer: { label: "Interviewers", color: "#7C3AED" },
  admin: { label: "Admins", color: THEME.ink },
  unassigned: { label: "Unassigned", color: THEME.inkFaint },
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
        stroke={THEME.surface2}
        strokeWidth={stroke}
      />
      {total > 0 &&
        entries.map(([key, count]) => {
          const info = meta[key] || { label: key, color: THEME.inkFaint };
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
    <div
      className="rounded-xl p-6 transition-colors"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
    >
      <div
        style={{ fontFamily: THEME.fontDisplay, fontSize: 15, fontWeight: 600, color: THEME.ink }}
      >
        {title}
      </div>
      {subtitle && (
        <div className="text-xs mt-1" style={{ color: THEME.inkFaint }}>
          {subtitle}
        </div>
      )}

      {entries.length === 0 || total === 0 ? (
        <div className="text-sm mt-5" style={{ color: THEME.inkFaint }}>
          No data yet.
        </div>
      ) : (
        <div className="flex items-center gap-6 mt-6">
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <DonutRing entries={entries} meta={meta} total={total} />
            <div className="absolute flex flex-col items-center justify-center">
              <span
                style={{ fontFamily: THEME.fontDisplay, fontSize: 22, fontWeight: 700, color: THEME.ink, lineHeight: 1 }}
              >
                {total}
              </span>
              <span
                className="mt-1"
                style={{ fontFamily: THEME.fontMono, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: THEME.inkFaint }}
              >
                Total
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2.5 min-w-0">
            {entries.map(([key, count]) => {
              const info = meta[key] || { label: key, color: THEME.inkFaint };
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={key} className="flex items-center justify-between gap-2.5">
                  <span className="flex items-center gap-2 text-[12.5px] font-medium min-w-0" style={{ color: THEME.inkMuted }}>
                    <span
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ background: info.color }}
                    />
                    <span className="truncate">{info.label}</span>
                  </span>

                  <span className="flex items-baseline gap-1.5 flex-shrink-0">
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: THEME.ink }}>
                      {count}
                    </span>
                    <span className="text-[11px] font-semibold tabular-nums min-w-[30px] text-right" style={{ color: THEME.inkFaint }}>
                      {pct}%
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const Analytics = () => {
  const { data, isPending, isFetching, isError, refetch } = useAdminAnalytics();

  const analytics = data?.analytics;

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <AppLoader />
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Insights" title="Analytics" description="Platform activity and performance at a glance." />

        <div
          className="flex flex-col items-center text-center py-16 rounded-xl"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
            style={{ background: THEME.dangerTint }}
          >
            <AlertTriangleIcon size={20} color={THEME.danger} />
          </div>
          <p className="text-sm font-semibold" style={{ color: THEME.ink }}>
            Couldn't load analytics data
          </p>
          <p className="text-xs mt-1 mb-4 max-w-sm" style={{ color: THEME.inkFaint }}>
            This can happen if the request fired before your session was fully ready. Try again below.
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ background: THEME.ink, color: THEME.surface }}
          >
            <RefreshCwIcon size={14} />
            Try again
          </button>
        </div>
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

  const statusEntries = Object.entries(sessionsByStatus).sort((a, b) => b[1] - a[1]);
  const difficultyEntries = Object.entries(problemsByDifficulty).sort((a, b) => b[1] - a[1]);
  const roleEntries = Object.entries(usersByRole).sort((a, b) => b[1] - a[1]);

  const totalProblems = difficultyEntries.reduce((sum, [, c]) => sum + c, 0);
  const totalUsers = roleEntries.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Platform activity and performance at a glance."
        actions={<AutoRefreshBar onRefresh={refetch} isFetching={isFetching} intervalSeconds={20} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={totalSessions}
          subtitle="All time interview sessions"
          icon={MonitorPlay}
          color={THEME.primary}
        />

        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtitle="Sessions marked completed"
          icon={CheckCircle2}
          color={THEME.success}
        />

        <StatCard
          title="Avg. Duration"
          value={avgDurationMinutes > 0 ? `${avgDurationMinutes}m` : "--"}
          subtitle="Average completed session length"
          icon={Clock}
          color={THEME.warning}
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
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
