import { Panel, PanelGroup } from "react-resizable-panels";
import { T } from "../../constants/sessionTheme";
import GlobalStyles from "./SessionStyles";
import { PanelHeader, HHandle, VHandle, CodeFileIcon } from "./SessionUI";
import CandidateTopBar from "./CandidateTopBar";
import ProblemPanel from "./ProblemPanel";
import QuizPanel from "./QuizPanel";
import CandidateVideoPanel from "./CandidateVideoPanel";
import StatusBar from "./StatusBar";
import CodeEditorPanel from "../CodeEditorPanel";
import OutputPanel from "../OutputPanel";

/* ─── Candidate Layout ───────────────────────────────────────────────────────── */
function CandidateLayout({
  session,
  isRunning,
  lastResult,
  selectedLanguage,
  handleLanguageChange,
  handleRunCode,
  role,
  setRole,
  activePage,
  setActivePage,
  problemData,
  loadingSession,
  code,
  setCode,
  output,
  streamClient,
  call,
  chatClient,
  channel,
  isInitializingCall,
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
          background: T.surface,
          color: T.dark,
          overflow: "hidden",
        }}
      >
        <CandidateTopBar
          session={session}
          isRunning={isRunning}
          lastResult={lastResult}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          onRunCode={handleRunCode}
          role={role}
          onRoleChange={setRole}
          activePage={activePage}
          onPageChange={setActivePage}
        />

        <div style={{ flex: 1, overflow: "hidden" }}>
          <PanelGroup direction="horizontal" style={{ height: "100%" }}>
            {/* LEFT: Problem/Quiz + Code + Output */}
            <Panel defaultSize={52} minSize={36}>
              <div style={{ height: "100%" }}>
                {activePage === "problem" ? (
                  <PanelGroup direction="vertical" style={{ height: "100%" }}>
                    <Panel defaultSize={46} minSize={22}>
                      <ProblemPanel
                        problemData={problemData}
                        session={session}
                        loading={loadingSession}
                      />
                    </Panel>

                    <VHandle />

                    <Panel defaultSize={36} minSize={20}>
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          background: T.bg,
                          overflow: "hidden",
                        }}
                      >
                        <PanelHeader>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "4px 10px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: T.blue,
                                background: T.blueTint,
                              }}
                            >
                              <CodeFileIcon />
                              solution.
                              {
                                {
                                  javascript: "js",
                                  python: "py",
                                  java: "java",
                                }[selectedLanguage]
                              }
                            </div>
                          </div>
                        </PanelHeader>

                        <div
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            background: "#0f172a",
                            margin: 8,
                            borderRadius: 8,
                          }}
                        >
                          <CodeEditorPanel
                            selectedLanguage={selectedLanguage}
                            code={code}
                            isRunning={isRunning}
                            onLanguageChange={handleLanguageChange}
                            onCodeChange={setCode}
                            onRunCode={handleRunCode}
                          />
                        </div>
                      </div>
                    </Panel>

                    <VHandle />

                    <Panel defaultSize={18} minSize={12}>
                      <OutputPanel output={output} />
                    </Panel>
                  </PanelGroup>
                ) : (
                  <QuizPanel
                    problemData={problemData}
                    session={session}
                    loading={loadingSession}
                  />
                )}
              </div>
            </Panel>

            <div
              style={{
                width: 8,
                background: T.surface,
                borderLeft: `1px solid ${T.border}`,
                borderRight: `1px solid ${T.border}`,
              }}
            >
              <HHandle />
            </div>

            {/* RIGHT: Video */}
            <Panel defaultSize={48} minSize={30}>
              <CandidateVideoPanel
                streamClient={streamClient}
                call={call}
                chatClient={chatClient}
                channel={channel}
                isInitializingCall={isInitializingCall}
                session={session}
                isHost={isHost}
              />
            </Panel>
          </PanelGroup>
        </div>

        <StatusBar
          isRunning={isRunning}
          lastResult={lastResult}
          role="candidate"
        />
      </div>
    </>
  );
}

export default CandidateLayout;