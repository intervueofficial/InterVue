import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PROBLEMS } from "../../data/problems";
import Navbar from "../../components/Navbar";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemDescription from "../../components/ProblemDescription";
import OutputPanel from "../../components/OutputPanel";
import CodeEditorPanel from "../../components/CodeEditorPanel";
import { executeCode } from "../../lib/piston";

import toast from "react-hot-toast";
import confetti from "canvas-confetti";

/* ─── Design Tokens (100% match to DashboardPage) ─────────────────────── */
const T = {
  blue: "#1868DB",
  blueHover: "#1558BC",
  blueTint: "#cfe1fd",
  blueMid: "#4A9EE8",
  amber: "#ffab00",
  dark: "#1C2B42",
  body: "#44526C",
  muted: "#6B778C",
  border: "#DFE1E6",
  border2: "#DDDEE1",
  bg: "#FFFFFF",
  surface: "#F8F8F8",
  surface2: "#F4F5F7",
  green: "#00875A",
  greenTint: "rgba(0,135,90,0.08)",
  greenBorder: "rgba(0,135,90,0.2)",
  red: "#DE350B",
  redTint: "rgba(222,53,11,0.08)",
  yellow: "#FF8B00",
  yellowTint: "rgba(255,139,0,0.08)",
  purple: "#6554C0",
  purpleTint: "rgba(101,84,192,0.08)",
};
/* ─── Layout System (NEW) ───────────────────────────── */
const S = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: T.bg,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(28,43,66,0.08)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const DIFF = {
  easy: {
    bg: T.greenTint,
    text: T.green,
    border: T.greenBorder,
    label: "Easy",
  },
  medium: {
    bg: T.yellowTint,
    text: T.yellow,
    border: "rgba(255,139,0,0.2)",
    label: "Medium",
  },
  hard: {
    bg: T.redTint,
    text: T.red,
    border: "rgba(222,53,11,0.2)",
    label: "Hard",
  },
};

