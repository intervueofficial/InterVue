import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  History,
  AlertTriangleIcon,
  RefreshCwIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { adminApi } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import AutoRefreshBar from "../../components/admin/AutoRefreshBar";
import EmptyState from "./EmptyState";
import Loading from "./Loading";
import { THEME } from "../../constants/theme";

// Renders "problem.deleted" -> "deleted a problem", loosely, without a
// giant lookup table — splits on the dot, turns the verb into readable
// text. Falls back to the raw action string for anything unrecognised
// so a newly-added logAction() call never renders as "undefined".
function describeAction(entry) {
  const [targetTypeRaw, verbRaw] = entry.action.split(".");
  const verbMap = {
    deleted: "deleted",
    role_changed: "changed the role of",
    status_toggled: "toggled the status of",
    updated: "updated",
    toggled: "toggled",
    upgraded: "upgraded",
    cancelled: "cancelled",
    self_cancelled: "cancelled",
  };
  const verb = verbMap[verbRaw] || verbRaw?.replace(/_/g, " ") || entry.action;
  const target = entry.targetType || targetTypeRaw;
  return { verb, target };
}

const ACTION_COLOR = {
  deleted: THEME.danger,
  role_changed: THEME.warning,
  status_toggled: THEME.warning,
  updated: THEME.info,
  toggled: THEME.info,
  upgraded: THEME.success,
  cancelled: THEME.danger,
  self_cancelled: THEME.danger,
};

const AuditLog = () => {
  const { getToken } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["admin-audit-log", page],
    queryFn: async () => adminApi.getAuditLog(await getToken(), { page, limit: 25 }),
    retry: 1,
  });

  const entries = data?.entries || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <PageHeader
          eyebrow="Insights"
          title="Audit Log"
          description="A record of sensitive admin actions — deletions, role changes, and settings toggles."
          actions={
            <AutoRefreshBar onRefresh={refetch} isFetching={isFetching} intervalSeconds={30} />
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06, ease: "easeOut" }}
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
              Couldn't load the audit log
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
        ) : !entries.length ? (
          <EmptyState
            title="No audit entries yet"
            description="Sensitive actions — deleting a problem, changing a user's role, toggling maintenance mode — will show up here."
          />
        ) : (
          <>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
            >
              {entries.map((entry, i) => {
                const { verb, target } = describeAction(entry);
                const verbKey = entry.action.split(".")[1];
                const dotColor = ACTION_COLOR[verbKey] || THEME.inkFaint;
                const createdAt = new Date(entry.createdAt);

                return (
                  <div
                    key={entry._id}
                    className="flex items-start gap-4 px-8 py-5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${THEME.border}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: THEME.surface2 }}
                    >
                      <History size={14} color={dotColor} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm" style={{ color: THEME.ink }}>
                        <span className="font-semibold">{entry.actor?.name || "Unknown user"}</span>{" "}
                        <span style={{ color: THEME.inkMuted }}>{verb}</span>{" "}
                        <span className="font-semibold">
                          {target}
                          {entry.metadata?.title ? ` "${entry.metadata.title}"` : ""}
                        </span>
                        {entry.metadata?.before !== undefined && entry.metadata?.after !== undefined && (
                          <span style={{ color: THEME.inkMuted }}>
                            {" "}
                            from <span className="font-medium">{String(entry.metadata.before)}</span> to{" "}
                            <span className="font-medium">{String(entry.metadata.after)}</span>
                          </span>
                        )}
                      </p>
                      <p
                        className="text-xs mt-1 font-mono"
                        style={{ color: THEME.inkFaint }}
                        title={createdAt.toLocaleString()}
                      >
                        {formatDistanceToNow(createdAt, { addSuffix: true })} · {entry.action}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs" style={{ color: THEME.inkFaint }}>
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                    style={{ border: `1px solid ${THEME.border}`, color: THEME.ink }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                    style={{ border: `1px solid ${THEME.border}`, color: THEME.ink }}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuditLog;
