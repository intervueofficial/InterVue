import { motion, AnimatePresence } from "framer-motion";
import {
  ClockIcon,
  UsersIcon,
  MonitorIcon,
  CircleIcon,
  StopCircleIcon,
  LogOutIcon,
  SendIcon,
} from "lucide-react";
import { T, DIFF } from "../../constants/sessionTheme";
import { Badge, SpinnerIcon } from "./SessionUI";
import useSessionTimer from "../../hooks/session/useSessionTimer";

/* ─── Interviewer Top Bar ───────────────────────────────────────────────────── */
function InterviewerTopBar({
  session,
  onEndSession,
  isEnding,
  recorder,
  activePage,
  onPageChange,
  onOpenLibrary,
}) {
  const isLive = session?.status === "active" || session?.status === "live";
  const activeContentLabel =
    session?.activeProblem?.title ||
    session?.activeQuiz?.title ||
    "Nothing sent yet";
  const diff = DIFF[session?.difficulty] || DIFF.medium;
  const timer = useSessionTimer(isLive);

  return (
    <div
      style={{
        height: 50,
        background: "#0D1520",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
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
        {/* Live badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: isLive
              ? "rgba(0,135,90,0.15)"
              : "rgba(255,255,255,0.05)",
            border: `1px solid ${isLive ? "rgba(0,135,90,0.3)" : "rgba(255,255,255,0.1)"}`,
            padding: "4px 10px",
            borderRadius: 3,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isLive ? "#22C55E" : "rgba(255,255,255,0.3)",
              animation: isLive ? "sp-pulse 2s infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: isLive ? "#22C55E" : "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
            }}
          >
            {isLive ? "Live Interview" : "Completed"}
          </span>
        </div>

        {/* Timer */}
        {isLive && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <ClockIcon size={11} />
            {timer}
          </div>
        )}

        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {activeContentLabel}
        </span>

        {session?.activeProblem?.difficulty && (
          <Badge
            color={DIFF[session.activeProblem.difficulty?.toLowerCase()]?.text || diff.text}
            bg={DIFF[session.activeProblem.difficulty?.toLowerCase()]?.bg || diff.bg}
            border={DIFF[session.activeProblem.difficulty?.toLowerCase()]?.border || diff.border}
          >
            {session.activeProblem.difficulty}
          </Badge>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            fontWeight: 500,
          }}
        >
          <UsersIcon size={12} color="rgba(255,255,255,0.4)" />
          {session?.candidate ? "2" : "1"}/2
        </div>
      </div>

      {/* Right — interviewer actions */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
      >
        {/* Send problem/quiz to candidate */}
        <button
          onClick={onOpenLibrary}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 4,
            border: "1px solid rgba(24,104,219,0.4)",
            background: "rgba(24,104,219,0.15)",
            color: "#7CB3FF",
            fontSize: 11.5,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <SendIcon size={12} />
          Send to Candidate
        </button>

        <div
          style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }}
        />

        {/* Recording status / download */}
        <AnimatePresence>
          {recorder.blob && !recorder.recording && (
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              onClick={recorder.download}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 4,
                border: "1px solid rgba(34,197,94,0.3)",
                background: "rgba(34,197,94,0.1)",
                color: "#22C55E",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              ⬇ Download Recording
            </motion.button>
          )}
        </AnimatePresence>

        {recorder.error && (
          <span style={{ fontSize: 11, color: "#F87171", fontWeight: 500 }}>
            {recorder.error}
          </span>
        )}

        {/* Record button */}
        {!recorder.recording ? (
          <button
            onClick={recorder.start}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 4,
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.1)",
              color: "#F87171",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
          >
            <CircleIcon size={10} style={{ fill: "#F87171" }} />
            Record Screen
          </button>
        ) : (
          <button
            onClick={recorder.stop}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 4,
              border: "1px solid rgba(239,68,68,0.5)",
              background: "rgba(239,68,68,0.18)",
              color: "#F87171",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              animation: "recPulse 1.2s ease-in-out infinite",
            }}
          >
            <StopCircleIcon size={10} />
            {recorder.formatDuration(recorder.duration)}
          </button>
        )}

        <div
          style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }}
        />

        {/* Fullscreen */}
        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.6)",
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
          Full
        </button>

        {/* End session */}
        {session?.status === "active" && (
          <button
            onClick={onEndSession}
            disabled={isEnding}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 4,
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.12)",
              color: "#F87171",
              fontSize: 12,
              fontWeight: 700,
              cursor: isEnding ? "not-allowed" : "pointer",
              opacity: isEnding ? 0.65 : 1,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
          >
            {isEnding ? (
              <SpinnerIcon size={11} color="#F87171" />
            ) : (
              <LogOutIcon size={11} />
            )}
            {isEnding ? "Ending…" : "End Session"}
          </button>
        )}
      </div>
    </div>
  );
}

export default InterviewerTopBar;
