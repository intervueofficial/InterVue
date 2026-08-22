import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RefreshCwIcon, UserCog, Clock } from "lucide-react";

import { adminApi } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import { THEME } from "../../constants/theme";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const InterviewerRequests = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [actioningId, setActioningId] = useState(null);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["admin-interviewer-requests"],
    queryFn: async () => {
      const token = await getToken();
      return adminApi.getInterviewerRequests(token);
    },
    retry: 1,
  });

  const requests = data?.requests || [];

  const handleApprove = async (user) => {
    if (actioningId) return;
    const confirmed = window.confirm(`Approve ${user.name || user.email} as an interviewer?`);
    if (!confirmed) return;

    try {
      setActioningId(user._id);
      const token = await getToken();
      await adminApi.approveInterviewerRequest(user._id, "", token);
      toast.success(`${user.name || user.email} approved.`);
      queryClient.invalidateQueries({ queryKey: ["admin-interviewer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to approve interviewer.");
    } finally {
      setActioningId(null);
    }
  };

  const openRejectModal = (user) => {
    setRejectingUser(user);
    setRejectNote("");
  };

  const handleReject = async () => {
    if (!rejectingUser || actioningId) return;

    try {
      setActioningId(rejectingUser._id);
      const token = await getToken();
      await adminApi.rejectInterviewerRequest(rejectingUser._id, rejectNote.trim(), token);
      toast.success(`${rejectingUser.name || rejectingUser.email} rejected.`);
      queryClient.invalidateQueries({ queryKey: ["admin-interviewer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRejectingUser(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reject interviewer.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Interviewer Requests"
        description="Review and approve accounts that signed up to be interviewers before they get access."
        actions={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition"
            style={{ borderColor: THEME.border, color: THEME.ink }}
          >
            <RefreshCwIcon size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {isLoading ? (
        <div className="py-16 text-center text-sm" style={{ color: THEME.inkMuted }}>
          Loading requests…
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-sm text-red-600">
          Failed to load interviewer requests.
        </div>
      ) : requests.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border py-20 text-center"
          style={{ borderColor: THEME.border }}
        >
          <UserCog size={28} style={{ color: THEME.inkMuted }} />
          <p className="font-medium" style={{ color: THEME.ink }}>
            No pending interviewer requests
          </p>
          <p className="max-w-sm text-sm" style={{ color: THEME.inkMuted }}>
            When someone signs up and selects "Interviewer", their request will show up here for
            approval.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: THEME.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: THEME.border }}>
                <th className="px-5 py-3 font-semibold" style={{ color: THEME.inkMuted }}>
                  Name
                </th>
                <th className="px-5 py-3 font-semibold" style={{ color: THEME.inkMuted }}>
                  Email
                </th>
                <th className="px-5 py-3 font-semibold" style={{ color: THEME.inkMuted }}>
                  Requested
                </th>
                <th className="px-5 py-3 text-right font-semibold" style={{ color: THEME.inkMuted }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b last:border-b-0"
                  style={{ borderColor: THEME.border }}
                >
                  <td className="px-5 py-4 font-medium" style={{ color: THEME.ink }}>
                    {user.name || "—"}
                  </td>
                  <td className="px-5 py-4" style={{ color: THEME.inkMuted }}>
                    {user.email}
                  </td>
                  <td className="px-5 py-4" style={{ color: THEME.inkMuted }}>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} />
                      {formatDate(user.interviewerApproval?.requestedAt || user.createdAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(user)}
                        disabled={actioningId === user._id}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(user)}
                        disabled={actioningId === user._id}
                        className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
          onClick={() => !actioningId && setRejectingUser(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">
              Reject {rejectingUser.name || rejectingUser.email}?
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Optionally include a note explaining the decision — it will be included in the
              email they receive.
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Optional note…"
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setRejectingUser(null)}
                disabled={actioningId === rejectingUser._id}
                className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actioningId === rejectingUser._id}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actioningId === rejectingUser._id ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewerRequests;
