import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Search, AlertTriangleIcon, RefreshCwIcon, Eye } from "lucide-react";

import { adminApi } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import AutoRefreshBar from "../../components/admin/AutoRefreshBar";
import StatCard from "./StatCard";
import EmptyState from "./EmptyState";
import Loading from "./Loading";
import { THEME } from "../../constants/theme";
// Reused as-is from the interviewer side rather than duplicating the
// candidate-detail modal — same Application shape (candidate + job
// populated, profileSnapshot present) is returned by /admin/applications.
import CandidateProfileModal from "../interviewer/CandidateProfileModal";

const STATUS_FILTERS = ["all", "applied", "selected", "rejected", "not_eligible"];

const statusBadge = {
  applied: { text: THEME.info, bg: THEME.infoTint, border: THEME.infoBorder, label: "Applied" },
  selected: { text: THEME.success, bg: THEME.successTint, border: THEME.successBorder, label: "Selected" },
  rejected: { text: THEME.danger, bg: THEME.dangerTint, border: THEME.dangerBorder, label: "Rejected" },
  not_eligible: { text: THEME.warning, bg: THEME.warningTint, border: THEME.warningBorder, label: "Not Eligible" },
};

const Pipeline = () => {
  const { getToken } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);

  const { data: statsData } = useQuery({
    queryKey: ["admin-pipeline-stats"],
    queryFn: async () => adminApi.getPipelineStats(await getToken()),
  });

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-applications", status],
    queryFn: async () => adminApi.getAllApplications(await getToken(), { status }),
    retry: 1,
  });

  const applications = data?.applications || [];
  const stats = statsData?.stats?.byStatus;

  const filtered = applications.filter((app) => {
    const value = search.toLowerCase();
    return (
      app.candidate?.name?.toLowerCase().includes(value) ||
      app.candidate?.email?.toLowerCase().includes(value) ||
      app.job?.title?.toLowerCase().includes(value)
    );
  });

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <PageHeader
          eyebrow="Growth"
          title="Pipeline"
          description="The hiring funnel across every job posting."
          actions={
            <AutoRefreshBar onRefresh={refetch} isFetching={isFetching} intervalSeconds={30} />
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard title="Applied" value={stats?.applied ?? "--"} color={THEME.info} />
        <StatCard title="Selected" value={stats?.selected ?? "--"} color={THEME.success} />
        <StatCard title="Rejected" value={stats?.rejected ?? "--"} color={THEME.danger} />
        <StatCard title="Not Eligible" value={stats?.not_eligible ?? "--"} color={THEME.warning} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
        className="rounded-xl p-4"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              color={THEME.inkFaint}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate or job…"
              className="w-full text-sm outline-none transition-colors"
              style={{
                padding: "9px 12px 9px 34px",
                borderRadius: 8,
                border: `1px solid ${THEME.border}`,
                background: THEME.background,
                color: THEME.ink,
              }}
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm outline-none capitalize"
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${THEME.border}`,
              background: THEME.background,
              color: THEME.ink,
            }}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : statusBadge[s]?.label || s}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
      >
        {isError ? (
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
              Couldn't load applications
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: THEME.ink, color: THEME.surface }}
            >
              <RefreshCwIcon size={14} />
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <Loading />
        ) : !filtered.length ? (
          <EmptyState title="No applications found" description="Applications will appear here as candidates apply." />
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: THEME.surface2 }}>
                  <tr className="text-left text-sm" style={{ color: THEME.inkMuted }}>
                    <th className="px-8 py-4 font-semibold">Candidate</th>
                    <th className="px-6 py-4 font-semibold">Job</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Applied</th>
                    <th className="px-6 py-4 text-center font-semibold">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => {
                    const badge = statusBadge[app.status] || statusBadge.applied;
                    return (
                      <tr
                        key={app._id}
                        style={{ borderTop: `1px solid ${THEME.border}` }}
                        className="transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                app.candidate?.profileImage ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(app.candidate?.name || "")}`
                              }
                              alt={app.candidate?.name}
                              className="w-9 h-9 rounded-full object-cover"
                              style={{ border: `1px solid ${THEME.border}` }}
                            />
                            <div>
                              <p className="font-semibold text-sm" style={{ color: THEME.ink }}>
                                {app.candidate?.name || "Unknown"}
                              </p>
                              <p className="text-xs" style={{ color: THEME.inkFaint }}>
                                {app.candidate?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6">
                          <p className="text-sm" style={{ color: THEME.ink }}>
                            {app.job?.title || "—"}
                          </p>
                          <p className="text-xs" style={{ color: THEME.inkFaint }}>
                            {app.job?.fieldOfStudy}
                          </p>
                        </td>
                        <td className="px-6">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ color: badge.text, background: badge.bg, border: `1px solid ${badge.border}` }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6">
                          <span className="text-sm" style={{ color: THEME.inkMuted }}>
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="w-9 h-9 rounded-lg transition-colors flex items-center justify-center"
                              style={{ color: THEME.primary }}
                              title="View profile"
                              onMouseEnter={(e) => (e.currentTarget.style.background = THEME.primaryTint)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Eye size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {selectedApp && (
        <CandidateProfileModal application={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </div>
  );
};

export default Pipeline;
