import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { T } from "../../constants/sessionTheme";
import GlobalStyles from "./SessionStyles";
import InterviewerTopBar from "./InterviewerTopBar";
import InterviewerVideoPanel from "./InterviewerVideoPanel";
import InterviewerLibraryPanel from "./InterviewerLibraryPanel";
import StatusBar from "./StatusBar";

/* ─── Interviewer Layout ─────────────────────────────────────────────────────── */
function InterviewerLayout({
  session,
  role,
  setRole,
  handleEndSession,
  endSessionMutation,
  recorder,
  activePage,
  setActivePage,
  streamClient,
  call,
  chatClient,
  channel,
  isInitializingCall,
  candidateStatus,
  isHost,
}) {
    const [showLibrary, setShowLibrary] = useState(false);

    return (
      <>
        <GlobalStyles />
        <div
          className="sp-root"
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#060D18",
            color: "rgba(255,255,255,0.85)",
            overflow: "hidden",
          }}
        >
          <InterviewerTopBar
            session={session}
            role={role}
            onRoleChange={setRole}
            onEndSession={handleEndSession}
            isEnding={endSessionMutation.isPending}
            recorder={recorder}
            activePage={activePage}
            onPageChange={setActivePage}
            onOpenLibrary={() => setShowLibrary(true)}
          />

          <div style={{ flex: 1, overflow: "hidden" }}>
            <InterviewerVideoPanel
              streamClient={streamClient}
              call={call}
              chatClient={chatClient}
              channel={channel}
              isInitializingCall={isInitializingCall}
              session={session}
              candidateStatus={candidateStatus}
              isHost={isHost}
            />
          </div>

          <StatusBar isRunning={false} lastResult={null} role="interviewer" />
        </div>

        <AnimatePresence>
          {showLibrary && (
            <InterviewerLibraryPanel
              session={session}
              onClose={() => setShowLibrary(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
}

export default InterviewerLayout;
