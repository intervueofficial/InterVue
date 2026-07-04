import { useState } from "react";
import { Plus } from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { useActiveSessions } from "../hooks/useSessions";

import Navbar from "../components/Navbar";
import SessionGrid from "../components/session/SessionGrid";
import CreateSessionModal from "../components/session/CreateSessionModal";

const Sessions = () => {
  const { data: authUser } = useAuthUser();

  const { data, isLoading } = useActiveSessions();

  const [showModal, setShowModal] = useState(false);

  const sessions = data?.sessions || [];

  // Admin reaches this page through /admin/sessions, nested inside
  // AdminLayout, which already renders the sidebar — so we only show
  // the top navbar here for interviewer/candidate, who land on this
  // page directly at /sessions or /candidate/sessions with no other shell.
  const showNavbar = authUser?.role === "interviewer" || authUser?.role === "candidate";

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      {showNavbar && <Navbar />}
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1
              className="text-4xl font-bold"
              style={{ color: "#2563EB", letterSpacing: "-0.5px" }}
            >
              Interview Sessions
            </h1>

            <p className="text-slate-500 mt-2">
              Manage and join scheduled interviews.
            </p>
          </div>

          {authUser?.role === "admin" && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl font-semibold text-white px-5 py-3 transition-all duration-200"
              style={{
                background: "#2563EB",
                boxShadow: "0 4px 14px rgba(37,99,235,0.28)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1D4ED8";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(37,99,235,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2563EB";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 14px rgba(37,99,235,0.28)";
              }}
            >
              <Plus size={18} />
              Create Session
            </button>
          )}
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <span
                className="loading loading-spinner loading-lg"
                style={{ color: "#2563EB" }}
              ></span>
            </div>
          ) : (
            <SessionGrid sessions={sessions} />
          )}
        </div>
      </div>

      <CreateSessionModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default Sessions;