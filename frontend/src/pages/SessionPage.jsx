import { useUser } from "@clerk/clerk-react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useEndSession,
  useJoinSession,
  useSessionById,
} from "../hooks/useSessions";
import { PROBLEMS } from "../data/problems";
import { executeCode } from "../lib/piston";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOutIcon,
  UsersIcon,
  Code2Icon,
  BookOpenIcon,
  ListIcon,
  WifiOffIcon,
  CircleIcon,
  StopCircleIcon,
  MonitorIcon,
  UserIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  ShieldIcon,
  ActivityIcon,
} from "lucide-react";
import AIProctorStream from "../components/AIProctorStream";

/* ─── Design Tokens ────────────────────────────────────────────────────────── */
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
  redBorder: "rgba(222,53,11,0.2)",
  yellow: "#FF8B00",
  yellowTint: "rgba(255,139,0,0.08)",
  yellowBorder: "rgba(255,139,0,0.2)",
  purple: "#6554C0",
  purpleTint: "rgba(101,84,192,0.08)",
};

const DIFF = {
  easy: { bg: T.greenTint, text: T.green, border: T.greenBorder, label: "Easy" },
  medium: { bg: T.yellowTint, text: T.yellow, border: T.yellowBorder, label: "Medium" },
  hard: { bg: T.redTint, text: T.red, border: T.redBorder, label: "Hard" },
};

/* ─── Micro helpers ─────────────────────────────────────────────────────────── */
function Badge({ children, color, bg, border, style = {} }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase", padding: "3px 8px", borderRadius: 3,
      background: bg, color, border: `1px solid ${border}`, ...style,
    }}>
      {children}
    </span>
  );
}

function TabPill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 12px", borderRadius: 4, border: "none",
      fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer",
      color: active ? T.blue : T.muted,
      background: active ? T.blueTint : "transparent",
      outline: active ? `1px solid rgba(24,104,219,0.2)` : "1px solid transparent",
      transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </button>
  );
}

