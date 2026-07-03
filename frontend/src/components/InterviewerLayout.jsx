import { T } from "../../constants/sessionTheme";
import GlobalStyles from "./SessionStyles";
import InterviewerTopBar from "./InterviewerTopBar";
import InterviewerVideoPanel from "./InterviewerVideoPanel";
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
      </>
    );
}

export default InterviewerLayout;