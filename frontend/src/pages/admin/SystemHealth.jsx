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

const HealthCard = ({ icon: Icon, title, available, children, color = THEME.primary }) => (
  <div
    className="rounded-xl p-5"
    style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
  >
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
        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: THEME.success }}>
          <CheckCircle2 size={13} /> Available
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: THEME.inkFaint }}>
          <XCircle size={13} /> Unavailable
        </span>
      )}
    </div>

    {available ? (
      children
    ) : (
      <p className="text-xs" style={{ color: THEME.inkFaint }}>
        Not configured, or the last check failed. No data is shown rather than a guessed number.
      </p>
    )}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span style={{ color: THEME.inkMuted }}>{label}</span>
    <span className="font-medium" style={{ color: THEME.ink }}>
      {value}
    </span>
  </div>
);

const SystemHealth = () => {
  const { getToken } = useAuth();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: async () => adminApi.getSystemHealth(await getToken()),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const health = data?.health;

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <HealthCard icon={Activity} title="Application" available={health.app.available} color={THEME.success}>
            <Row label="Uptime" value={health.app.uptimeLabel} />
            <Row label="Environment" value={health.app.nodeEnv} />
          </HealthCard>

          <HealthCard icon={Database} title="Database" available={health.database.available} color={health.database.connected ? THEME.success : THEME.danger}>
            <Row label="Status" value={health.database.status} />
          </HealthCard>

          <HealthCard icon={Sparkles} title="AI Generation" available={health.aiGeneration.available} color={THEME.primary}>
            <Row label="Generations today" value={health.aiGeneration.total} />
            <Row label="Fallback model used" value={health.aiGeneration.fallback} />
          </HealthCard>

          <HealthCard icon={Cloud} title="Cloudinary" available={health.cloudinary.available} color={THEME.info}>
            {health.cloudinary.credits && (
              <Row
                label="Credits used"
                value={`${health.cloudinary.credits.used_percent?.toFixed(1) ?? "—"}%`}
              />
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
      )}
    </div>
  );
};

export default SystemHealth;
