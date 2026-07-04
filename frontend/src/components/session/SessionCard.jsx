import {
  Calendar,
  Clock,
  Trash2,
  UserCheck,
  UserRound,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import useAuthUser from "../../hooks/useAuthUser";
import { useDeleteSession, useJoinSession } from "../../hooks/useSessions";

const SessionCard = ({ session }) => {
  const navigate = useNavigate();
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
  const isWaiting = session.status === "waiting";

  const canEnterInterview =
    (isLive || isWaiting) &&
    (session.candidate?._id?.toString() === authUser?._id?.toString() ||
      session.interviewer?._id?.toString() === authUser?._id?.toString());

  const handleJoin = () => {
    joinSession(session._id, {
      onSuccess: () => navigate(`/session/${session._id}`),
    });
  };

  const handleEnterInterview = () => {
    navigate(`/session/${session._id}`);
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(`Delete session "${session.title}" ?`);

    if (!confirmDelete) return;

    deleteSession(session._id);
  };

  const badgeStyle = {
    scheduled: { bg: "rgba(37,99,235,0.07)", text: "#2563EB", border: "rgba(37,99,235,0.18)" },
    waiting: { bg: "rgba(180,83,9,0.07)", text: "#B45309", border: "rgba(180,83,9,0.18)" },
    live: { bg: "rgba(21,128,61,0.07)", text: "#15803D", border: "rgba(21,128,61,0.18)" },
    completed: { bg: "#F1F5F9", text: "#475569", border: "#E5E9F0" },
    cancelled: { bg: "rgba(220,38,38,0.07)", text: "#DC2626", border: "rgba(220,38,38,0.18)" },
  };

  const badge = badgeStyle[session.status] || badgeStyle.completed;

  return (
    <div
      className="rounded-xl bg-white border transition-colors duration-150"
      style={{
        borderColor: "#E5E9F0",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,23,42,0.05)";
        e.currentTarget.style.borderColor = "#CBD5E1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#E5E9F0";
      }}
    >
      <div className="p-5">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              {session.title}
            </h2>

            {session.sessionCode && (
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {session.sessionCode}
              </p>
            )}
          </div>

          <span
            className="text-[10.5px] font-semibold px-2.5 py-1 rounded-md whitespace-nowrap"
            style={{
              background: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`,
              letterSpacing: "0.04em",
            }}
          >
            {session.status.toUpperCase()}
          </span>
        </div>

        {session.description && (
          <p className="mt-2.5 text-sm text-slate-500 leading-relaxed">
            {session.description}
          </p>
        )}

        <div className="h-px my-4" style={{ background: "#EEF2F7" }} />

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Calendar size={14} color="#94A3B8" />
            <span>{new Date(session.scheduledAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Clock size={14} color="#94A3B8" />
            <span>
              {new Date(session.scheduledAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="h-px my-4" style={{ background: "#EEF2F7" }} />

        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <UserRound size={14} color="#94A3B8" />
              <span>Candidate</span>
            </div>

            <span
              className={`text-sm font-medium ${
                session.candidate ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {session.candidate ? session.candidate.name : "Available"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5 text-sm text-slate-500">
              <UserCheck size={14} color="#94A3B8" />
              <span>Interviewer</span>
            </div>

            <span
              className={`text-sm font-medium ${
                session.interviewer ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {session.interviewer ? session.interviewer.name : "Available"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          {canJoinCandidate && (
            <button
              disabled={joining}
              onClick={handleJoin}
              className="flex items-center gap-2 rounded-lg font-semibold text-white px-3.5 py-2 text-[13px] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#2563EB" }}
              onMouseEnter={(e) => !joining && (e.currentTarget.style.background = "#1D4ED8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#2563EB")}
            >
              <Video size={14} />
              Join
            </button>
          )}

          {canJoinInterviewer && (
            <button
              disabled={joining}
              onClick={handleJoin}
              className="flex items-center gap-2 rounded-lg font-semibold text-white px-3.5 py-2 text-[13px] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#2563EB" }}
              onMouseEnter={(e) => !joining && (e.currentTarget.style.background = "#1D4ED8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#2563EB")}
            >
              <Video size={14} />
              Join
            </button>
          )}

          {canEnterInterview && (
            <button
              onClick={handleEnterInterview}
              className="flex items-center gap-2 rounded-lg font-semibold text-white px-3.5 py-2 text-[13px] transition-colors duration-150"
              style={{ background: "#15803D" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#116932")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#15803D")}
            >
              <Video size={14} />
              Enter Interview
            </button>
          )}

          {isAdmin && (
            <button
              disabled={deleting}
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-lg font-semibold px-3.5 py-2 text-[13px] border transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
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
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
