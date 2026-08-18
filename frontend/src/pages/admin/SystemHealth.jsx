import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import {
  Activity,
  Database,
  Sparkles,
  Cloud,
  Code2,
  MailIcon,
  CheckCircle2,
  XCircle,
  AlertTriangleIcon,
  RefreshCwIcon,
  ShieldCheck,
  ShieldAlert,
  Clock3,
} from "lucide-react";

import { adminApi } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import AutoRefreshBar from "../../components/admin/AutoRefreshBar";
import Loading from "./Loading";
import { THEME } from "../../constants/theme";

function formatBytes(bytes) {
  if (bytes == null) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i += 1;
  }
  return `${val.toFixed(1)} ${units[i]}`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

/* ---------- small building blocks ---------- */

const StatusDot = ({ ok }) => (
  <span className="relative flex h-2 w-2">
    {ok && (
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: THEME.success }}
      />
    )}
    <span
      className="relative inline-flex rounded-full h-2 w-2"
      style={{ background: ok ? THEME.success : THEME.inkFaint }}
    />
  </span>
);

const UsageBar = ({ percent, color = THEME.primary }) => {
  const clamped = Math.max(0, Math.min(100, percent ?? 0));
  const barColor = clamped >= 90 ? THEME.danger : clamped >= 70 ? THEME.warning : color;
  return (
    <div className="mt-1.5 mb-2">
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: THEME.border }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span style={{ color: THEME.inkMuted }}>{label}</span>
    <span className="font-medium" style={{ color: THEME.ink }}>
      {value}
    </span>
  </div>
);

const HealthCard = ({ icon: Icon, title, available, children, color = THEME.primary }) => (
  <motion.div
    variants={cardVariants}
    whileHover={{ y: -2 }}
    className="relative rounded-xl p-5 overflow-hidden transition-shadow"
    style={{
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      boxShadow: available ? "none" : "none",
    }}
  >
    {/* top accent */}
    <div
      className="absolute top-0 left-0 right-0 h-0.5"
      style={{ background: available ? color : THEME.border }}
    />

    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}1A` }}
        >
          <Icon size={16} color={color} />
        </div>
        <p className="text-sm font-semibold" style={{ color: THEME.ink }}>
          {title}
        </p>
      </div>

      {available ? (
        <span
          className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
          style={{ color: THEME.success, background: `${THEME.success}14` }}
        >
          <StatusDot ok />
          Operational
        </span>
      ) : (
        <span
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
          style={{ color: THEME.inkFaint, background: THEME.border }}
        >
          <XCircle size={12} />
          Offline
        </span>
      )}
    </div>

    {available ? (
      children
    ) : (
      <p className="text-xs leading-relaxed" style={{ color: THEME.inkFaint }}>
        Not configured, or the last check failed. No data is shown rather than a guessed number.
      </p>
    )}
  </motion.div>
);

/* ---------- main page ---------- */

const SystemHealth = () => {
  const { getToken } = useAuth();

  const { data, isLoading, isError, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: async () => adminApi.getSystemHealth(await getToken()),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const health = data?.health;

  const { total, upCount, allUp, anyDown } = useMemo(() => {
    if (!health) return { total: 0, upCount: 0, allUp: false, anyDown: false };
    const services = [
      health.app,
      health.database,
      health.aiGeneration,
      health.cloudinary,
      health.codeExecution,
      health.email,
    ];
    const up = services.filter((s) => s?.available).length;
    return {
      total: services.length,
      upCount: up,
      allUp: up === services.length,
      anyDown: up < services.length,
    };
  }, [health]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <PageHeader
          eyebrow="Insights"
          title="System Health"
          description="Live status of the services InterVue depends on."
          actions={
            <AutoRefreshBar onRefresh={refetch} isFetching={isFetching} intervalSeconds={30} />
          }
        />
      </motion.div>

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
            Couldn't load system health
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
      ) : isLoading || !health ? (
        <Loading />
      ) : (
        <>
          {/* Overall status banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{
              background: allUp ? `${THEME.success}0D` : `${THEME.warning}0D`,
              border: `1px solid ${allUp ? `${THEME.success}33` : `${THEME.warning}33`}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: allUp ? `${THEME.success}1A` : `${THEME.warning}1A` }}
              >
                {allUp ? (
                  <ShieldCheck size={18} color={THEME.success} />
                ) : (
                  <ShieldAlert size={18} color={THEME.warning} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: THEME.ink }}>
                  {allUp
                    ? "All systems operational"
                    : `${upCount} of ${total} services operational`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: THEME.inkMuted }}>
                  {anyDown
                    ? "One or more integrations need attention — see details below."
                    : "Everything InterVue depends on is responding normally."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: THEME.inkFaint }}>
              <Clock3 size={13} />
              Last checked{" "}
              {dataUpdatedAt ? formatTime(new Date(dataUpdatedAt)) : "—"}
              {isFetching && (
                <RefreshCwIcon size={12} className="animate-spin ml-1" />
              )}
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <HealthCard icon={Activity} title="Application" available={health.app.available} color={THEME.success}>
              <Row label="Uptime" value={health.app.uptimeLabel} />
              <Row label="Environment" value={health.app.nodeEnv} />
            </HealthCard>

            <HealthCard
              icon={Database}
              title="Database"
              available={health.database.available}
              color={health.database.connected ? THEME.success : THEME.danger}
            >
              <Row label="Status" value={health.database.status} />
              {health.database.connected != null && (
                <Row label="Connection" value={health.database.connected ? "Connected" : "Disconnected"} />
              )}
            </HealthCard>

            <HealthCard icon={Sparkles} title="AI Generation" available={health.aiGeneration.available} color={THEME.primary}>
              <Row label="Generations today" value={health.aiGeneration.total} />
              <Row label="Fallback model used" value={health.aiGeneration.fallback} />
            </HealthCard>

            <HealthCard icon={Cloud} title="Cloudinary" available={health.cloudinary.available} color={THEME.info}>
              {health.cloudinary.credits && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: THEME.inkMuted }}>Credits used</span>
                    <span className="font-medium" style={{ color: THEME.ink }}>
                      {health.cloudinary.credits.used_percent?.toFixed(1) ?? "—"}%
                    </span>
                  </div>
                  <UsageBar percent={health.cloudinary.credits.used_percent} color={THEME.info} />
                </>
              )}
              {health.cloudinary.storageBytes != null && (
                <Row label="Storage used" value={formatBytes(health.cloudinary.storageBytes)} />
              )}
              {health.cloudinary.bandwidthBytes != null && (
                <Row label="Bandwidth used" value={formatBytes(health.cloudinary.bandwidthBytes)} />
              )}
              {health.cloudinary.plan && <Row label="Plan" value={health.cloudinary.plan} />}
            </HealthCard>

            <HealthCard icon={Code2} title="Code Execution (JDoodle)" available={health.codeExecution.available} color={THEME.warning}>
              <Row label="Configured" value={health.codeExecution.configured ? "Yes" : "No"} />
            </HealthCard>

            <HealthCard icon={MailIcon} title="Email (Resend)" available={health.email.available} color={THEME.info}>
              <Row label="Configured" value={health.email.configured ? "Yes" : "No"} />
            </HealthCard>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default SystemHealth;