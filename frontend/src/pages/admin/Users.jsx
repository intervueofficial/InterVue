import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Search, AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

import { adminApi } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import AutoRefreshBar from "../../components/admin/AutoRefreshBar";
import { THEME } from "../../constants/theme";

import UserTable from "./UserTable";
import ViewUserModal from "./ViewUserModal";
import EditUserModal from "./EditUserModal";

const ROLES = ["All", "admin", "interviewer", "candidate"];

const Users = () => {
  const { getToken } = useAuth();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");

  const [selectedUser, setSelectedUser] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const token = await getToken();
      return adminApi.getUsers(token);
    },
    retry: 1,
  });

  const users = data?.users || [];

  const filteredUsers = users.filter((user) => {
    const value = search.toLowerCase();
    const matchesSearch =
      user.name?.toLowerCase().includes(value) ||
      user.email?.toLowerCase().includes(value);
    const matchesRole = role === "All" || user.role === role;
    return matchesSearch && matchesRole;
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
      await adminApi.toggleUserStatus(user._id, token);
      toast.success(
        `${user.name || user.email} ${nextStatus ? "enabled" : "disabled"} successfully.`
      );
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update user status.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <PageHeader
          eyebrow="Workspace"
          title="Users"
          description="Manage registered users and their access."
          actions={
            <AutoRefreshBar onRefresh={refetch} isFetching={isFetching} intervalSeconds={30} />
          }
        />
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
        className="rounded-xl p-4"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              color={THEME.inkFaint}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full text-sm outline-none transition-colors"
              style={{
                padding: "9px 12px 9px 34px",
                borderRadius: 8,
                border: `1px solid ${THEME.border}`,
                background: THEME.background,
                color: THEME.ink,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = THEME.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = THEME.border)}
            />
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="text-sm outline-none capitalize"
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${THEME.border}`,
              background: THEME.background,
              color: THEME.ink,
            }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r === "All" ? "All roles" : r}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Table / error state */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
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
              Couldn't load users
            </p>
            <p className="text-xs mt-1 mb-4" style={{ color: THEME.inkFaint }}>
              Something went wrong fetching the user directory.
            </p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: THEME.ink, color: THEME.surface }}
            >
              <RefreshCwIcon size={14} />
              Try again
            </button>
          </div>
        ) : (
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
        )}
      </motion.div>

      {viewOpen && (
        <ViewUserModal user={selectedUser} onClose={() => setViewOpen(false)} />
      )}

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