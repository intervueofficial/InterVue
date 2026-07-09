import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
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

function PanelCard({ title, subtitle, children, delay = 0 }) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] animate-[fadeSlideIn_0.5s_ease-out_both]"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, animationDelay: `${delay}ms` }}
    >
      <div className="px-6 py-5" style={{ borderBottom: `1px solid ${THEME.border}` }}>
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

const Dashboard = () => {
  const { getToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const token = await getToken();

      const res = await axiosInstance.get("/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data.stats;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const totalUsers = data?.totalUsers || 0;
  const activeUsers = data?.activeUsers || 0;
  const totalSessions = data?.totalSessions || 0;

  return (
    <div className="space-y-8">
      <div className="animate-[fadeSlideIn_0.5s_ease-out_both]">
        <PageHeader
          eyebrow="Workspace · Overview"
          title="Admin Dashboard"
          description="A snapshot of platform activity, team composition, and session status."
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PanelCard
          title="Team Composition"
          subtitle="How your users break down by role"
          delay={240}
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
          delay={300}
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