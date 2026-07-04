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
import axiosInstance from "../../lib/axios";

/* ─── Horizontal breakdown row (real data only, no decoration) ──────────── */
function BreakdownRow({ icon: Icon, label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="breakdown-row">
      <div className="breakdown-row-top">
        <div className="breakdown-row-label">
          <span className="breakdown-icon" style={{ background: `${color}14` }}>
            <Icon size={13} color={color} />
          </span>
          {label}
        </div>
        <div className="breakdown-row-value">
          {value}
          <span className="breakdown-row-pct">{pct}%</span>
        </div>
      </div>

      <div className="breakdown-track">
        <div
          className="breakdown-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function PanelCard({ title, subtitle, children }) {
  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <div className="panel-card-title">{title}</div>
        {subtitle && <div className="panel-card-subtitle">{subtitle}</div>}
      </div>
      <div className="panel-card-body">{children}</div>
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
          style={{ color: "#2563EB" }}
        ></span>
      </div>
    );
  }

  const totalUsers = data?.totalUsers || 0;
  const activeUsers = data?.activeUsers || 0;
  const totalSessions = data?.totalSessions || 0;

  return (
    <div className="space-y-8">
      <style>{`
        .panel-card{
          background:#fff;
          border:1px solid #E5E9F0;
          border-radius:14px;
          overflow:hidden;
        }
        .panel-card-header{
          padding:18px 22px;
          border-bottom:1px solid #EEF2F7;
        }
        .panel-card-title{
          font-size:14.5px;
          font-weight:700;
          color:#0B1220;
        }
        .panel-card-subtitle{
          font-size:12px;
          color:#94A3B8;
          margin-top:2px;
        }
        .panel-card-body{
          padding:20px 22px 22px;
          display:flex;
          flex-direction:column;
          gap:18px;
        }
        .breakdown-row-top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:8px;
        }
        .breakdown-row-label{
          display:flex;
          align-items:center;
          gap:8px;
          font-size:13px;
          font-weight:600;
          color:#334155;
        }
        .breakdown-icon{
          width:22px;
          height:22px;
          border-radius:6px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        }
        .breakdown-row-value{
          font-size:13px;
          font-weight:700;
          color:#0B1220;
          display:flex;
          align-items:center;
          gap:6px;
        }
        .breakdown-row-pct{
          font-size:11px;
          font-weight:600;
          color:#94A3B8;
        }
        .breakdown-track{
          height:6px;
          border-radius:99px;
          background:#F1F5F9;
          overflow:hidden;
        }
        .breakdown-fill{
          height:100%;
          border-radius:99px;
          transition:width .5s ease;
        }
      `}</style>

      <div>
        <h1
          className="text-4xl font-bold"
          style={{ color: "#2563EB", letterSpacing: "-0.5px" }}
        >
          Admin Dashboard
        </h1>

        <p className="text-slate-500 mt-2">
          Welcome to the InterVue Administration Panel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Users"
          value={totalUsers}
          subtitle={`${activeUsers} active`}
          icon={Users}
          color="#2563EB"
        />

        <StatCard
          title="Problems"
          value={data?.totalProblems || 0}
          subtitle="Coding problems in library"
          icon={FileCode}
          color="#10B981"
        />

        <StatCard
          title="Sessions"
          value={totalSessions}
          subtitle={`${data?.activeSessions || 0} live right now`}
          icon={MonitorPlay}
          color="#F59E0B"
        />

        <StatCard
          title="Completed"
          value={data?.completedSessions || 0}
          subtitle="Interviews finished"
          icon={BarChart3}
          color="#8B5CF6"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <PanelCard
          title="Team Composition"
          subtitle="How your users break down by role"
        >
          <BreakdownRow
            icon={GraduationCap}
            label="Candidates"
            value={data?.totalCandidates || 0}
            total={totalUsers}
            color="#2563EB"
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
            color="#F59E0B"
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
            color="#DC2626"
          />
          <BreakdownRow
            icon={BarChart3}
            label="Completed"
            value={data?.completedSessions || 0}
            total={totalSessions}
            color="#10B981"
          />
          <BreakdownRow
            icon={MonitorPlay}
            label="Total scheduled"
            value={totalSessions}
            total={totalSessions}
            color="#2563EB"
          />
        </PanelCard>
      </div>
    </div>
  );
};

export default Dashboard;
