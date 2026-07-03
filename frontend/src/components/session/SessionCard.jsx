import {
  Calendar,
  Clock,
  Trash2,
  UserCheck,
  UserRound,
  Video,
} from "lucide-react";

import useAuthUser from "../../hooks/useAuthUser";
import { useDeleteSession, useJoinSession } from "../../hooks/useSessions";

const SessionCard = ({ session }) => {
  const { data: authUser } = useAuthUser();

  const { mutate: joinSession, isPending: joining } = useJoinSession();

  const { mutate: deleteSession, isPending: deleting } = useDeleteSession();

  const role = authUser?.role;

  const isAdmin = role === "admin";
  const isCandidate = role === "candidate";
  const isInterviewer = role === "interviewer";

  const canJoinCandidate =
    isCandidate &&
    !session.candidate &&
    session.status !== "completed" &&
    session.status !== "cancelled";

  const canJoinInterviewer =
    isInterviewer &&
    !session.interviewer &&
    session.status !== "completed" &&
    session.status !== "cancelled";

  const isLive = session.status === "live";

  const canEnterInterview =
    isLive &&
    (session.candidate?._id?.toString() === authUser?._id?.toString() ||
      session.interviewer?._id?.toString() === authUser?._id?.toString());

  const handleJoin = () => {
    joinSession(session._id);
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(`Delete session "${session.title}" ?`);

    if (!confirmDelete) return;

    deleteSession(session._id);
  };

  const badgeStyle = {
    scheduled: { bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE" },
    waiting: { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
    live: { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" },
    completed: { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
    cancelled: { bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  };

  const badge = badgeStyle[session.status] || badgeStyle.completed;

  return (
    <div
      className="rounded-2xl bg-white border transition-all duration-200"
      style={{
        borderColor: "#E2E8F0",
        boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(15,23,42,0.10)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "#BFDBFE";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#E2E8F0";
      }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {session.title}
            </h2>

            <p className="text-sm text-slate-400 mt-1 font-mono">
              {session.sessionCode}
            </p>
          </div>

          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
            style={{
              background: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`,
              letterSpacing: "0.03em",
            }}
          >
            {session.status.toUpperCase()}
          </span>
        </div>

        {session.description && (
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            {session.description}
          </p>
        )}

        <div className="h-px my-5" style={{ background: "#EEF2F7" }} />

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Calendar size={16} color="#2563EB" />
            <span>{new Date(session.scheduledAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Clock size={16} color="#2563EB" />
            <span>
              {new Date(session.scheduledAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="h-px my-5" style={{ background: "#EEF2F7" }} />

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <UserRound size={16} />
              <span>Candidate</span>
            </div>

            <span
              className={`text-sm font-semibold ${
                session.candidate ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {session.candidate ? session.candidate.name : "Available"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <UserCheck size={16} />
              <span>Interviewer</span>
            </div>

            <span
              className={`text-sm font-semibold ${
                session.interviewer ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {session.interviewer ? session.interviewer.name : "Available"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {canJoinCandidate && (
            <button
              disabled={joining}
              onClick={handleJoin}
              className="flex items-center gap-2 rounded-xl font-semibold text-white px-4 py-2.5 text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "#2563EB",
                boxShadow: "0 4px 14px rgba(37,99,235,0.28)",
              }}
            >
              <Video size={16} />
              Join
            </button>
          )}

          {canJoinInterviewer && (
            <button
              disabled={joining}
              onClick={handleJoin}
              className="flex items-center gap-2 rounded-xl font-semibold text-white px-4 py-2.5 text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "#2563EB",
                boxShadow: "0 4px 14px rgba(37,99,235,0.28)",
              }}
            >
              <Video size={16} />
              Join
            </button>
          )}

          {canEnterInterview && (
            <button
              className="flex items-center gap-2 rounded-xl font-semibold text-white px-4 py-2.5 text-sm transition-all duration-200"
              style={{
                background: "#16A34A",
                boxShadow: "0 4px 14px rgba(22,163,74,0.28)",
              }}
            >
              <Video size={16} />
              Enter Interview
            </button>
          )}

          {isAdmin && (
            <button
              disabled={deleting}
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-xl font-semibold px-4 py-2.5 text-sm border transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                color: "#DC2626",
                borderColor: "#FECACA",
                background: "#FFF",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FEF2F2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFF";
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionCard;