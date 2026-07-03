import { useState, useEffect } from "react";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import {
  WifiOffIcon,
  ClockIcon,
  UserIcon,
  Code2Icon,
  ActivityIcon,
  ShieldIcon,
  EyeIcon,
} from "lucide-react";
import { T } from "../../constants/sessionTheme";
import { SpinnerIcon } from "./SessionUI";
import VideoCallUI from "../VideoCallUI";
import AIProctorStream from "../AIProctorStream";

/* ─── Interviewer Stats Panel ────────────────────────────────────────────────── */
function InterviewerStatsPanel({ session, candidateStatus }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const stats = [
    {
      label: "Session Duration",
      value: `${mm}:${ss}`,
      Icon: ClockIcon,
      color: "#06B6D4",
    },
    {
      label: "Candidate",
      value: candidateStatus,
      Icon: UserIcon,
      color: "#A78BFA",
    },
    {
      label: "Problem",
      value: session?.problem || "—",
      Icon: Code2Icon,
      color: "#34D399",
    },
    {
      label: "Difficulty",
      value: (session?.difficulty || "—").toUpperCase(),
      Icon: ActivityIcon,
      color:
        session?.difficulty === "hard"
          ? "#F87171"
          : session?.difficulty === "medium"
            ? "#FCD34D"
            : "#34D399",
    },
  ];

  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}
    >
      {stats.map(({ label, value, Icon, color }) => (
        <div
          key={label}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6,
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              flexShrink: 0,
              background: `${color}18`,
              border: `1px solid ${color}33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={12} color={color} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 8,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.85)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 80,
              }}
            >
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Interviewer Full Video Panel ───────────────────────────────────────────── */
function InterviewerVideoPanel({
  streamClient,
  call,
  chatClient,
  channel,
  isInitializingCall,
  session,
  candidateStatus,
  isHost,
}) {
  if (isInitializingCall) {
    return (
      <div
        style={{
          height: "100%",
          background: "#060D18",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <SpinnerIcon size={22} color="rgba(255,255,255,0.6)" />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              marginBottom: 4,
            }}
          >
            Connecting…
          </div>
        </div>
      </div>
    );
  }

  if (!streamClient || !call) {
    return (
      <div
        style={{
          height: "100%",
          background: "#060D18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
          <WifiOffIcon size={32} style={{ marginBottom: 12 }} />
          <p>Connection failed</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              background: T.blue,
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#060D18",
        overflow: "hidden",
      }}
    >
      <InterviewerStatsPanel
        session={session}
        candidateStatus={candidateStatus}
      />

      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <StreamVideo client={streamClient}>
          <StreamCall call={call}>
            <VideoCallUI
              chatClient={chatClient}
              channel={channel}
              session={session}
              isHost={true}
            />
          </StreamCall>
        </StreamVideo>
        <AIProctorStream />
      </div>

      <div
        style={{
          padding: "6px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <ShieldIcon size={10} color="#06B6D4" />
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.08em",
            }}
          >
            AI PROCTOR ACTIVE
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <EyeIcon size={10} color="rgba(255,255,255,0.3)" />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
            Interviewer View
          </span>
        </div>
      </div>
    </div>
  );
}

export default InterviewerVideoPanel;