/* ─── Shared micro-components ────────────────────────────────────────────── */
function Badge({ children, color, bg, border, style = {} }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 3,
        background: bg,
        color,
        border: `1px solid ${border}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ─── Topbar ─────────────────────────────────────────────────────────────── */
function ProblemTopBar({
  problem,
  currentProblemId,
  allProblems,
  onProblemChange,
  selectedLanguage,
  onLanguageChange,
  isRunning,
  onRunCode,
}) {
  const diff = DIFF[problem.difficulty] || DIFF.medium;

  return (
    <div
      style={{
        background: T.bg,
        borderBottom: `1px solid ${T.border2}`,
        padding: "0 16px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}
      >
        {/* Problem picker */}
        <div style={{ position: "relative" }}>
          <select
            value={currentProblemId}
            onChange={(e) => onProblemChange(e.target.value)}
            style={{
              appearance: "none",
              background: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: 4,
              padding: "5px 28px 5px 10px",
              fontSize: 13,
              fontWeight: 600,
              color: T.dark,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              outline: "none",
              maxWidth: 220,
            }}
          >
            {allProblems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <svg
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 4l4 4 4-4"
              stroke={T.muted}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <Badge color={diff.text} bg={diff.bg} border={diff.border}>
          {diff.label}
        </Badge>

        {/* Breadcrumb separator + problem number pill */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.muted,
            background: T.surface2,
            border: `1px solid ${T.border}`,
            padding: "2px 8px",
            borderRadius: 3,
          }}
        >
          #{allProblems.findIndex((p) => p.id === currentProblemId) + 1} /{" "}
          {allProblems.length}
        </span>
      </div>

      {/* Right: language selector + run */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
      >
        {/* Language picker */}
        <div style={{ position: "relative" }}>
          <select
            value={selectedLanguage}
            onChange={onLanguageChange}
            style={{
              appearance: "none",
              background: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: 4,
              padding: "5px 28px 5px 10px",
              fontSize: 12,
              fontWeight: 600,
              color: T.body,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              outline: "none",
            }}
          >
{["javascript", "python", "java"].map((l) => (
  <option key={l} value={l}>
    {l.charAt(0).toUpperCase() + l.slice(1)}
  </option>
))}
          </select>
          <svg
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 4l4 4 4-4"
              stroke={T.muted}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: T.border }} />

        {/* Run button */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            borderRadius: 4,
            border: "none",
            cursor: isRunning ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            background: isRunning ? T.surface2 : T.green,
            color: isRunning ? T.muted : "#fff",
            transition: "background 0.15s, opacity 0.15s",
            opacity: isRunning ? 0.7 : 1,
            boxShadow: isRunning ? "none" : "0 2px 6px rgba(0,135,90,0.22)",
          }}
        >
          {isRunning ? (
            <>
              <SpinnerIcon size={12} color={T.muted} />
              Running…
            </>
          ) : (
            <>
              <TriangleIcon size={10} color="#fff" />
              Run Code
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Tiny inline icons (no extra import needed) ─────────────────────────── */
function TriangleIcon({ size = 12, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill={color}>
      <polygon points="2,1 9,5 2,9" />
    </svg>
  );
}

function SpinnerIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      style={{ animation: "pp-spin 0.75s linear infinite" }}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function HResizeHandle() {
  return (
    <PanelResizeHandle>
      <div
        style={{
          width: 6,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "col-resize",
        }}
      >
        <div
          style={{
            width: 2,
            height: 40,
            background: T.border,
            opacity: 0.5,
            borderRadius: 2,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.blue;
            e.currentTarget.style.opacity = 1;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.border;
            e.currentTarget.style.opacity = 0.5;
          }}
        />
      </div>
    </PanelResizeHandle>
  );
}

function VResizeHandle() {
  return (
    <PanelResizeHandle>
      <div
        style={{
          height: 6,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "row-resize",
        }}
      >
        <div
          style={{
            height: 2,
            width: 40,
            background: T.border,
            opacity: 0.5,
            borderRadius: 2,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.blue;
            e.currentTarget.style.opacity = 1;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.border;
            e.currentTarget.style.opacity = 0.5;
          }}
        />
      </div>
    </PanelResizeHandle>
  );
}

/* ─── Status bar at the very bottom ─────────────────────────────────────── */
function StatusBar({ isRunning, lastResult }) {
  return (
    <div
      style={{
        height: 24,
        background: "#0f172a",
        borderTop: `1px solid rgba(255,255,255,0.06)`,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 16,
        flexShrink: 0,
      }}
    >
      {/* Left cluster */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.04em",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isRunning ? T.amber : T.green,
              boxShadow: isRunning
                ? `0 0 6px ${T.amber}`
                : `0 0 6px ${T.green}`,
              animation: isRunning ? "pp-pulse 1s infinite" : "none",
            }}
          />
          {isRunning ? "Executing…" : "Ready"}
        </div>

        {lastResult && !isRunning && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: lastResult.success
                ? "rgba(0,220,130,0.8)"
                : "rgba(255,100,80,0.8)",
            }}
          >
            {lastResult.success ? "✓ Tests passed" : "✗ Tests failed"}
          </span>
        )}
      </div>

      {/* Right cluster */}
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          fontWeight: 500,
          letterSpacing: "0.04em",
        }}
      >
        InterviewVault IDE
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
function ProblemPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentProblemId, setCurrentProblemId] = useState("two-sum");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(
    PROBLEMS[currentProblemId].starterCode.javascript,
  );
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const currentProblem = PROBLEMS[currentProblemId];

  useEffect(() => {
    if (id && PROBLEMS[id]) {
      setCurrentProblemId(id);
      setCode(PROBLEMS[id].starterCode[selectedLanguage]);
      setOutput(null);
      setLastResult(null);
    }
  }, [id, selectedLanguage]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    setCode(currentProblem.starterCode[newLang]);
    setOutput(null);
    setLastResult(null);
  };

  const handleProblemChange = (newProblemId) =>
    navigate(`/problem/${newProblemId}`);

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.2, y: 0.6 } });
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.8, y: 0.6 } });
  };

  const normalizeOutput = (output) =>
    output
      .trim()
      .split("\n")
      .map((line) =>
        line
          .trim()
          .replace(/\[\s+/g, "[")
          .replace(/\s+\]/g, "]")
          .replace(/\s*,\s*/g, ","),
      )
      .filter((line) => line.length > 0)
      .join("\n");

  const checkIfTestsPassed = (actualOutput, expectedOutput) =>
    normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);

    const result = await executeCode(selectedLanguage, code);
    setOutput(result);
    setIsRunning(false);

    if (result.success) {
      const expectedOutput = currentProblem.expectedOutput[selectedLanguage];
      const testsPassed = checkIfTestsPassed(result.output, expectedOutput);
      setLastResult({ success: testsPassed });
      if (testsPassed) {
        triggerConfetti();
        toast.success("All tests passed! Great job!");
      } else {
        toast.error("Tests failed. Check your output!");
      }
    } else {
      setLastResult({ success: false });
      toast.error("Code execution failed!");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .pp-root { font-family: 'DM Sans', system-ui, sans-serif; }

        @keyframes pp-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pp-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.5; transform:scale(.82); }
        }

        /* Scrollbar styling for the whole page */
        .pp-root ::-webkit-scrollbar { width: 6px; height: 6px; }
        .pp-root ::-webkit-scrollbar-track { background: ${T.surface}; }
        .pp-root ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
        .pp-root ::-webkit-scrollbar-thumb:hover { background: ${T.muted}; }

        /* Resize handle glow on active drag */
        [data-panel-resize-handle-enabled] { outline: none; }
      `}</style>

      <div
        className="pp-root"
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: T.surface2,
          color: T.dark,
          overflow: "hidden",
        }}
      >
        {/* ── Global navbar (unchanged) ── */}
        <Navbar />

        {/* ── Problem topbar ── */}
        <ProblemTopBar
          problem={currentProblem}
          currentProblemId={currentProblemId}
          allProblems={Object.values(PROBLEMS)}
          onProblemChange={handleProblemChange}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          isRunning={isRunning}
          onRunCode={handleRunCode}
        />

        {/* ── Main split-pane area ── */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <PanelGroup direction="horizontal" style={{ flex: 1 }}>
            {/* ── Left: Problem Description ── */}
            <Panel defaultSize={38} minSize={26}>
              <div
                style={{
                  height: "100%",
                  background: "transparent",
                  padding: 12,
                }}
              >
                <Card
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: `1px solid ${T.border2}`,
                      display: "flex",
                      gap: 8,
                      background: T.surface2,
                    }}
                  >
                    <TabPill active>Problem</TabPill>
                    <TabPill>Hints</TabPill>
                    <TabPill>Discussion</TabPill>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    <ProblemDescription
                      problem={currentProblem}
                      currentProblemId={currentProblemId}
                      onProblemChange={handleProblemChange}
                      allProblems={Object.values(PROBLEMS)}
                    />
                  </div>
                </Card>
              </div>
            </Panel>

            <HResizeHandle />

            {/* ── Right: Editor + Output ── */}
            <Panel defaultSize={62} minSize={36}>
              <PanelGroup direction="vertical" style={{ height: "100%" }}>
                {/* Editor panel */}
                <Panel defaultSize={68} minSize={30}>
                  <div
                    style={{
                      height: "100%",
                      background: "transparent",
                      padding: 12,
                    }}
                  >
                    <Card
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid ${T.border2}`,
                          display: "flex",
                          justifyContent: "space-between",
                          background: "transparent",
                        }}
                      >
                        <TabPill active>
                          <CodeFileIcon />
                          solution.{langExt(selectedLanguage)}
                        </TabPill>
                      </div>

                      {/* Editor */}
                      <div
                        style={{
                          flex: 1,
                          margin: 8,
                          borderRadius: 8,
                          overflow: "hidden",
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
                    </Card>
                  </div>
                </Panel>

                <VResizeHandle />

                <Panel defaultSize={32} minSize={18}>
                  <div
                    style={{
                      height: "100%",
                      background: "transparent",
                      padding: 12,
                    }}
                  >
                    <Card
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          padding: "12px 16px",
                          borderBottom: `1px solid ${T.border2}`,
                          display: "flex",
                          justifyContent: "space-between",
                          background: "transparent",
                        }}
                      >
                        <div style={{ display: "flex", gap: 8 }}>
                          <TabPill active>Output</TabPill>
                          <TabPill>Test Cases</TabPill>
                        </div>

                        {lastResult && (
                          <Badge
                            color={lastResult.success ? T.green : T.red}
                            bg={lastResult.success ? T.greenTint : T.redTint}
                            border={
                              lastResult.success
                                ? T.greenBorder
                                : "rgba(222,53,11,0.2)"
                            }
                          >
                            {lastResult.success ? "✓ Passed" : "✗ Failed"}
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <OutputPanel output={output} />
                      </div>
                    </Card>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>

        {/* ── Status bar ── */}
        <StatusBar isRunning={isRunning} lastResult={lastResult} />
      </div>
    </>
  );
}

/* ─── Tiny helpers ───────────────────────────────────────────────────────── */
function TabPill({ children, active = false }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: active ? 700 : 500,
        color: active ? T.blue : T.muted,
        background: active ? T.blueTint : "transparent",
        border: active
          ? `1px solid rgba(24,104,219,0.2)`
          : "1px solid transparent",
        cursor: "default",
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );
}

function CodeFileIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      style={{ marginRight: 2 }}
    >
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="2"
        stroke="#1868DB"
        strokeWidth="1.4"
      />
      <path
        d="M4 5l2-2 2 2M4 7h4"
        stroke="#1868DB"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function langExt(lang) {
  return (
    { javascript: "js", python: "py", java: "java"}[lang] || lang
  );
}

export default ProblemPage;
