import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCw } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

import { adminApi } from "../../api/adminApi";

import UserTable from "./UserTable";
import ViewUserModal from "./ViewUserModal";
import EditUserModal from "./EditUserModal";

const Users = () => {
  const { getToken } = useAuth();

  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const token = await getToken();
      return adminApi.getUsers(token);
    },
  });

  const users = data?.users || [];

  const filteredUsers = users.filter((user) => {
    const value = search.toLowerCase();

    return (
      user.name?.toLowerCase().includes(value) ||
      user.email?.toLowerCase().includes(value)
    );
  });

  const handleToggleStatus = async (user) => {
    if (togglingId) return;

    const nextStatus = !user.isActive;

    const confirmed = window.confirm(
      `${nextStatus ? "Enable" : "Disable"} ${user.name || user.email}?`
    );

    if (!confirmed) return;

    try {
      setTogglingId(user._id);

      const token = await getToken();

      await adminApi.toggleUserStatus(user._id, nextStatus, token);

      toast.success(
        `${user.name || user.email} ${
          nextStatus ? "enabled" : "disabled"
        } successfully.`
      );

      refetch();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Failed to update user status."
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-4xl font-bold text-slate-900">
            Users
          </h1>

          <p className="text-slate-500 mt-2">
            Manage registered users.
          </p>

        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

      </div>

      {/* Search */}

      <div className="relative max-w-md">

        <Search
          size={18}
          className="absolute left-4 top-3.5 text-slate-400"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-xl border border-slate-300 pl-12 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

      </div>

      {/* Table */}

      <UserTable
        users={filteredUsers}
        loading={isLoading}
        togglingId={togglingId}
        onView={(user) => {
          setSelectedUser(user);
          setViewOpen(true);
        }}
        onEdit={(user) => {
          setSelectedUser(user);
          setEditOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />

      {/* View Modal */}

      {viewOpen && (
        <ViewUserModal
          user={selectedUser}
          onClose={() => setViewOpen(false)}
        />
      )}

      {/* Edit Modal */}

      {editOpen && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            refetch();
            setEditOpen(false);
          }}
        />
      )}

    </div>
  );
};

export default Users;