import {
  Eye,
  Pencil,
  UserCheck,
  UserX,
  CalendarDays,
} from "lucide-react";

import EmptyState from "./EmptyState";
import Loading from "./Loading";
import { THEME } from "../../constants/theme";

const roleBadge = {
  admin: { text: THEME.danger, bg: THEME.dangerTint, border: THEME.dangerBorder },
  interviewer: { text: THEME.info, bg: THEME.infoTint, border: THEME.infoBorder },
  candidate: { text: THEME.success, bg: THEME.successTint, border: THEME.successBorder },
};

const UserTable = ({
  users = [],
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
}) => {
  if (loading) {
    return <Loading />;
  }

  if (!users.length) {
    return (
      <EmptyState
        title="No users found"
        description="Registered users will appear here."
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
            User Directory
          </h2>
          <p className="mt-1 text-sm" style={{ color: THEME.inkMuted }}>
            {users.length} registered user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: THEME.surface2 }}>
            <tr className="text-left text-sm" style={{ color: THEME.inkMuted }}>
              <th className="px-8 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Joined</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const role = roleBadge[user.role] || {
                text: THEME.inkMuted,
                bg: THEME.surface2,
                border: THEME.border,
              };

              return (
                <tr
                  key={user._id}
                  className="transition-colors"
                  style={{ borderTop: `1px solid ${THEME.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* User */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          user.profileImage ||
                          user.imageUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "")}`
                        }
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover"
                        style={{ border: `1px solid ${THEME.border}` }}
                      />
                      <div>
                        <h3 className="font-semibold" style={{ color: THEME.ink }}>
                          {user.name}
                        </h3>
                        <p
                          className="text-xs mt-0.5"
                          style={{ fontFamily: THEME.fontMono, color: THEME.inkFaint }}
                        >
                          {user._id.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6">
                    <p className="text-sm" style={{ color: THEME.ink }}>
                      {user.email}
                    </p>
                  </td>

                  {/* Role */}
                  <td className="px-6">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                      style={{ color: role.text, background: role.bg, border: `1px solid ${role.border}` }}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={
                        user.isActive
                          ? { color: THEME.success, background: THEME.successTint, border: `1px solid ${THEME.successBorder}` }
                          : { color: THEME.danger, background: THEME.dangerTint, border: `1px solid ${THEME.dangerBorder}` }
                      }
                    >
                      {user.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-6">
                    <div className="flex items-center gap-2 text-sm" style={{ color: THEME.inkMuted }}>
                      <CalendarDays size={15} />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => onView?.(user)}
                        className="w-9 h-9 rounded-lg transition-colors flex items-center justify-center"
                        style={{ color: THEME.inkMuted }}
                        title="View"
                        onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        onClick={() => onEdit?.(user)}
                        className="w-9 h-9 rounded-lg transition-colors flex items-center justify-center"
                        style={{ color: THEME.primary }}
                        title="Edit"
                        onMouseEnter={(e) => (e.currentTarget.style.background = THEME.primaryTint)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() => onToggleStatus?.(user)}
                        className="w-9 h-9 rounded-lg transition-colors flex items-center justify-center"
                        style={{ color: user.isActive ? THEME.danger : THEME.success }}
                        title={user.isActive ? "Disable user" : "Enable user"}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = user.isActive
                            ? THEME.dangerTint
                            : THEME.successTint)
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {user.isActive ? <UserX size={17} /> : <UserCheck size={17} />}
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

export default UserTable;