function PanelHeader({ children, style = {} }) {
  return (
    <div style={{
      padding: "10px 18px", borderBottom: `1px solid ${T.border2}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: T.surface, flexShrink: 0, gap: 8, ...style,
    }}>
      {children}
    </div>
  );
}

function SkeletonBlock({ w = "100%", h = 14, radius = 4, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: T.surface2, animation: "sp-shimmer 1.4s ease-in-out infinite", ...style,
    }} />
  );
}

function TriangleIcon({ size = 10, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill={color}>
      <polygon points="2,1 9,5 2,9" />
    </svg>
  );
}

function SpinnerIcon({ size = 13, color = T.muted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5"
      style={{ animation: "sp-spin 0.75s linear infinite", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.22" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function CodeFileIcon({ lang }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginRight: 2 }}>
      <rect x="1" y="1" width="10" height="10" rx="2" stroke={T.blue} strokeWidth="1.4" />
      <path d="M4 5l2-2 2 2M4 7h4" stroke={T.blue} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function HHandle() {
  const [hov, setHov] = useState(false);
  return (
    <PanelResizeHandle>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          width: 5, height: "100%", cursor: "col-resize",
          background: hov ? T.blueMid : T.border2,
          transition: "background 0.15s", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
        <div style={{ width: 2, height: 28, borderRadius: 2, background: "rgba(255,255,255,0.5)" }} />
      </div>
    </PanelResizeHandle>
  );
}

function VHandle() {
  const [hov, setHov] = useState(false);
  return (
    <PanelResizeHandle>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          height: 5, width: "100%", cursor: "row-resize",
          background: hov ? T.blueMid : T.border2,
          transition: "background 0.15s", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
        <div style={{ height: 2, width: 28, borderRadius: 2, background: "rgba(255,255,255,0.5)" }} />
      </div>
    </PanelResizeHandle>
  );
}

/* ─── Role Switcher Dropdown ────────────────────────────────────────────────── */
function RoleSwitcher({ role, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const roles = [
    { id: "candidate", label: "Candidate", Icon: UserIcon, color: T.blue },
    { id: "interviewer", label: "Interviewer", Icon: BriefcaseIcon, color: T.purple },
  ];

  const current = roles.find(r => r.id === role) || roles[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", borderRadius: 4,
          border: `1px solid ${role === "interviewer" ? "rgba(101,84,192,0.3)" : T.border}`,
          background: role === "interviewer" ? T.purpleTint : T.surface,
          fontSize: 11, fontWeight: 600, color: role === "interviewer" ? T.purple : T.body,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.15s",
        }}
      >
        <current.Icon size={11} />
        {current.label}
        <ChevronDownIcon size={10} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0,
              background: T.bg, border: `1px solid ${T.border}`,
              borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              overflow: "hidden", zIndex: 200, minWidth: 150,
            }}
          >
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => { onChange(r.id); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 14px", border: "none", cursor: "pointer",
                  background: role === r.id ? (r.id === "interviewer" ? T.purpleTint : T.blueTint) : "transparent",
                  color: role === r.id ? r.color : T.body,
                  fontSize: 12, fontWeight: role === r.id ? 700 : 500,
                  fontFamily: "'DM Sans', sans-serif", textAlign: "left",
                  transition: "background 0.12s",
                }}
              >
                <r.Icon size={12} />
                {r.label}
                {role === r.id && (
                  <span style={{
                    marginLeft: "auto", width: 6, height: 6,
                    borderRadius: "50%", background: r.color,
                  }} />
                )}
              </button>
            ))}

            <div style={{ padding: "8px 14px 10px", borderTop: `1px solid ${T.border2}` }}>
              <p style={{ margin: 0, fontSize: 10, color: T.muted, lineHeight: 1.5 }}>
                {role === "interviewer"
                  ? "Interviewer view: full video, AI proctor, recording"
                  : "Candidate view: code editor + video"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Screen Recorder Hook ──────────────────────────────────────────────────── */
function useScreenRecorder() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      setBlob(null);
      // Request display media (entire screen or window)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen", cursor: "always" },
        audio: true,
      });

      // Also capture mic audio if possible
      let audioStream = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (_) { /* no mic, that's fine */ }

      const tracks = [...displayStream.getTracks()];
      if (audioStream) tracks.push(...audioStream.getAudioTracks());

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setBlob(blob);
        setRecording(false);
        clearInterval(timerRef.current);
        setDuration(0);
        // Stop all tracks
        combinedStream.getTracks().forEach(t => t.stop());
      };

      // Handle user stopping via browser native UI
      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== "inactive") recorder.stop();
      };

      recorder.start(1000);
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err) {
      setError(err.message || "Screen recording failed");
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const download = useCallback(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-recording-${Date.now()}.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [blob]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return { recording, duration, formatDuration, blob, error, start, stop, download };
}

/* ─── Session Timer ─────────────────────────────────────────────────────────── */
function useSessionTimer(active) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* ─── Candidate Top Bar ─────────────────────────────────────────────────────── */
function CandidateTopBar({
  session, isRunning, lastResult, selectedLanguage,
  onLanguageChange, onRunCode, role, onRoleChange,
}) {
  const isLive = session?.status === "active";
  const diff = DIFF[session?.difficulty] || DIFF.medium;
  const timer = useSessionTimer(isLive);

  return (
    <div style={{
      height: 50, background: T.bg,
      borderBottom: `1px solid ${T.border2}`,
      display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 18px", gap: 14, flexShrink: 0,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {/* Live status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: isLive ? T.greenTint : T.surface2,
          border: `1px solid ${isLive ? T.greenBorder : T.border}`,
          padding: "4px 10px", borderRadius: 3,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isLive ? T.green : T.muted,
            animation: isLive ? "sp-pulse 2s infinite" : "none",
          }} />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            color: isLive ? T.green : T.muted, textTransform: "uppercase",
          }}>
            {isLive ? "Live" : "Completed"}
          </span>
        </div>

        {/* Session timer */}
        {isLive && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600, color: T.muted,
          }}>
            <ClockIcon size={11} />
            {timer}
          </div>
        )}

        {/* Problem name */}
        <span style={{
          fontSize: 13, fontWeight: 700, color: T.dark,
          maxWidth: 220, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {session?.problem || "Loading…"}
        </span>

        {session?.difficulty && (
          <Badge color={diff.text} bg={diff.bg} border={diff.border}>{diff.label}</Badge>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.muted, fontWeight: 500 }}>
          <UsersIcon size={12} color={T.muted} />
          {session?.participant ? "2" : "1"}/2
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Role switcher */}
        <RoleSwitcher role={role} onChange={onRoleChange} />

        <div style={{ width: 1, height: 18, background: T.border }} />

        {/* Language picker */}
        <div style={{ position: "relative" }}>
          <select value={selectedLanguage} onChange={onLanguageChange}
            style={{
              appearance: "none", background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: 4,
              padding: "5px 26px 5px 10px", fontSize: 12, fontWeight: 600,
              color: T.body, fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer", outline: "none",
            }}>
            {["javascript", "python", "java", "cpp"].map(l => (
              <option key={l} value={l}>{l === "cpp" ? "C++" : l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
          <svg style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5l3 3 3-3" stroke={T.muted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ width: 1, height: 18, background: T.border }} />

        {/* Run button */}
        <button onClick={onRunCode} disabled={isRunning} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 4, border: "none",
          fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
          background: isRunning ? T.surface2 : T.green,
          color: isRunning ? T.muted : "#fff", cursor: isRunning ? "not-allowed" : "pointer",
          opacity: isRunning ? 0.75 : 1,
          boxShadow: isRunning ? "none" : "0 2px 6px rgba(0,135,90,0.22)",
          transition: "all 0.15s",
        }}>
          {isRunning ? <><SpinnerIcon size={11} />Running…</> : <><TriangleIcon size={9} />Run</>}
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          style={{
            padding: "6px 12px", borderRadius: 4, border: `1px solid ${T.border}`,
            background: T.surface, color: T.body, fontWeight: 600,
            fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 5,
          }}>
          <MonitorIcon size={11} />Fullscreen
        </button>

        {/* Result chip */}
        <AnimatePresence>
          {lastResult && !isRunning && (
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.2 }}>
              <Badge
                color={lastResult.success ? T.green : T.red}
                bg={lastResult.success ? T.greenTint : T.redTint}
                border={lastResult.success ? T.greenBorder : T.redBorder}>
                {lastResult.success ? "✓ Passed" : "✗ Failed"}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Interviewer Top Bar ───────────────────────────────────────────────────── */
function InterviewerTopBar({
  session, role, onRoleChange, onEndSession, isEnding,
  recorder,
}) {
  const isLive = session?.status === "active";
  const diff = DIFF[session?.difficulty] || DIFF.medium;
  const timer = useSessionTimer(isLive);

  return (
    <div style={{
      height: 50, background: "#0D1520",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 18px", gap: 14, flexShrink: 0,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {/* Live badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: isLive ? "rgba(0,135,90,0.15)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${isLive ? "rgba(0,135,90,0.3)" : "rgba(255,255,255,0.1)"}`,
          padding: "4px 10px", borderRadius: 3,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isLive ? "#22C55E" : "rgba(255,255,255,0.3)",
            animation: isLive ? "sp-pulse 2s infinite" : "none",
          }} />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            color: isLive ? "#22C55E" : "rgba(255,255,255,0.4)", textTransform: "uppercase",
          }}>
            {isLive ? "Live Interview" : "Completed"}
          </span>
        </div>

        {/* Timer */}
        {isLive && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
            <ClockIcon size={11} />
            {timer}
          </div>
        )}

        <span style={{
          fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)",
          maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {session?.problem || "Loading…"}
        </span>

        {session?.difficulty && (
          <Badge color={diff.text} bg={diff.bg} border={diff.border}>{diff.label}</Badge>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
          <UsersIcon size={12} color="rgba(255,255,255,0.4)" />
          {session?.participant ? "2" : "1"}/2
        </div>
      </div>

      {/* Right — interviewer actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Role switcher */}
        <RoleSwitcher role={role} onChange={onRoleChange} />

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />

        {/* Recording status / download */}
        <AnimatePresence>
          {recorder.blob && !recorder.recording && (
            <motion.button
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }} onClick={recorder.download}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 4,
                border: "1px solid rgba(34,197,94,0.3)",
                background: "rgba(34,197,94,0.1)", color: "#22C55E",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>
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
          <button onClick={recorder.start} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 4,
            border: "1px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.1)", color: "#F87171",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
          }}>
            <CircleIcon size={10} style={{ fill: "#F87171" }} />
            Record Screen
          </button>
        ) : (
          <button onClick={recorder.stop} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 4,
            border: "1px solid rgba(239,68,68,0.5)",
            background: "rgba(239,68,68,0.18)", color: "#F87171",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            animation: "recPulse 1.2s ease-in-out infinite",
          }}>
            <StopCircleIcon size={10} />
            {recorder.formatDuration(recorder.duration)}
          </button>
        )}

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />

        {/* Fullscreen */}
        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          style={{
            padding: "6px 12px", borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
            fontWeight: 600, fontSize: 11, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 5,
          }}>
          <MonitorIcon size={11} />Full
        </button>

        {/* End session */}
        {session?.status === "active" && (
          <button onClick={onEndSession} disabled={isEnding} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 4,
            border: "1px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.12)", color: "#F87171",
            fontSize: 12, fontWeight: 700, cursor: isEnding ? "not-allowed" : "pointer",
            opacity: isEnding ? 0.65 : 1, fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
          }}>
            {isEnding ? <SpinnerIcon size={11} color="#F87171" /> : <LogOutIcon size={11} />}
            {isEnding ? "Ending…" : "End Session"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Problem Panel ─────────────────────────────────────────────────────────── */
function ProblemPanel({ problemData, session, loading }) {
  const [tab, setTab] = useState("problem");
  const diff = DIFF[session?.difficulty] || DIFF.medium;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg, overflow: "hidden" }}>
      <PanelHeader>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TabPill active={tab === "problem"} onClick={() => setTab("problem")}>
            <BookOpenIcon size={10} /> Problem
          </TabPill>
          <TabPill active={tab === "constraints"} onClick={() => setTab("constraints")}>
            <ListIcon size={10} /> Constraints
          </TabPill>
        </div>
        {session?.host?.firstName && (
          <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>
            Host: <span style={{ color: T.dark, fontWeight: 600 }}>{session.host.firstName}</span>
          </span>
        )}
      </PanelHeader>

      <div style={{ flex: 1, overflowY: "auto" }} className="sp-scroll">
        {loading ? (
          <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            <SkeletonBlock h={22} w="65%" />
            <SkeletonBlock h={13} w="40%" />
            <div style={{ height: 12 }} />
            <SkeletonBlock h={13} /><SkeletonBlock h={13} w="90%" /><SkeletonBlock h={13} w="75%" />
            <div style={{ height: 8 }} />
            <SkeletonBlock h={80} radius={8} />
          </div>
        ) : tab === "problem" ? (
          <div style={{ padding: "22px 22px 32px" }}>
            <motion.div animate="visible" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } } }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                  background: T.blueTint, border: `1px solid rgba(24,104,219,0.2)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Code2Icon size={14} color={T.blue} />
                </div>
                <h2 style={{
                  fontSize: 17, fontWeight: 800, color: T.dark,
                  letterSpacing: "-0.3px", lineHeight: 1.2, margin: 0,
                }}>
                  {problemData?.title || session?.problem || "Loading…"}
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, marginLeft: 42 }}>
                {session?.difficulty && <Badge color={diff.text} bg={diff.bg} border={diff.border}>{diff.label}</Badge>}
                {problemData?.category && <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{problemData.category}</span>}
              </div>
            </motion.div>

            {problemData?.description && (
              <Section title="Description">
                <p style={{ fontSize: 13, color: T.body, lineHeight: 1.75, margin: 0 }}>{problemData.description.text}</p>
                {problemData.description.notes?.map((note, i) => (
                  <p key={i} style={{ fontSize: 13, color: T.body, lineHeight: 1.75, margin: "10px 0 0" }}>{note}</p>
                ))}
              </Section>
            )}

            {problemData?.examples?.length > 0 && (
              <Section title="Examples">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {problemData.examples.map((ex, i) => (
                    <div key={i} style={{
                      background: T.surface, border: `1px solid ${T.border}`,
                      borderRadius: 8, overflow: "hidden",
                    }}>
                      <div style={{
                        padding: "7px 14px", borderBottom: `1px solid ${T.border2}`,
                        display: "flex", alignItems: "center", gap: 7, background: T.surface2,
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: T.blue,
                          background: T.blueTint, border: `1px solid rgba(24,104,219,0.2)`,
                          padding: "1px 6px", borderRadius: 2, letterSpacing: "0.06em", textTransform: "uppercase",
                        }}>Example {i + 1}</span>
                      </div>
                      <div style={{ padding: "12px 14px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: T.blue, fontWeight: 700, minWidth: 58 }}>Input:</span>
                          <span style={{ color: T.dark }}>{ex.input}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginBottom: ex.explanation ? 10 : 0 }}>
                          <span style={{ color: T.green, fontWeight: 700, minWidth: 58 }}>Output:</span>
                          <span style={{ color: T.dark }}>{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div style={{
                            paddingTop: 10, borderTop: `1px solid ${T.border2}`,
                            fontSize: 11, color: T.muted, lineHeight: 1.65,
                            fontFamily: "'DM Sans', sans-serif",
                          }}>
                            <span style={{ fontWeight: 700, color: T.body }}>Explanation: </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        ) : (
          <div style={{ padding: "22px 22px 32px" }}>
            {problemData?.constraints?.length > 0 ? (
              <Section title="Constraints">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {problemData.constraints.map((c, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 14px", borderRadius: 6,
                      background: T.surface, border: `1px solid ${T.border}`,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        background: T.blueTint, border: `1px solid rgba(24,104,219,0.2)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 800, color: T.blue, marginTop: 1,
                      }}>{i + 1}</div>
                      <code style={{ fontSize: 12, color: T.dark, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.6 }}>{c}</code>
                    </div>
                  ))}
                </div>
              </Section>
            ) : (
              <EmptyPane icon={ListIcon} title="No constraints listed" subtitle="This problem has no explicit constraints." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: "0.08em",
        textTransform: "uppercase", marginBottom: 12,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {title}
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
      {children}
    </div>
  );
}

