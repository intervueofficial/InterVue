import { T } from "../../constants/sessionTheme";

/* ─── Status bar ─────────────────────────────────────────────────────────────── */
function StatusBar({ isRunning, lastResult, role }) {
  return (
    <div
      style={{
        height: 24,
        background: role === "interviewer" ? "#060D18" : "#0f172a",
        borderLeft: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 16,
        flexShrink: 0,
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "rgba(255,255,255,0.42)",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isRunning ? T.amber : T.green,
              boxShadow: `0 0 5px ${isRunning ? T.amber : T.green}`,
              animation: isRunning ? "sp-pulse 1s infinite" : "none",
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
                ? "rgba(0,210,120,0.8)"
                : "rgba(255,90,70,0.8)",
            }}
          >
            {lastResult.success ? "✓ Ran successfully" : "✗ Execution error"}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.22)",
          letterSpacing: "0.04em",
          fontWeight: 500,
        }}
      >
        InterVue IDE ·{" "}
        {role === "interviewer" ? "Interviewer View" : "Candidate View"}
      </span>
    </div>
  );
}

export default StatusBar;
