import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import { WifiOffIcon, VideoIcon } from "lucide-react";
import { T } from "../../constants/sessionTheme";
import VideoCallUI from "../VideoCallUI";

/* ─── Candidate Video Panel ──────────────────────────────────────────────────── */
function CandidateVideoPanel({
  streamClient,
  call,
  chatClient,
  channel,
  isInitializingCall,
  session,
  isHost,
}) {
  const shell = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#0a0f1e",
    borderLeft: `1px solid ${T.border}`,
    overflow: "hidden",
    fontFamily: "'DM Sans', sans-serif",
  };

  const keyframes = `
    @keyframes ivPulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
      50%       { opacity: 0.6; box-shadow: 0 0 0 5px rgba(16,185,129,0); }
    }
    @keyframes ivDot {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.3; }
      40%            { transform: scale(1.2); opacity: 1; }
    }
    @keyframes ivRing {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50%       { opacity: 1;   transform: scale(1.06); }
    }
    @keyframes ivShimmer {
      0%, 100% { opacity: 0.3; }
      50%       { opacity: 0.6; }
    }
  `;

  /* ── header strip (reused across all states) ───────────────────────────── */
  const header = (opts = {}) => (
    <div
      style={{
        height: 44,
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        background: "rgba(255,255,255,0.025)",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        flexShrink: 0,
      }}
    >
      {/* left – role badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            padding: "2px 9px",
            borderRadius: 6,
            background: "rgba(99,102,241,0.14)",
            border: "1px solid rgba(99,102,241,0.3)",
            fontSize: 10,
            fontWeight: 700,
            color: "#a5b4fc",
            letterSpacing: "0.7px",
            textTransform: "uppercase",
          }}
        >
          Video
        </div>
        {session?.title && (
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.38)",
              maxWidth: 130,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {session.title}
          </span>
        )}
      </div>

      {/* right – status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {opts.live && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#10b981",
                animation: "ivPulse 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#10b981",
                letterSpacing: "0.5px",
              }}
            >
              LIVE
            </span>
          </div>
        )}
        {opts.connecting && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#6366f1",
                  animation: `ivDot 1.3s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ── ghost control bar skeleton ─────────────────────────────────────────── */
  const ghostBar = (
    <div
      style={{
        height: 62,
        minHeight: 62,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.25)",
        flexShrink: 0,
        padding: "0 16px",
      }}
    >
      {[44, 44, 44, 44].map((w, i) => (
        <div
          key={i}
          style={{
            width: w,
            height: 36,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            animation: `ivShimmer 1.8s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
      <div
        style={{
          width: 1,
          height: 28,
          background: "rgba(255,255,255,0.07)",
          margin: "0 6px",
        }}
      />
      <div
        style={{
          width: 76,
          height: 36,
          borderRadius: 10,
          background: "rgba(239,68,68,0.1)",
          animation: "ivShimmer 1.8s ease-in-out 0.48s infinite",
        }}
      />
    </div>
  );

  /* ── CONNECTING ─────────────────────────────────────────────────────────── */
  if (isInitializingCall) {
    return (
      <div style={shell}>
        <style>{keyframes}</style>
        {header({ connecting: true })}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
          }}
        >
          {/* animated camera ring */}
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "1.5px solid rgba(99,102,241,0.35)",
                animation: "ivRing 2s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 8,
                borderRadius: "50%",
                background: "rgba(99,102,241,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <VideoIcon size={24} color="#818cf8" />
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "rgba(255,255,255,0.88)",
                letterSpacing: "-0.2px",
                marginBottom: 6,
              }}
            >
              Connecting to session…
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.65,
              }}
            >
              Setting up secure video &amp; audio
            </div>
          </div>
        </div>

        {ghostBar}
      </div>
    );
  }

  /* ── CONNECTION FAILED ──────────────────────────────────────────────────── */
  if (!streamClient || !call) {
    return (
      <div style={shell}>
        <style>{keyframes}</style>
        {header({})}

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "40px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              maxWidth: 290,
              width: "100%",
              textAlign: "center",
            }}
          >
            {/* error icon ring */}
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.09)",
                border: "1.5px solid rgba(239,68,68,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WifiOffIcon size={22} color="#f87171" />
            </div>

            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.88)",
                  letterSpacing: "-0.2px",
                  marginBottom: 6,
                }}
              >
                Connection Failed
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.36)",
                  lineHeight: 1.7,
                }}
              >
                Could not reach the video server.
                <br />
                Check your connection and try again.
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.82";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              style={{
                marginTop: 4,
                padding: "9px 24px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                letterSpacing: "0.1px",
                boxShadow: "0 4px 16px rgba(99,102,241,0.32)",
                transition: "opacity 0.15s, transform 0.15s",
              }}
            >
              Reconnect
            </button>
          </div>
        </div>

        {ghostBar}
      </div>
    );
  }

  /* ── LIVE CALL ──────────────────────────────────────────────────────────── */
  return (
    <div style={shell}>
      <style>{keyframes}</style>
      {header({ live: true })}

      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <StreamVideo client={streamClient}>
          <StreamCall call={call}>
            <VideoCallUI
              chatClient={chatClient}
              channel={channel}
              session={session}
              isHost={isHost}
            />
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}

export default CandidateVideoPanel;
