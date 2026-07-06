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
import { THEME, SESSION_STATUS } from "../../constants/theme";

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

  const badge = SESSION_STATUS[session.status] || SESSION_STATUS.completed;

  const initials = (name) =>
    name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div
      className="rounded-xl transition-colors"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h2
              className="truncate"
              style={{ fontFamily: THEME.fontDisplay, fontSize: 15, fontWeight: 600, color: THEME.ink }}
            >
              {session.title}
            </h2>

            {session.sessionCode && (
              <p
                className="mt-1 text-xs"
                style={{ fontFamily: THEME.fontMono, color: THEME.inkFaint }}
              >
                {session.sessionCode}
              </p>
            )}
          </div>

          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize whitespace-nowrap"
            style={{ background: badge.bg, color: badge.text, boxShadow: `inset 0 0 0 1px ${badge.border}` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: badge.dot, animation: isLive ? "sc-pulse 1.6s ease-in-out infinite" : "none" }}
            />
            {session.status}
          </span>
        </div>

        {session.description && (
          <p className="mt-2.5 text-sm leading-relaxed" style={{ color: THEME.inkMuted }}>
            {session.description}
          </p>
        )}

        <div className="h-px my-4" style={{ background: THEME.border }} />

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-sm" style={{ color: THEME.ink }}>
            <Calendar size={14} color={THEME.inkFaint} />
            <span>{new Date(session.scheduledAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2.5 text-sm" style={{ color: THEME.ink }}>
            <Clock size={14} color={THEME.inkFaint} />
            <span>
              {new Date(session.scheduledAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="h-px my-4" style={{ background: THEME.border }} />

        <div className="space-y-2.5">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-2.5 text-sm" style={{ color: THEME.inkMuted }}>
              <UserRound size={14} color={THEME.inkFaint} />
              <span>Candidate</span>
            </div>

            {session.candidate ? (
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 22, height: 22, fontSize: 9.5, fontWeight: 700, background: "rgba(23,23,31,0.06)", color: THEME.ink }}
                >
                  {initials(session.candidate.name)}
                </span>
                <span className="text-sm font-medium truncate" style={{ color: THEME.ink }}>
                  {session.candidate.name}
                </span>
              </div>
            ) : (
              <span className="text-sm" style={{ color: THEME.inkFaint }}>Available</span>
            )}
          </div>

          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-2.5 text-sm" style={{ color: THEME.inkMuted }}>
              <UserCheck size={14} color={THEME.inkFaint} />
              <span>Interviewer</span>
            </div>

            {session.interviewer ? (
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 22, height: 22, fontSize: 9.5, fontWeight: 700, background: "rgba(23,23,31,0.06)", color: THEME.ink }}
                >
                  {initials(session.interviewer.name)}
                </span>
                <span className="text-sm font-medium truncate" style={{ color: THEME.ink }}>
                  {session.interviewer.name}
                </span>
              </div>
            ) : (
              <span className="text-sm" style={{ color: THEME.inkFaint }}>Available</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          {(canJoinCandidate || canJoinInterviewer) && (
            <button
              disabled={joining}
              onClick={handleJoin}
              className="flex items-center gap-2 rounded-md font-semibold text-[13px] px-3.5 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: THEME.ink, color: THEME.surface }}
              onMouseEnter={(e) => !joining && (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Video size={14} />
              Join
            </button>
          )}

          {canEnterInterview && (
            <button
              onClick={handleEnterInterview}
              className="flex items-center gap-2 rounded-md font-semibold text-[13px] px-3.5 py-2 transition-colors"
              style={{ background: THEME.success, color: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Video size={14} />
              Enter Interview
            </button>
          )}

          {isAdmin && (
            <button
              disabled={deleting}
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-md font-semibold text-[13px] px-3.5 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ color: THEME.danger, border: `1px solid ${THEME.dangerBorder}`, background: THEME.surface }}
              onMouseEnter={(e) => (e.currentTarget.style.background = THEME.dangerTint)}
              onMouseLeave={(e) => (e.currentTarget.style.background = THEME.surface)}
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
};

export default SessionCard;
