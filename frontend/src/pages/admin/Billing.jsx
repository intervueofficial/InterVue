import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Users,
  Clock,
  TrendingDown,
  AlertTriangleIcon,
  RefreshCwIcon,
  XCircle,
} from "lucide-react";

import { adminApi } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import AutoRefreshBar from "../../components/admin/AutoRefreshBar";
import StatCard from "./StatCard";
import EmptyState from "./EmptyState";
import Loading from "./Loading";
import { THEME } from "../../constants/theme";

const PLAN_LABEL = { free: "Free", pro: "Pro", premium: "Premium" };

const statusBadge = {
  active: { text: THEME.success, bg: THEME.successTint, border: THEME.successBorder },
  trialing: { text: THEME.info, bg: THEME.infoTint, border: THEME.infoBorder },
  past_due: { text: THEME.warning, bg: THEME.warningTint, border: THEME.warningBorder },
  cancelled: { text: THEME.inkMuted, bg: THEME.surface2, border: THEME.border },
};

const Billing = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState(null);

  const {
    data: statsData,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["admin-subscription-stats"],
    queryFn: async () => adminApi.getSubscriptionStats(await getToken()),
  });

  const {
    data: subsData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => adminApi.getSubscriptions(await getToken()),
    retry: 1,
  });

  const subscriptions = subsData?.subscriptions || [];
  const stats = statsData?.stats;

  const cancelMutation = useMutation({
    mutationFn: async (id) => adminApi.cancelSubscription(id, await getToken()),
    onMutate: (id) => setCancellingId(id),
    onSuccess: () => {
      toast.success("Subscription cancelled.");
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-stats"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to cancel."),
    onSettled: () => setCancellingId(null),
  });

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <PageHeader
          eyebrow="Growth"
          title="Billing"
          description="Subscription revenue and plan breakdown. No payment gateway is wired up — this is data visibility only."
          actions={
            <AutoRefreshBar onRefresh={handleRefresh} isFetching={statsFetching || isFetching} intervalSeconds={30} />
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <StatCard
          title="MRR"
          value={stats ? `₹${stats.mrr.toLocaleString("en-IN")}` : "--"}
          subtitle="Forecast, active + trialing"
          icon={IndianRupee}
          color={THEME.primary}
        />
        <StatCard
          title="Active Subscribers"
          value={stats?.activeCount ?? "--"}
          subtitle={`${stats?.totalSubscribers ?? 0} total`}
          icon={Users}
          color={THEME.success}
        />
        <StatCard
          title="Trialing"
          value={stats?.trialingCount ?? "--"}
          subtitle="Currently in trial"
          icon={Clock}
          color={THEME.info}
        />
        <StatCard
          title="Churn (this month)"
          value={stats?.churnedThisMonth ?? "--"}
          subtitle="Cancelled since the 1st"
          icon={TrendingDown}
          color={THEME.danger}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
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
              Couldn't load subscriptions
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
        ) : !subscriptions.length ? (
          <EmptyState
            title="No subscriptions yet"
            description="Subscriptions will appear here once candidates upgrade."
          />
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
          >
            <div className="px-8 py-6" style={{ borderBottom: `1px solid ${THEME.border}` }}>
              <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 18, fontWeight: 600, color: THEME.ink }}>
                Subscriptions
              </h2>
              <p className="mt-1 text-sm" style={{ color: THEME.inkMuted }}>
                {subscriptions.length} record{subscriptions.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: THEME.surface2 }}>
                  <tr className="text-left text-sm" style={{ color: THEME.inkMuted }}>
                    <th className="px-8 py-4 font-semibold">Candidate</th>
                    <th className="px-6 py-4 font-semibold">Plan</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Renews / Ended</th>
                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => {
                    const badge = statusBadge[sub.status] || statusBadge.cancelled;
                    return (
                      <tr
                        key={sub._id}
                        style={{ borderTop: `1px solid ${THEME.border}` }}
                        className="transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                sub.candidate?.profileImage ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.candidate?.name || "")}`
                              }
                              alt={sub.candidate?.name}
                              className="w-9 h-9 rounded-full object-cover"
                              style={{ border: `1px solid ${THEME.border}` }}
                            />
                            <div>
                              <p className="font-semibold text-sm" style={{ color: THEME.ink }}>
                                {sub.candidate?.name || "Unknown"}
                              </p>
                              <p className="text-xs" style={{ color: THEME.inkFaint }}>
                                {sub.candidate?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6">
                          <span className="text-sm font-medium" style={{ color: THEME.ink }}>
                            {PLAN_LABEL[sub.plan] || sub.plan}
                          </span>
                        </td>
                        <td className="px-6">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                            style={{ color: badge.text, background: badge.bg, border: `1px solid ${badge.border}` }}
                          >
                            {sub.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6">
                          <span className="text-sm" style={{ color: THEME.inkMuted }}>
                            {sub.status === "cancelled"
                              ? sub.cancelledAt
                                ? new Date(sub.cancelledAt).toLocaleDateString()
                                : "—"
                              : sub.currentPeriodEnd
                              ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                              : "—"}
                          </span>
                        </td>
                        <td className="px-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                if (window.confirm(`Cancel ${sub.candidate?.name}'s subscription?`)) {
                                  cancelMutation.mutate(sub._id);
                                }
                              }}
                              disabled={sub.status === "cancelled" || cancellingId === sub._id}
                              className="w-9 h-9 rounded-lg transition-colors flex items-center justify-center disabled:opacity-30"
                              style={{ color: THEME.danger }}
                              title="Cancel subscription"
                              onMouseEnter={(e) => (e.currentTarget.style.background = THEME.dangerTint)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <XCircle size={17} />
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
    </div>
  );
};

export default Billing;
