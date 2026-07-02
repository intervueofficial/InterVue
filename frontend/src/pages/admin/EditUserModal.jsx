import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  X,
  Save,
  Loader2,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../../api/adminApi";

const inputStyle =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const EditUserModal = ({
  user,
  onClose,
  onSuccess,
}) => {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);

  const handleSave = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      // Update Role
      if (role !== user.role) {
        await adminApi.updateUserRole(
          user._id,
          role,
          token
        );
      }

      // Update Status
      if (isActive !== user.isActive) {
        await adminApi.toggleUserStatus(
          user._id,
          token
        );
      }

      toast.success("User updated successfully");

      onSuccess();

      onClose();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update user."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between border-b px-8 py-6">

          <div>

            <h2 className="text-3xl font-bold">
              Edit User
            </h2>

            <p className="text-slate-500 mt-1">
              Update user role and account status.
            </p>

          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          >
            <X />
          </button>

        </div>

        {/* Body */}

        <div className="p-8 space-y-8">

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
              className="w-20 h-20 rounded-full border object-cover"
            />

            <div>

              <h3 className="text-xl font-semibold">
                {user.name}
              </h3>

              <p className="text-slate-500">
                {user.email}
              </p>

            </div>

          </div>

          {/* Role */}

          <div>

            <label className="font-medium flex items-center gap-2 mb-3">

              <Shield size={18} />

              User Role

            </label>

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              className={inputStyle}
            >
              <option value="admin">
                Admin
              </option>

              <option value="interviewer">
                Interviewer
              </option>

              <option value="candidate">
                Candidate
              </option>

            </select>

          </div>

          {/* Status */}

          <div>

            <label className="font-medium block mb-3">
              Account Status
            </label>

            <div className="flex gap-4">

              <button
                type="button"
                onClick={() =>
                  setIsActive(true)
                }
                className={`flex-1 rounded-xl border px-5 py-4 flex items-center justify-center gap-2 transition ${
                  isActive
                    ? "bg-green-600 text-white border-green-600"
                    : "border-slate-300"
                }`}
              >
                <UserCheck size={18} />

                Active

              </button>

              <button
                type="button"
                onClick={() =>
                  setIsActive(false)
                }
                className={`flex-1 rounded-xl border px-5 py-4 flex items-center justify-center gap-2 transition ${
                  !isActive
                    ? "bg-red-600 text-white border-red-600"
                    : "border-slate-300"
                }`}
              >
                <UserX size={18} />

                Disabled

              </button>

            </div>

          </div>

          {/* Footer */}

          <div className="border-t pt-6 flex justify-end gap-4">

            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default EditUserModal;