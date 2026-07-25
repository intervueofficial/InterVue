import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Users,
  FileCode,
  MonitorPlay,
  BarChart3,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Radio,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@clerk/clerk-react";

import StatCard from "./StatCard";
import Loading from "./Loading";
import PageHeader from "../../components/PageHeader";
import axiosInstance from "../../lib/axios";
import { THEME } from "../../constants/theme";

/* ─── Count-up number (real data only — animates the actual fetched value) ─ */
function CountUp({ value = 0, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef();
  const startRef = useRef();
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;

    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromRef.current + (value - fromRef.current) * eased);
      setDisplay(current);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{display}</span>;
}

/* ─── Horizontal breakdown row (real data only, no decoration) ──────────── */
function BreakdownRow({ icon: Icon, label, value, total, color, delay = 0 }) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5 text-[13px] font-semibold" style={{ color: THEME.ink }}>
          <span
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${color}14` }}
          >
            <Icon size={13} color={color} />
          </span>
          {label}
        </div>
        <div className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: THEME.ink, fontVariantNumeric: "tabular-nums" }}>
          <CountUp value={value} />
          <span className="text-[11px] font-semibold min-w-[30px] text-right" style={{ color: THEME.inkMuted }}>
            {pct}%
          </span>
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: THEME.surface2 }}>
        <div
          className="h-full rounded-full transition-all ease-out"
          style={{
            width: `${animatedPct}%`,
            background: color,
            transitionDuration: "900ms",
          }}
        />
      </div>
    </div>
  );
}

function PanelCard({ title, subtitle, children, delay = 0, action }) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] animate-[fadeSlideIn_0.5s_ease-out_both]"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, animationDelay: `${delay}ms` }}
    >
      <div
        className="px-6 py-5 flex items-start justify-between gap-4"
        style={{ borderBottom: `1px solid ${THEME.border}` }}
      >
        <div>
          <div
            style={{ fontFamily: THEME.fontDisplay, fontSize: 15, fontWeight: 600, color: THEME.ink, letterSpacing: "-0.01em" }}
          >
            {title}
          </div>
          {subtitle && (
            <div className="text-xs mt-1" style={{ color: THEME.inkMuted }}>
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </div>
      <div className="px-6 py-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

/* ─── Stat card wrapper: adds entrance + hover lift around existing StatCard ─ */
function AnimatedStatCard({ delay = 0, ...props }) {
  return (
    <div
      className="animate-[fadeSlideIn_0.5s_ease-out_both] transition-transform duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <StatCard {...props} />
    </div>
  );
}

/* ─── Small metric pill for the analytics header row ─────────────────────── */
function MetricPill({ icon: Icon, label, value, color }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3 flex-1 min-w-[160px]"
      style={{ background: THEME.surface2, border: `1px solid ${THEME.border}` }}
    >
      <span
        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}14` }}
      >
        <Icon size={15} color={color} />
      </span>
      <div>
        <div className="text-[17px] font-bold leading-tight" style={{ color: THEME.ink, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
        <div className="text-[11px] font-medium" style={{ color: THEME.inkMuted }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ─── Custom tooltip for the trend chart, matching THEME instead of recharts defaults ─ */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const date = new Date(label);
  const formatted = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div
      className="rounded-md px-3 py-2 text-xs shadow-lg"
      style={{ background: THEME.ink, color: THEME.surface }}
    >
      <div className="font-semibold mb-0.5">{formatted}</div>
      <div className="opacity-80">{payload[0].value} session{payload[0].value === 1 ? "" : "s"}</div>
    </div>
  );
}

/* ─── 14-day sessions trend, built from real /admin/analytics data ───────── */
function SessionsTrendChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: THEME.inkMuted }}>
        <Activity size={22} strokeWidth={1.5} />
        <p className="text-xs">No sessions created in the last 14 days.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={THEME.primary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={THEME.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={THEME.border} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            tick={{ fontSize: 10, fill: THEME.inkMuted }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: THEME.inkMuted }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={THEME.primary}
            strokeWidth={2}
            fill="url(#sessionsFill)"
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const Dashboard = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isFetching: statsFetching } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const token = await getToken();
      const res = await axiosInstance.get("/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.stats;
    },
  });

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
  } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const token = await getToken();
      const res = await axiosInstance.get("/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.analytics;
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-analytics"] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const spinning = isRefreshing || statsFetching || analyticsFetching;

  if (isLoading) {
    return <Loading />;
  }

  const totalUsers = data?.totalUsers || 0;
  const activeUsers = data?.activeUsers || 0;
  const totalSessions = data?.totalSessions || 0;

  const problemsByDifficulty = analytics?.problemsByDifficulty || {};
  const totalProblemsForBreakdown =
    (problemsByDifficulty.easy || 0) +
    (problemsByDifficulty.medium || 0) +
    (problemsByDifficulty.hard || 0);

  return (
    <div className="space-y-8">
      <div className="animate-[fadeSlideIn_0.5s_ease-out_both]">
        <PageHeader
          eyebrow="Workspace · Overview"
          title="Admin Dashboard"
          description="A snapshot of platform activity, team composition, and session status."
          actions={
            <button
              onClick={handleRefresh}
              disabled={spinning}
              className="flex items-center gap-2 rounded-md font-semibold text-[13px] px-4 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: THEME.surface,
                color: THEME.ink,
                border: `1px solid ${THEME.border}`,
              }}
              onMouseEnter={(e) => {
                if (!spinning) e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <RefreshCw size={15} className={spinning ? "animate-spin" : ""} />
              Refresh
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AnimatedStatCard
          delay={0}
          title="Total Users"
          value={totalUsers}
          subtitle={`${activeUsers} active`}
          icon={Users}
          color={THEME.primary}
        />

        <AnimatedStatCard
          delay={60}
          title="Problems"
          value={data?.totalProblems || 0}
          subtitle="Coding problems in library"
          icon={FileCode}
          color={THEME.success}
        />

        <AnimatedStatCard
          delay={120}
          title="Sessions"
          value={totalSessions}
          subtitle={`${data?.activeSessions || 0} live right now`}
          icon={MonitorPlay}
          color={THEME.warning}
        />

        <AnimatedStatCard
          delay={180}
          title="Completed"
          value={data?.completedSessions || 0}
          subtitle="Interviews finished"
          icon={BarChart3}
          color="#8B5CF6"
        />
      </div>

      {/* ── Sessions trend + derived analytics, from /admin/analytics ── */}
      <PanelCard
        title="Session Activity"
        subtitle="Sessions created over the last 14 days"
        delay={220}
      >
        {analyticsLoading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md" style={{ color: THEME.primary }}></span>
          </div>
        ) : (
          <>
            <SessionsTrendChart data={analytics?.sessionsOverTime || []} />

            <div className="flex flex-wrap gap-3 pt-1">
              <MetricPill
                icon={CheckCircle2}
                label="Completion rate"
                value={`${analytics?.completionRate ?? 0}%`}
                color={THEME.success}
              />
              <MetricPill
                icon={Clock}
                label="Avg. duration"
                value={
                  analytics?.avgDurationMinutes
                    ? `${analytics.avgDurationMinutes} min`
                    : "—"
                }
                color={THEME.warning}
              />
              <MetricPill
                icon={TrendingUp}
                label="Sessions tracked"
                value={analytics?.totalSessions ?? totalSessions}
                color={THEME.primary}
              />
            </div>
          </>
        )}
      </PanelCard>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <PanelCard
          title="Team Composition"
          subtitle="How your users break down by role"
          delay={280}
        >
          <BreakdownRow
            icon={GraduationCap}
            label="Candidates"
            value={data?.totalCandidates || 0}
            total={totalUsers}
            color={THEME.primary}
            delay={0}
          />
          <BreakdownRow
            icon={Briefcase}
            label="Interviewers"
            value={data?.totalInterviewers || 0}
            total={totalUsers}
            color="#8B5CF6"
            delay={80}
          />
          <BreakdownRow
            icon={ShieldCheck}
            label="Admins"
            value={data?.totalAdmins || 0}
            total={totalUsers}
            color={THEME.warning}
            delay={160}
          />
        </PanelCard>

        <PanelCard
          title="Session Overview"
          subtitle="Current state of all interview sessions"
          delay={340}
        >
          <BreakdownRow
            icon={Radio}
            label="Live now"
            value={data?.activeSessions || 0}
            total={totalSessions}
            color={THEME.danger}
            delay={0}
          />
          <BreakdownRow
            icon={BarChart3}
            label="Completed"
            value={data?.completedSessions || 0}
            total={totalSessions}
            color={THEME.success}
            delay={80}
          />
          <BreakdownRow
            icon={MonitorPlay}
            label="Total scheduled"
            value={totalSessions}
            total={totalSessions}
            color={THEME.primary}
            delay={160}
          />
        </PanelCard>

        <PanelCard
          title="Problem Difficulty"
          subtitle="Library breakdown by difficulty"
          delay={400}
        >
          {totalProblemsForBreakdown === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2" style={{ color: THEME.inkMuted }}>
              <FileCode size={20} strokeWidth={1.5} />
              <p className="text-xs">No problems in the library yet.</p>
            </div>
          ) : (
            <>
              <BreakdownRow
                icon={FileCode}
                label="Easy"
                value={problemsByDifficulty.easy || 0}
                total={totalProblemsForBreakdown}
                color={THEME.success}
                delay={0}
              />
              <BreakdownRow
                icon={FileCode}
                label="Medium"
                value={problemsByDifficulty.medium || 0}
                total={totalProblemsForBreakdown}
                color={THEME.warning}
                delay={80}
              />
              <BreakdownRow
                icon={FileCode}
                label="Hard"
                value={problemsByDifficulty.hard || 0}
                total={totalProblemsForBreakdown}
                color={THEME.danger}
                delay={160}
              />
            </>
          )}
        </PanelCard>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;