function EmptyPane({ icon: Icon, title, subtitle }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px", gap: 10, textAlign: "center",
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 10, background: T.surface2,
        border: `1px solid ${T.border}`, display: "flex",
        alignItems: "center", justifyContent: "center", marginBottom: 4,
      }}>
        <Icon size={20} color={T.muted} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.muted, maxWidth: 220, lineHeight: 1.6 }}>{subtitle}</div>}
    </div>
  );
}

/* ─── Candidate Video Panel ──────────────────────────────────────────────────── */
function CandidateVideoPanel({ streamClient, call, chatClient, channel, isInitializingCall }) {
  if (isInitializingCall) {
    return (
      <div style={{
        height: "100%", background: "#0f172a",
        borderLeft: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        <SpinnerIcon size={22} color="rgba(255,255,255,0.6)" />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
            Connecting to call…
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Setting up your video session</div>
        </div>
      </div>
    );
  }

  if (!streamClient || !call) {
    return (
      <div style={{
        height: "100%", background: "#0f172a", borderLeft: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: "36px 32px",
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 12, maxWidth: 280, textAlign: "center",
        }}>
          <WifiOffIcon size={22} color={T.red} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Connection Failed</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
            Unable to connect to the video call.
          </div>
          <button onClick={() => window.location.reload()} style={{
            marginTop: 4, padding: "8px 18px", borderRadius: 4, border: "none",
            background: T.blue, color: "#fff", fontSize: 12, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}>Reconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0f172a", borderLeft: `1px solid ${T.border}`, overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <StreamVideo client={streamClient}>
          <StreamCall call={call}>
            <VideoCallUI chatClient={chatClient} channel={channel} />
          </StreamCall>
        </StreamVideo>
        {/* NO AIProctorStream in candidate view */}
      </div>
    </div>
  );
}

/* ─── Interviewer Stats Panel ────────────────────────────────────────────────── */
function InterviewerStatsPanel({ session }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const stats = [
    { label: "Session Duration", value: `${mm}:${ss}`, Icon: ClockIcon, color: "#06B6D4" },
    { label: "Candidate", value: session?.participant?.firstName || "Waiting…", Icon: UserIcon, color: "#A78BFA" },
    { label: "Problem", value: session?.problem || "—", Icon: Code2Icon, color: "#34D399" },
    { label: "Difficulty", value: (session?.difficulty || "—").toUpperCase(), Icon: ActivityIcon, color: session?.difficulty === "hard" ? "#F87171" : session?.difficulty === "medium" ? "#FCD34D" : "#34D399" },
  ];

  return (
    <div style={{
      padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
    }}>
      {stats.map(({ label, value, Icon, color }) => (
        <div key={label} style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 6, padding: "8px 10px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
            background: `${color}18`, border: `1px solid ${color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={12} color={color} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80 }}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Interviewer Full Video Panel ───────────────────────────────────────────── */
function InterviewerVideoPanel({ streamClient, call, chatClient, channel, isInitializingCall, session }) {
  if (isInitializingCall) {
    return (
      <div style={{
        height: "100%", background: "#060D18",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        <SpinnerIcon size={22} color="rgba(255,255,255,0.6)" />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>Connecting…</div>
        </div>
      </div>
    );
  }

  if (!streamClient || !call) {
    return (
      <div style={{ height: "100%", background: "#060D18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
          <WifiOffIcon size={32} style={{ marginBottom: 12 }} />
          <p>Connection failed</p>
          <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", background: T.blue, color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginTop: 8 }}>
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#060D18", overflow: "hidden" }}>
      {/* Stats strip */}
      <InterviewerStatsPanel session={session} />

      {/* Video — takes all remaining height */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <StreamVideo client={streamClient}>
          <StreamCall call={call}>
            <VideoCallUI chatClient={chatClient} channel={channel} />
          </StreamCall>
        </StreamVideo>
        {/* AI Proctor ONLY in interviewer view */}
        <AIProctorStream />
      </div>

      {/* Bottom info bar */}
      <div style={{
        padding: "6px 14px", borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        background: "rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <ShieldIcon size={10} color="#06B6D4" />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>AI PROCTOR ACTIVE</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <EyeIcon size={10} color="rgba(255,255,255,0.3)" />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Interviewer View</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Status bar ─────────────────────────────────────────────────────────────── */
function StatusBar({ isRunning, lastResult, role }) {
  return (
    <div style={{
      height: 24, background: role === "interviewer" ? "#060D18" : "#0f172a",
      borderLeft: `1px solid ${T.border}`,
      display: "flex", alignItems: "center",
      padding: "0 16px", gap: 16, flexShrink: 0,
      borderTop: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
          color: "rgba(255,255,255,0.42)",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isRunning ? T.amber : T.green,
            boxShadow: `0 0 5px ${isRunning ? T.amber : T.green}`,
            animation: isRunning ? "sp-pulse 1s infinite" : "none",
          }} />
          {isRunning ? "Executing…" : "Ready"}
        </div>
        {lastResult && !isRunning && (
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: lastResult.success ? "rgba(0,210,120,0.8)" : "rgba(255,90,70,0.8)",
          }}>
            {lastResult.success ? "✓ All tests passed" : "✗ Tests failed"}
          </span>
        )}
      </div>
      <span style={{
        fontSize: 10, color: "rgba(255,255,255,0.22)",
        letterSpacing: "0.04em", fontWeight: 500,
      }}>
        InterVue IDE · {role === "interviewer" ? "Interviewer View" : "Candidate View"}
      </span>
    </div>
  );
}

/* ─── Main SessionPage ───────────────────────────────────────────────────────── */
function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();

  // Default role is candidate — interviewer can switch via dropdown
  const [role, setRole] = useState("candidate");

  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  const recorder = useScreenRecorder();

  const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);
  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();

  const session = sessionData?.session;
  const isHost = session?.host?.clerkId === user?.id;
  const isParticipant = session?.participant?.clerkId === user?.id;

  const { call, channel, chatClient, isInitializingCall, streamClient } =
    useStreamClient(session, loadingSession, isHost, isParticipant);

  const problemData = session?.problem
    ? Object.values(PROBLEMS).find(p => p.title === session.problem)
    : null;

  /* Anti-cheat + fullscreen enforcement (candidate only) */
  useEffect(() => {
    if (role !== "candidate") return;
    let isTerminated = false;

    const terminate = async (reason) => {
      if (isTerminated) return;
      isTerminated = true;
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/terminate`, {
          method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
          body: JSON.stringify({ candidateId: user?.id, sessionId: session?._id, reason }),
        });
      } catch (_) {}
      document.body.innerHTML = `
        <div style="height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#0F172A;color:white;font-family:sans-serif;">
          <h1 style="font-size:42px;margin-bottom:12px;">Interview Terminated</h1>
          <p style="font-size:18px;color:#CBD5E1;">Suspicious activity detected.</p>
          <p style="margin-top:20px;color:#94A3B8;">Redirecting to dashboard...</p>
        </div>`;
      setTimeout(() => { window.location.href = "/dashboard"; }, 2500);
    };

    const onKeyDown = (e) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["I","J"].includes(e.key)) || (e.ctrlKey && e.key === "u")) {
        e.preventDefault(); terminate("Developer tools detected");
      }
    };

    document.documentElement.requestFullscreen?.();

    const devInterval = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160)
        terminate("Developer tools detected");
    }, 1000);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy",        e => e.preventDefault());
    document.addEventListener("paste",       e => e.preventDefault());
    document.addEventListener("cut",         e => e.preventDefault());
    document.addEventListener("contextmenu", e => e.preventDefault());

    return () => {
      clearInterval(devInterval);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [role, session, user]);

  /* Auto-join */
  useEffect(() => {
    if (!session || !user || loadingSession) return;
    if (isHost || isParticipant) return;
    joinSessionMutation.mutate(id, { onSuccess: refetch });
  }, [session, user, loadingSession, isHost, isParticipant, id]);

  /* Redirect on completion (participant) */
  useEffect(() => {
    if (!session || loadingSession) return;
    if (session.status === "completed" && !isHost) navigate("/dashboard");
  }, [session, loadingSession, navigate, isHost]);

  /* Sync code with problem */
  useEffect(() => {
    if (problemData?.starterCode?.[selectedLanguage]) {
      setCode(problemData.starterCode[selectedLanguage]);
    }
  }, [problemData, selectedLanguage]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    setCode(problemData?.starterCode?.[lang] || "");
    setOutput(null); setLastResult(null);
  };

  const handleRunCode = async () => {
    try {
      setIsRunning(true); setOutput(null);
      const result = await executeCode(selectedLanguage, code);
      setOutput(result);
      setLastResult({ success: result?.success ?? false });
    } catch (err) {
      setOutput({ success: false, error: "Execution failed. Please try again." });
      setLastResult({ success: false });
    } finally {
      setIsRunning(false);
    }
  };

  const handleEndSession = () => {
    if (confirm("End this session? All participants will be disconnected.")) {
      endSessionMutation.mutate(id, { onSuccess: () => navigate("/dashboard") });
    }
  };

  /* ── INTERVIEWER LAYOUT — full-screen video, no compiler ── */
  if (role === "interviewer") {
    return (
      <>
        <GlobalStyles />
        <div className="sp-root" style={{
          height: "100vh", display: "flex", flexDirection: "column",
          background: "#060D18", color: "rgba(255,255,255,0.85)", overflow: "hidden",
        }}>
          <InterviewerTopBar
            session={session}
            role={role}
            onRoleChange={setRole}
            onEndSession={handleEndSession}
            isEnding={endSessionMutation.isPending}
            recorder={recorder}
          />

          {/* Full-screen video */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <InterviewerVideoPanel
              streamClient={streamClient}
              call={call}
              chatClient={chatClient}
              channel={channel}
              isInitializingCall={isInitializingCall}
              session={session}
            />
          </div>

          <StatusBar isRunning={false} lastResult={null} role="interviewer" />
        </div>
      </>
    );
  }

  /* ── CANDIDATE LAYOUT — problem + code + video, NO AI proctor ── */
  return (
    <>
      <GlobalStyles />
      <div className="sp-root" style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: T.surface, color: T.dark, overflow: "hidden",
      }}>
        <CandidateTopBar
          session={session}
          isRunning={isRunning}
          lastResult={lastResult}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          onRunCode={handleRunCode}
          role={role}
          onRoleChange={setRole}
        />

        <div style={{ flex: 1, overflow: "hidden" }}>
          <PanelGroup direction="horizontal" style={{ height: "100%" }}>
            {/* LEFT: Problem + Code + Output */}
            <Panel defaultSize={52} minSize={36}>
              <div style={{ height: "100%", boxShadow: "2px 0 8px rgba(0,0,0,0.05)" }}>
                <PanelGroup direction="vertical" style={{ height: "100%" }}>
                  <Panel defaultSize={46} minSize={22}>
                    <ProblemPanel problemData={problemData} session={session} loading={loadingSession} />
                  </Panel>
                  <VHandle />
                  <Panel defaultSize={36} minSize={20}>
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg, overflow: "hidden" }}>
                      <PanelHeader>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                            color: T.blue, background: T.blueTint, outline: "1px solid rgba(24,104,219,0.2)",
                          }}>
                            <CodeFileIcon />
                            solution.{{ javascript: "js", python: "py", java: "java", cpp: "cpp" }[selectedLanguage]}
                          </div>
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 5,
                          fontSize: 10, fontWeight: 700, color: T.muted,
                          letterSpacing: "0.06em", textTransform: "uppercase",
                        }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: isRunning ? T.amber : T.green,
                            animation: isRunning ? "sp-pulse 1s infinite" : "none",
                          }} />
                          {isRunning ? "Running" : "Ready"}
                        </div>
                      </PanelHeader>
                      <div style={{ flex: 1, overflow: "hidden", background: "#0f172a", margin: 8, borderRadius: 8 }}>
                        <CodeEditorPanel
                          selectedLanguage={selectedLanguage} code={code}
                          isRunning={isRunning} onLanguageChange={handleLanguageChange}
                          onCodeChange={v => setCode(v)} onRunCode={handleRunCode}
                        />
                      </div>
                    </div>
                  </Panel>
                  <VHandle />
                  <Panel defaultSize={18} minSize={12}>
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.surface, overflow: "hidden" }}>
                      <PanelHeader>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <TabPill active>Output</TabPill>
                        </div>
                        <AnimatePresence>
                          {lastResult && !isRunning && (
                            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                              <Badge
                                color={lastResult.success ? T.green : T.red}
                                bg={lastResult.success ? T.greenTint : T.redTint}
                                border={lastResult.success ? T.greenBorder : T.redBorder}>
                                {lastResult.success ? "✓ All Passed" : "✗ Failed"}
                              </Badge>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </PanelHeader>
                      <div style={{ flex: 1, overflow: "hidden", background: "#0f172a", margin: 8, borderRadius: 8 }}>
                        <OutputPanel output={output} />
                      </div>
                    </div>
                  </Panel>
                </PanelGroup>
              </div>
            </Panel>

            <div style={{ width: 8, background: T.surface, borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}>
              <HHandle />
            </div>

            {/* RIGHT: Video (candidate, no AI proctor) */}
            <Panel defaultSize={48} minSize={30}>
              <CandidateVideoPanel
                streamClient={streamClient} call={call}
                chatClient={chatClient} channel={channel}
                isInitializingCall={isInitializingCall}
              />
            </Panel>
          </PanelGroup>
        </div>

        <StatusBar isRunning={isRunning} lastResult={lastResult} role="candidate" />
      </div>
    </>
  );
}

/* ─── Global Styles ──────────────────────────────────────────────────────────── */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
      .sp-root { font-family: 'DM Sans', system-ui, sans-serif; }
      @keyframes sp-spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
      @keyframes sp-pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.78)} }
      @keyframes sp-shimmer { 0%{opacity:1}50%{opacity:0.45}100%{opacity:1} }
      @keyframes recPulse { 0%,100%{opacity:1}50%{opacity:0.6} }
      .sp-scroll::-webkit-scrollbar{width:5px}
      .sp-scroll::-webkit-scrollbar-track{background:${T.surface}}
      .sp-scroll::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px}
      .sp-scroll::-webkit-scrollbar-thumb:hover{background:${T.muted}}
      [data-panel-resize-handle-enabled]{outline:none}
    `}</style>
  );
}

export default SessionPage;