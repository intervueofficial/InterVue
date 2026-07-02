import {
  Eye,
  Pencil,
  UserCheck,
  UserX,
  CalendarDays,
} from "lucide-react";

import EmptyState from "./EmptyState";
import Loading from "./Loading";

const roleColor = {
  admin: "bg-red-100 text-red-700",
  interviewer: "bg-blue-100 text-blue-700",
  candidate: "bg-green-100 text-green-700",
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
        title="No Users Found"
        description="Registered users will appear here."
      />
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}

      <div className="flex items-center justify-between px-8 py-6 border-b">

        <div>

          <h2 className="text-xl font-semibold">
            User Directory
          </h2>

          <p className="text-slate-500 mt-1">
            {users.length} registered users
          </p>

        </div>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-50">

            <tr className="text-left text-sm text-slate-500">

              <th className="px-8 py-4 font-semibold">
                User
              </th>

              <th className="px-6 py-4 font-semibold">
                Email
              </th>

              <th className="px-6 py-4 font-semibold">
                Role
              </th>

              <th className="px-6 py-4 font-semibold">
                Status
              </th>

              <th className="px-6 py-4 font-semibold">
                Joined
              </th>

              <th className="px-6 py-4 text-center font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {users.map((user) => (

              <tr
                key={user._id}
                className="border-t hover:bg-slate-50 transition"
              >

                {/* User */}

                <td className="px-8 py-5">

                  <div className="flex items-center gap-4">

                    <img
                      src={
                        user.profileImage ||
                        user.imageUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}`
                      }
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border"
                    />

                    <div>

                      <h3 className="font-semibold text-slate-900">
                        {user.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {user._id.slice(-8)}
                      </p>

                    </div>

                  </div>

                </td>

                {/* Email */}

                <td className="px-6">

                  <p className="text-slate-700">
                    {user.email}
                  </p>

                </td>

                {/* Role */}

                <td className="px-6">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      roleColor[user.role] ||
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.role}
                  </span>

                </td>

                {/* Status */}

                <td className="px-6">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.isActive
                      ? "Active"
                      : "Disabled"}
                  </span>

                </td>

                {/* Joined */}

                <td className="px-6">

                  <div className="flex items-center gap-2 text-slate-500">

                    <CalendarDays size={16} />

                    {new Date(
                      user.createdAt
                    ).toLocaleDateString()}

                  </div>

                </td>

                {/* Actions */}

                <td className="px-6">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() => onView?.(user)}
                      className="w-10 h-10 rounded-xl hover:bg-slate-100 transition"
                      title="View"
                    >
                      <Eye
                        size={18}
                        className="mx-auto"
                      />
                    </button>

                    <button
                      onClick={() => onEdit?.(user)}
                      className="w-10 h-10 rounded-xl hover:bg-blue-50 transition"
                      title="Edit"
                    >
                      <Pencil
                        size={18}
                        className="mx-auto text-blue-600"
                      />
                    </button>

                    <button
                      onClick={() =>
                        onToggleStatus?.(user)
                      }
                      className={`w-10 h-10 rounded-xl transition ${
                        user.isActive
                          ? "hover:bg-red-50"
                          : "hover:bg-green-50"
                      }`}
                      title={
                        user.isActive
                          ? "Disable User"
                          : "Enable User"
                      }
                    >
                      {user.isActive ? (
                        <UserX
                          size={18}
                          className="mx-auto text-red-600"
                        />
                      ) : (
                        <UserCheck
                          size={18}
                          className="mx-auto text-green-600"
                        />
                      )}
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default UserTable;