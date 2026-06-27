import {
  CallControls,
  CallingState,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Loader2Icon, MessageSquareIcon, UsersIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import toast from "react-hot-toast";
import { useEndSession } from "../hooks/useSessions";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";

/* ─── Global CSS overrides for Stream SDK (light, professional) ── */
const OVERRIDE_CSS = `
  /* ── Video SDK: Reset dark defaults to clean light ── */
  .intervue-video-root {
    --str-video__button-primary-base: #F8F9FA;
    --str-video__button-default-hover: #E9ECEF;
    --str-video__button-secondary-active: #FDECEA;
    --str-video__button-tertiary-base: #FDECEA;
    --str-video__button-tertiary-hover: #FBBCB9;
    --str-video__icon-default: #44526C;
    --str-video__icon-hover: #1C2B42;
    --str-video__icon-active: #44526C;
    --str-video__icon-alert: #E53E3E;
    --str-video__border-radius-circle: 12px;
    --str-video__border-radius-xs: 10px;
  }

  /* Controls strip background */
  .intervue-video-root .str-video__call-controls {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
  }

  /* Every button base */
  .intervue-video-root .str-video__composite-button__button-group {
    background-color: #F0F2F5 !important;
    border-radius: 12px !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04) !important;
    transition: all 0.15s ease !important;
  }
  .intervue-video-root .str-video__composite-button__button-group:not(.str-video__composite-button__button-group--disabled):hover {
    background-color: #E2E6EA !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important;
    transform: translateY(-1px) !important;
  }

  /* Active (muted/camera off) = soft red tint */
  .intervue-video-root .str-video__composite-button__button-group--active-secondary {
    background-color: #FEF2F2 !important;
    box-shadow: 0 1px 3px rgba(220,53,46,0.15) !important;
  }
  .intervue-video-root .str-video__composite-button__button-group--active-secondary .str-video__icon {
    background-color: #DC2626 !important;
  }
  .intervue-video-root .str-video__composite-button__button-group--active-secondary:not(.str-video__composite-button__button-group--disabled):hover {
    background-color: #FEE2E2 !important;
  }

  /* Leave button = red */
  .intervue-video-root .str-video__call-controls__button--variant-danger,
  .intervue-video-root .str-video__composite-button__button-group.str-video__composite-button__button-group--active-secondary[title*="Leave"],
  .intervue-video-root button[title="Leave call"] .str-video__composite-button__button-group,
  .intervue-video-root .str-video__hang-up-call-button .str-video__composite-button__button-group {
    background-color: #DC2626 !important;
    box-shadow: 0 2px 8px rgba(220,38,38,0.25) !important;
  }
  .intervue-video-root .str-video__call-controls__button--variant-danger .str-video__icon,
  .intervue-video-root .str-video__hang-up-call-button .str-video__icon {
    background-color: #fff !important;
  }
  .intervue-video-root .str-video__call-controls__button--variant-danger:hover .str-video__composite-button__button-group,
  .intervue-video-root .str-video__hang-up-call-button:hover .str-video__composite-button__button-group {
    background-color: #B91C1C !important;
    transform: translateY(-1px) !important;
  }

  /* Icon mask color for normal state */
  .intervue-video-root .str-video__composite-button__button-group .str-video__icon {
    background-color: #44526C !important;
  }

  /* Speaker layout */
  .intervue-video-root .str-video__speaker-layout {
    background: transparent !important;
  }
  .intervue-video-root .str-video__participant-view {
    border-radius: 10px !important;
    overflow: hidden !important;
    border: 1px solid #E2E8F0 !important;
  }
  .intervue-video-root .str-video__participant-view--dominant {
    border-color: #3B82F6 !important;
    box-shadow: 0 0 0 2px rgba(59,130,246,0.2) !important;
  }
  .intervue-video-root .str-video__video-placeholder {
    background: #EEF2F7 !important;
  }
  .intervue-video-root .str-video__participant-details {
    background: linear-gradient(to top, rgba(0,0,0,0.4), transparent) !important;
  }

  /* Caption labels */
  .intervue-video-root .str-video__composite-button--caption {
    color: #6B7A99 !important;
    font-size: 10px !important;
    font-weight: 600 !important;
    font-family: 'DM Sans', sans-serif !important;
    letter-spacing: 0.02em !important;
    margin-top: 4px !important;
  }

  /* ── Chat SDK: full white professional theme ── */
  .intervue-chat-root .str-chat {
    --str-chat__primary-color: #3B82F6;
    --str-chat__background-color: #FFFFFF;
    --str-chat__secondary-background-color: #FFFFFF;
    --str-chat__surface-color: #E5E7EB;
    --str-chat__secondary-surface-color: #F3F4F6;
    --str-chat__tertiary-surface-color: #F9FAFB;
    --str-chat__text-color: #1F2937;
    --str-chat__text-low-emphasis-color: #9CA3AF;
    --str-chat__message-bubble-background-color: #F3F4F6;
    --str-chat__own-message-bubble-background-color: #EFF6FF;
    --str-chat__own-message-bubble-color: #1E40AF;
    --str-chat__message-bubble-color: #1F2937;
    --str-chat__message-input-background-color: #FFFFFF;
    --str-chat__channel-header-background-color: #FFFFFF;
    --str-chat__disabled-color: #D1D5DB;
  }
  .intervue-chat-root .str-chat__channel {
    background: #FFFFFF !important;
  }
  .intervue-chat-root .str-chat__list {
    background: #FFFFFF !important;
  }
  .intervue-chat-root .str-chat__message-input {
    background: #F9FAFB !important;
    border-top: 1px solid #E5E7EB !important;
  }
  .intervue-chat-root .str-chat__message-textarea-container {
    background: #FFFFFF !important;
    border: 1px solid #D1D5DB !important;
    border-radius: 10px !important;
  }
  .intervue-chat-root .str-chat__message-textarea-container:focus-within {
    border-color: #3B82F6 !important;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
  }
  .intervue-chat-root .str-chat__message-textarea {
    color: #1F2937 !important;
    font-size: 13px !important;
  }
  .intervue-chat-root .str-chat__message-textarea::placeholder {
    color: #9CA3AF !important;
  }
  .intervue-chat-root .str-chat__send-button svg path {
    fill: #3B82F6 !important;
  }
  .intervue-chat-root .str-chat__message--me .str-chat__message-bubble {
    background: #EFF6FF !important;
    color: #1E40AF !important;
  }
  .intervue-chat-root .str-chat__message-bubble {
    background: #F3F4F6 !important;
    color: #1F2937 !important;
    font-size: 13px !important;
  }
  .intervue-chat-root .str-chat__date-separator {
    color: #9CA3AF !important;
  }
  .intervue-chat-root .str-chat__date-separator-line {
    background: #E5E7EB !important;
  }
  .intervue-chat-root .str-chat__message-metadata {
    color: #9CA3AF !important;
    font-size: 10px !important;
  }

  /* Scrollbars */
  .intervue-video-root ::-webkit-scrollbar,
  .intervue-chat-root ::-webkit-scrollbar { width: 4px; }
  .intervue-video-root ::-webkit-scrollbar-thumb,
  .intervue-chat-root ::-webkit-scrollbar-thumb {
    background: #CBD5E0;
    border-radius: 99px;
  }

  /* Joining animation */
  @keyframes ivue-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ivue-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50% { opacity:0.5; transform:scale(0.85); }
  }
`;

/* ─── Design tokens (light theme) ────────────────────────────── */
const T = {
  white: "#FFFFFF",
  bg: "#F8F9FA",
  surface: "#F0F2F5",
  border: "#E2E8F0",
  borderLight: "#EEF2F7",
  text: "#1C2B42",
  muted: "#6B7A99",
  blue: "#3B82F6",
  blueTint: "#EFF6FF",
  blueBorder: "rgba(59,130,246,0.25)",
  green: "#10B981",
  greenTint: "#ECFDF5",
  greenBorder: "rgba(16,185,129,0.25)",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
};

/* ─── Joining screen ─────────────────────────────────────────── */
function JoiningScreen() {
  return (
    <div
      style={{
        height: "100%",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
      }}
    >
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `2px solid ${T.border}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: T.blue,
            animation: "ivue-spin 0.9s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 10,
            borderRadius: "50%",
            background: T.blueTint,
            border: `1px solid ${T.blueBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2Icon size={16} color={T.blue} />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 14,
            fontWeight: 700,
            color: T.text,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Joining call…
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: T.muted,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Setting up your video & audio
        </p>
      </div>
    </div>
  );
}

/* ─── Header ─────────────────────────────────────────────────── */
function VideoHeader({ participantCount, isChatOpen, onChatToggle, hasChatClient }) {
  const connected = participantCount >= 2;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: T.white,
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}
    >
      {/* Status pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "4px 10px",
            borderRadius: 6,
            background: connected ? T.greenTint : T.surface,
            border: `1px solid ${connected ? T.greenBorder : T.border}`,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: connected ? T.green : "#CBD5E0",
              animation: connected ? "ivue-pulse 2s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: connected ? T.green : T.muted,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {connected ? "Live" : "Waiting"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: T.muted,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          <UsersIcon size={11} color={T.muted} />
          {participantCount}/2
        </div>
      </div>

      {/* Chat toggle */}
      {hasChatClient && (
        <button
          onClick={onChatToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px solid ${isChatOpen ? T.blueBorder : T.border}`,
            background: isChatOpen ? T.blueTint : T.surface,
            color: isChatOpen ? T.blue : T.muted,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s ease",
            boxShadow: isChatOpen ? `0 0 0 3px rgba(59,130,246,0.08)` : T.shadow,
          }}
        >
          <MessageSquareIcon size={12} />
          Chat
        </button>
      )}
    </div>
  );
}

/* ─── Controls bar ───────────────────────────────────────────── */
function ControlsBar({ onLeave }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: T.white,
        borderTop: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20%",
          right: "20%",
          height: 2,
          borderRadius: "0 0 2px 2px",
          background: `linear-gradient(90deg, transparent, ${T.blue}, transparent)`,
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />
      {/* We add our class here so CSS overrides apply */}
      <div className="intervue-video-root">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
}

/* ─── Chat panel ─────────────────────────────────────────────── */
function ChatPanel({ chatClient, channel, isOpen, onClose }) {
  return (
    <div
      style={{
        width: isOpen ? 268 : 0,
        minWidth: isOpen ? 268 : 0,
        opacity: isOpen ? 1 : 0,
        overflow: "hidden",
        transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
        display: "flex",
        flexDirection: "column",
        background: T.white,
        borderLeft: `1px solid ${T.border}`,
        flexShrink: 0,
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {isOpen && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Chat header */}
          <div
            style={{
              padding: "11px 14px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: T.bg,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: T.blueTint,
                  border: `1px solid ${T.blueBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquareIcon size={13} color={T.blue} />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.text,
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.2,
                  }}
                >
                  Session Chat
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 9,
                    color: T.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Private channel
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                border: `1px solid ${T.border}`,
                background: T.white,
                color: T.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.surface;
                e.currentTarget.style.color = T.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.white;
                e.currentTarget.style.color = T.muted;
              }}
            >
              <XIcon size={12} />
            </button>
          </div>

          {/* Stream Chat — wrapped in our scoping class */}
          <div className="intervue-chat-root" style={{ flex: 1, overflow: "hidden" }}>
            <Chat client={chatClient} theme="str-chat__theme-light">
              <Channel channel={channel}>
                <Window>
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            </Chat>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main VideoCallUI ───────────────────────────────────────── */
function VideoCallUI({ chatClient, channel, session, isHost }) {
  const navigate = useNavigate();
  const endSessionMutation = useEndSession();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLeave = async () => {
    try {
      if (isHost) {
        await endSessionMutation.mutateAsync(session._id);
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to end session");
    }
  };

  if (callingState === CallingState.JOINING) {
    return <JoiningScreen />;
  }

  return (
    <>
      <style>{OVERRIDE_CSS}</style>

      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: T.bg,
          overflow: "hidden",
        }}
      >
        {/* Main area: video column + chat panel */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Video column */}
          <div
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Header */}
            <VideoHeader
              participantCount={participantCount}
              isChatOpen={isChatOpen}
              onChatToggle={() => setIsChatOpen((o) => !o)}
              hasChatClient={!!(chatClient && channel)}
            />

            {/* Video viewport */}
            <div
              className="intervue-video-root"
              style={{
                flex: 1,
                overflow: "hidden",
                position: "relative",
                background: "#1A1F2E",
                margin: "8px 8px 0",
                borderRadius: "12px 12px 0 0",
                border: `1px solid ${T.border}`,
                borderBottom: "none",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              <SpeakerLayout />

              {/* Watermark chip */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  padding: "4px 9px",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: participantCount >= 2 ? "#10B981" : "#9CA3AF",
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.7)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  InterVue
                </span>
              </div>
            </div>

            {/* Controls bar */}
            <div
              style={{
                margin: "0 8px 8px",
                borderRadius: "0 0 12px 12px",
                border: `1px solid ${T.border}`,
                borderTop: "none",
                overflow: "hidden",
                background: T.white,
                boxShadow: T.shadowMd,
              }}
            >
              <ControlsBar onLeave={handleLeave} />
            </div>
          </div>

          {/* Chat panel */}
          {chatClient && channel && (
            <ChatPanel
              chatClient={chatClient}
              channel={channel}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default VideoCallUI;