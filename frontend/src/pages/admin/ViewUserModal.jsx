import {
  X,
  Mail,
  Shield,
  CalendarDays,
  User,
  CircleCheck,
  CircleX,
} from "lucide-react";

const roleColor = {
  admin: "bg-red-100 text-red-700",
  interviewer: "bg-blue-100 text-blue-700",
  candidate: "bg-green-100 text-green-700",
};

const ViewUserModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between border-b px-8 py-6">

          <div>

            <h2 className="text-3xl font-bold">
              User Details
            </h2>

            <p className="text-slate-500 mt-1">
              Complete profile information
            </p>

          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl hover:bg-slate-100 flex justify-center items-center"
          >
            <X />
          </button>

        </div>

        {/* Body */}

        <div className="p-8">

          <div className="flex flex-col items-center">

            <img
              src={
                user.profileImage ||
                user.imageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name
                )}`
              }
              alt={user.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-slate-200"
            />

            <h3 className="text-2xl font-bold mt-5">
              {user.name}
            </h3>

            <span
              className={`mt-3 px-4 py-2 rounded-full font-semibold ${
                roleColor[user.role] ||
                "bg-slate-100 text-slate-700"
              }`}
            >
              {user.role}
            </span>

          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-10">

            {/* Email */}

            <div className="bg-slate-50 rounded-2xl p-5">

              <div className="flex items-center gap-3 mb-3">

                <Mail className="text-blue-600" />

                <h4 className="font-semibold">
                  Email
                </h4>

              </div>

              <p>{user.email}</p>

            </div>

            {/* Status */}

            <div className="bg-slate-50 rounded-2xl p-5">

              <div className="flex items-center gap-3 mb-3">

                <Shield className="text-green-600" />

                <h4 className="font-semibold">
                  Account Status
                </h4>

              </div>

              {user.isActive ? (
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <CircleCheck size={18} />
                  Active
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 font-semibold">
                  <CircleX size={18} />
                  Disabled
                </div>
              )}

            </div>

            {/* Joined */}

            <div className="bg-slate-50 rounded-2xl p-5">

              <div className="flex items-center gap-3 mb-3">

                <CalendarDays className="text-purple-600" />

                <h4 className="font-semibold">
                  Joined
                </h4>

              </div>

              <p>
                {new Date(
                  user.createdAt
                ).toLocaleDateString()}
              </p>

            </div>

            {/* User ID */}

            <div className="bg-slate-50 rounded-2xl p-5">

              <div className="flex items-center gap-3 mb-3">

                <User className="text-orange-600" />

                <h4 className="font-semibold">
                  User ID
                </h4>

              </div>

              <p className="break-all text-sm">
                {user._id}
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ViewUserModal;