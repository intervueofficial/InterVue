import { useQuery } from "@tanstack/react-query";
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
import PageHeader from "../../components/PageHeader";
import axiosInstance from "../../lib/axios";
import { THEME } from "../../constants/theme";

/* ─── Horizontal breakdown row (real data only, no decoration) ──────────── */
function BreakdownRow({ icon: Icon, label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5 text-[13px] font-semibold" style={{ color: THEME.ink }}>
          <span
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}14` }}
          >
            <Icon size={13} color={color} />
          </span>
          {label}
        </div>
        <div className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: THEME.ink, fontVariantNumeric: "tabular-nums" }}>
          {value}
          <span className="text-[11px] font-semibold min-w-[30px] text-right" style={{ color: THEME.inkMuted }}>
            {pct}%
          </span>
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: THEME.surface2 }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function PanelCard({ title, subtitle, children }) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-colors"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
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
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span
          className="loading loading-spinner loading-lg"
          style={{ color: THEME.primary }}
        ></span>
      </div>
    );
  }

  const totalUsers = data?.totalUsers || 0;
  const activeUsers = data?.activeUsers || 0;
  const totalSessions = data?.totalSessions || 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace · Overview"
        title="Admin Dashboard"
        description="A snapshot of platform activity, team composition, and session status."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          subtitle={`${activeUsers} active`}
          icon={Users}
          color={THEME.primary}
        />

        <StatCard
          title="Problems"
          value={data?.totalProblems || 0}
          subtitle="Coding problems in library"
          icon={FileCode}
          color={THEME.success}
        />

        <StatCard
          title="Sessions"
          value={totalSessions}
          subtitle={`${data?.activeSessions || 0} live right now`}
          icon={MonitorPlay}
          color={THEME.warning}
        />

        <StatCard
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
        >
          <BreakdownRow
            icon={GraduationCap}
            label="Candidates"
            value={data?.totalCandidates || 0}
            total={totalUsers}
            color={THEME.primary}
          />
          <BreakdownRow
            icon={Briefcase}
            label="Interviewers"
            value={data?.totalInterviewers || 0}
            total={totalUsers}
            color="#8B5CF6"
          />
          <BreakdownRow
            icon={ShieldCheck}
            label="Admins"
            value={data?.totalAdmins || 0}
            total={totalUsers}
            color={THEME.warning}
          />
        </PanelCard>

        <PanelCard
          title="Session Overview"
          subtitle="Current state of all interview sessions"
        >
          <BreakdownRow
            icon={Radio}
            label="Live now"
            value={data?.activeSessions || 0}
            total={totalSessions}
            color={THEME.danger}
          />
          <BreakdownRow
            icon={BarChart3}
            label="Completed"
            value={data?.completedSessions || 0}
            total={totalSessions}
            color={THEME.success}
          />
          <BreakdownRow
            icon={MonitorPlay}
            label="Total scheduled"
            value={totalSessions}
            total={totalSessions}
            color={THEME.primary}
          />
        </PanelCard>
      </div>
    </div>
  );
};

export default Dashboard;
