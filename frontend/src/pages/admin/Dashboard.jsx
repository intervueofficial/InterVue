import { useQuery } from "@tanstack/react-query";
import {
  Users,
  FileCode,
  MonitorPlay,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

import StatCard from "./StatCard";
import axiosInstance from "../../lib/axios"; // change path if yours is different

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
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <p className="text-slate-500 mt-2">
          Welcome to the InterVue Administration Panel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatCard
          title="Total Users"
          value={data?.totalUsers || 0}
          subtitle="Registered users"
          icon={Users}
          color="#2563EB"
        />

        <StatCard
          title="Problems"
          value={data?.totalProblems || 0}
          subtitle="Coding problems"
          icon={FileCode}
          color="#10B981"
        />

        <StatCard
          title="Sessions"
          value={data?.totalSessions || 0}
          subtitle="Interview sessions"
          icon={MonitorPlay}
          color="#F59E0B"
        />

        <StatCard
          title="Completed"
          value={data?.completedSessions || 0}
          subtitle="Completed interviews"
          icon={BarChart3}
          color="#8B5CF6"
        />

      </div>

    </div>
  );
};

export default Dashboard;