import { Eye, Trash2, CalendarClock, UserCircle2, Code2 } from "lucide-react";

import EmptyState from "./EmptyState";
import Loading from "./Loading";
import { THEME, SESSION_STATUS } from "../../constants/theme";

function Person({ user, fallback }) {
  if (!user) {
    return (
      <span className="flex items-center gap-2 text-sm" style={{ color: THEME.inkFaint }}>
        <UserCircle2 size={16} />
        {fallback}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <img
        src={
          user.profileImage ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "")}`
        }
        alt={user.name}
        className="w-8 h-8 rounded-full object-cover"
        style={{ border: `1px solid ${THEME.border}` }}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: THEME.ink }}>
          {user.name}
        </p>
        <p className="text-xs truncate" style={{ color: THEME.inkFaint }}>
          {user.email}
        </p>
      </div>
    </div>
  );
}

const SessionTable = ({
  sessions = [],
  loading = false,
  onView,
  onDelete,
}) => {
  if (loading) {
    return <Loading />;
  }

  if (!sessions.length) {
    return (
      <EmptyState
        title="No sessions yet"
        description="Interview sessions created across the platform will show up here."
      />
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-6"
        style={{ borderBottom: `1px solid ${THEME.border}` }}
      >
        <div>
          <h2
            style={{ fontFamily: THEME.fontDisplay, fontSize: 18, fontWeight: 600, color: THEME.ink }}
          >
            All Sessions
          </h2>
          <p className="mt-1 text-sm" style={{ color: THEME.inkMuted }}>
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} across the platform
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: THEME.surface2 }}>
            <tr className="text-left text-sm" style={{ color: THEME.inkMuted }}>
              <th className="px-8 py-4 font-semibold">Session</th>
              <th className="px-6 py-4 font-semibold">Interviewer</th>
              <th className="px-6 py-4 font-semibold">Candidate</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Scheduled</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sessions.map((session) => {
              const statusTokens = SESSION_STATUS[session.status] || SESSION_STATUS.completed;

              return (
                <tr
                  key={session._id}
                  className="transition-colors"
                  style={{ borderTop: `1px solid ${THEME.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Session */}
                  <td className="px-8 py-5">
                    <h3 className="font-semibold" style={{ color: THEME.ink }}>
                      {session.title || "Untitled session"}
                    </h3>
                    {session.activeProblem?.title && (
                      <p
                        className="text-xs mt-1 flex items-center gap-1.5"
                        style={{ color: THEME.inkFaint }}
                      >
                        <Code2 size={12} />
                        {session.activeProblem.title}
                      </p>
                    )}
                  </td>

                  {/* Interviewer */}
                  <td className="px-6">
                    <Person user={session.interviewer} fallback="Unassigned" />
                  </td>

                  {/* Candidate */}
                  <td className="px-6">
                    <Person user={session.candidate} fallback="Unassigned" />
                  </td>

                  {/* Status */}
                  <td className="px-6">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize"
                      style={{
                        color: statusTokens.text,
                        background: statusTokens.bg,
                        border: `1px solid ${statusTokens.border}`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: statusTokens.dot }}
                      />
                      {session.status}
                    </span>
                  </td>

                  {/* Scheduled */}
                  <td className="px-6">
                    <div className="flex items-center gap-2 text-sm" style={{ color: THEME.inkMuted }}>
                      <CalendarClock size={15} />
                      {session.scheduledAt
                        ? new Date(session.scheduledAt).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => onView?.(session)}
                        className="w-9 h-9 rounded-lg transition-colors flex items-center justify-center"
                        style={{ color: THEME.inkMuted }}
                        title="View"
                        onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        onClick={() => onDelete?.(session)}
                        className="w-9 h-9 rounded-lg transition-colors flex items-center justify-center"
                        style={{ color: THEME.danger }}
                        title="Delete"
                        onMouseEnter={(e) => (e.currentTarget.style.background = THEME.dangerTint)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Trash2 size={17} />
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
  );
};

export default SessionTable;