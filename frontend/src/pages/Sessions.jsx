import { useState } from "react";
import { Plus } from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { useActiveSessions } from "../hooks/useSessions";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SessionGrid from "../components/session/SessionGrid";
import CreateSessionModal from "../components/session/CreateSessionModal";
import { THEME } from "../constants/theme";

const SessionsContent = ({ authUser, sessions, isLoading, showModal, setShowModal }) => (
  <div className="space-y-8">
    <PageHeader
      title="Interview Sessions"
      description="Manage and join scheduled interviews."
      actions={
        authUser?.role === "admin" && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-md font-semibold text-[13px] px-4 py-2.5 transition-colors"
            style={{ background: THEME.ink, color: THEME.surface }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={16} />
            Create Session
          </button>
        )
      }
    />

    {isLoading ? (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg" style={{ color: THEME.primary }}></span>
      </div>
    ) : (
      <SessionGrid sessions={sessions} />
    )}

    <CreateSessionModal isOpen={showModal} onClose={() => setShowModal(false)} />
  </div>
);

const Sessions = () => {
  const { data: authUser } = useAuthUser();
  const { data, isLoading } = useActiveSessions();
  const [showModal, setShowModal] = useState(false);

  const sessions = data?.sessions || [];

  const content = (
    <SessionsContent
      authUser={authUser}
      sessions={sessions}
      isLoading={isLoading}
      showModal={showModal}
      setShowModal={setShowModal}
    />
  );

  // Admin reaches this page through /admin/sessions, nested inside
  // AdminLayout, which already renders the AppShell — so we only wrap
  // it here ourselves for interviewer/candidate, who land on this page
  // directly at /sessions or /candidate/sessions with no other shell.
  if (authUser?.role === "candidate") {
    return <AppShell scope="candidate">{content}</AppShell>;
  }

  if (authUser?.role === "interviewer") {
    return <AppShell scope="interviewer">{content}</AppShell>;
  }

  return content;
};

export default Sessions;
