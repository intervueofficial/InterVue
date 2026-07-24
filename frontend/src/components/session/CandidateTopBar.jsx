import { motion, AnimatePresence } from "framer-motion";
import { ClockIcon, UsersIcon, MonitorIcon, PenToolIcon } from "lucide-react";
import { T, DIFF } from "../../constants/sessionTheme";
import { Badge, SpinnerIcon, TriangleIcon, PageSwitcher } from "./SessionUI";
import useSessionTimer from "../../hooks/session/useSessionTimer";

/* ─── Candidate Top Bar ─────────────────────────────────────────────────────── */
function CandidateTopBar({
  session,
  isRunning,
  lastResult,
  selectedLanguage,
  onLanguageChange,
  onRunCode,
  activePage,
  onPageChange,
}) {
  const isLive = session?.status === "active";
  const diff = DIFF[session?.difficulty] || DIFF.medium;
  const timer = useSessionTimer(isLive);

  const PAGES = [
    { key: "problem", label: "Problem" },
    { key: "quiz", label: "Quiz" },
    { key: "whiteboard", label: "Whiteboard" },
  ];

  return (
    <div
      style={{
        height: 50,
        background: T.bg,
        borderBottom: `1px solid ${T.border2}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        gap: 14,
        flexShrink: 0,
      }}
    >
      {/* Left */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}
      >
        {/* Live status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: isLive ? T.greenTint : T.surface2,
            border: `1px solid ${isLive ? T.greenBorder : T.border}`,
            padding: "4px 10px",
            borderRadius: 3,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isLive ? T.green : T.muted,
              animation: isLive ? "sp-pulse 2s infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: isLive ? T.green : T.muted,
              textTransform: "uppercase",
            }}
          >
            {isLive ? "Live" : "Completed"}
          </span>
        </div>

        {/* Session timer */}
        {isLive && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: T.muted,
            }}
          >
            <ClockIcon size={11} />
            {timer}
          </div>
        )}

        {/* Problem name */}
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: T.dark,
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {session?.problem || "Loading…"}
        </span>

        {session?.difficulty && (
          <Badge color={diff.text} bg={diff.bg} border={diff.border}>
            {diff.label}
          </Badge>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: T.muted,
            fontWeight: 500,
          }}
        >
          <UsersIcon size={12} color={T.muted} />
          {session?.participant ? "2" : "1"}/2
        </div>
      </div>

      {/* Right */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
      >
        {/* Page switcher (Problem | Quiz | Whiteboard) */}
        <PageSwitcher
          activePage={activePage}
          onChange={onPageChange}
          darkMode={false}
          pages={PAGES}
        />

        {/* Fallback explicit tabs in case PageSwitcher ignores custom pages prop */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: T.surface2,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: 2,
          }}
        >
          {PAGES.map((p) => {
            const active = activePage === p.key;
            return (
              <button
                key={p.key}
                onClick={() => onPageChange(p.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 3,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  background: active ? T.surface : "transparent",
                  color: active ? T.dark : T.muted,
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {p.key === "whiteboard" && <PenToolIcon size={11} />}
                {p.label}
              </button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 18, background: T.border }} />

        {/* Language picker */}
        <div style={{ position: "relative" }}>
          <select
            value={selectedLanguage}
            onChange={onLanguageChange}
            style={{
              appearance: "none",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 4,
              padding: "5px 26px 5px 10px",
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
              right: 7,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
          >
            <path
              d="M2 3.5l3 3 3-3"
              stroke={T.muted}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div style={{ width: 1, height: 18, background: T.border }} />

        {/* Run button */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 4,
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            background: isRunning ? T.surface2 : T.green,
            color: isRunning ? T.muted : "#fff",
            cursor: isRunning ? "not-allowed" : "pointer",
            opacity: isRunning ? 0.75 : 1,
            boxShadow: isRunning ? "none" : "0 2px 6px rgba(0,135,90,0.22)",
            transition: "all 0.15s",
          }}
        >
          {isRunning ? (
            <>
              <SpinnerIcon size={11} />
              Running…
            </>
          ) : (
            <>
              <TriangleIcon size={9} />
              Run
            </>
          )}
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.body,
            fontWeight: 600,
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <MonitorIcon size={11} />
          Fullscreen
        </button>

        {/* Result chip */}
        <AnimatePresence>
          {lastResult && !isRunning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
            >
              <Badge
                color={lastResult.success ? T.green : T.red}
                bg={lastResult.success ? T.greenTint : T.redTint}
                border={lastResult.success ? T.greenBorder : T.redBorder}
              >
                {lastResult.success ? "✓ Ran" : "✗ Error"}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CandidateTopBar;