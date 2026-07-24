import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Panel, PanelGroup } from "react-resizable-panels";
import { T } from "../../constants/sessionTheme";
import GlobalStyles from "./SessionStyles";
import { HHandle } from "./SessionUI";
import InterviewerTopBar from "./InterviewerTopBar";
import InterviewerVideoPanel from "./InterviewerVideoPanel";
import InterviewerLibraryPanel from "./InterviewerLibraryPanel";
import WhiteboardPanel from "./WhiteboardPanel";
import StatusBar from "./StatusBar";

/* ─── Interviewer Layout ─────────────────────────────────────────────────────── */
function InterviewerLayout({
  session,
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
            onEndSession={handleEndSession}
            isEnding={endSessionMutation.isPending}
            recorder={recorder}
            activePage={activePage}
            onPageChange={setActivePage}
            onOpenLibrary={() => setShowLibrary(true)}
          />

          <div style={{ flex: 1, overflow: "hidden" }}>
            {/*
              IMPORTANT: InterviewerVideoPanel (and the StreamVideo/StreamCall/
              VideoCallUI tree inside it) must keep the SAME position/key in
              this tree whether or not the whiteboard is shown. Previously this
              branched with a ternary that put InterviewerVideoPanel inside a
              PanelGroup on one branch and rendered it bare on the other — from
              React's point of view that's two different trees, so opening the
              whiteboard unmounted the live call UI and mounted a fresh one,
              which looked like (and functioned as) the interviewer leaving the
              meeting. Rendering PanelGroup unconditionally and only toggling
              the whiteboard's own Panel keeps InterviewerVideoPanel mounted
              continuously across the toggle.
            */}
            <PanelGroup direction="horizontal" style={{ height: "100%" }}>
              {activePage === "whiteboard" && (
                <Panel key="whiteboard-panel" id="whiteboard-panel" order={1} defaultSize={58} minSize={35}>
                  <div style={{ height: "100%", padding: 8 }}>
                    <WhiteboardPanel
                      session={session}
                      channel={channel}
                      currentUser={{ id: chatClient?.userID, name: chatClient?.user?.name }}
                      permission="interviewer"
                    />
                  </div>
                </Panel>
              )}

              {activePage === "whiteboard" && (
                <div
                  key="whiteboard-handle"
                  style={{
                    width: 8,
                    background: "#060D18",
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <HHandle />
                </div>
              )}

              <Panel
                key="video-panel"
                id="video-panel"
                order={2}
                defaultSize={activePage === "whiteboard" ? 42 : 100}
                minSize={activePage === "whiteboard" ? 24 : 100}
              >
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
              </Panel>
            </PanelGroup>
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
