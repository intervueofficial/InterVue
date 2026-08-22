import {
  CallControls,
  CallingState,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import {
  Loader2Icon,
  MessageSquareIcon,
  UsersIcon,
  XIcon,
  CircleDotIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@clerk/clerk-react";
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
import { applicationApi } from "../api/applicationApi";
import SessionDecisionModal from "./SessionDecisionModal";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";

function VideoCallUI({ chatClient, channel, session, isHost }) {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const endSessionMutation = useEndSession();

  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  const [decisionApplication, setDecisionApplication] = useState(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const handleLeave = async () => {
    try {
      if (isHost) {
        await endSessionMutation.mutateAsync(session._id);

        // Check whether this session came from the job application flow.
        // If so, prompt the interviewer for a hire/reject/wait decision
        // before leaving. Ad-hoc sessions with no linked application
        // skip straight to the dashboard.
        try {
          const token = await getToken();
          const { application } = await applicationApi.getApplicationBySession(
            session._id,
            token
          );

          if (application && application.finalDecision === "pending") {
            setDecisionApplication(application);
            setDecisionModalOpen(true);
            return;
          }
        } catch (lookupErr) {
          console.error("getApplicationBySession:", lookupErr);
        }
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to end session");
    }
  };

  const handleDecisionSubmit = async (decision, feedback, waitDays) => {
    try {
      setSubmittingDecision(true);
      const token = await getToken();
      await applicationApi.submitDecision(
        decisionApplication._id,
        decision,
        feedback,
        waitDays,
        token
      );

      toast.success(
        decision === "waitlisted"
          ? "Candidate moved to waitlist — waiting email sent"
          : "Decision recorded — email sent to candidate"
      );
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit decision");
    } finally {
      setSubmittingDecision(false);
      setDecisionModalOpen(false);
      navigate("/dashboard");
    }
  };

  const handleDecisionSkip = () => {
    setDecisionModalOpen(false);
    navigate("/dashboard");
  };

  if (callingState === CallingState.JOINING) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0B0F17]">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#141A24] px-8 py-7 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
          <Loader2Icon className="h-7 w-7 animate-spin text-white" />
          <div className="text-center">
            <p className="text-[13px] font-semibold tracking-tight text-white">
              Joining your interview
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">
              Preparing camera, mic and AI assistant
            </p>
          </div>
        </div>
      </div>
    );
  }

  const timeLabel = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0B0F17] text-white antialiased">
      {/* ===== Top Bar ===== */}
      <header className="z-20 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#0F141D] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#0B0F17] ring-1 ring-white/20">
            <span className="text-[12px] font-bold tracking-tight">I</span>
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[12px] font-semibold tracking-tight text-white">
              {session?.title || "Interview Session"}
            </span>
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/60">
              <CircleDotIcon className="h-2 w-2 text-red-500" />
              <span className="font-medium text-white/80">Recording</span>
              <span className="text-white/20">•</span>
              <span>{timeLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div
            className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2 py-1 ring-1 ring-emerald-400/30 xl:flex"
            title="AI Face Recognition Active"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-300">
              AI Active
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-white ring-1 ring-white/10">
            <UsersIcon className="h-3 w-3 text-white/70" />
            <span>{participantCount}</span>
          </div>

          {chatClient && channel && (
            <button
              type="button"
              onClick={() => setIsChatOpen((v) => !v)}
              className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 transition ${
                isChatOpen
                  ? "bg-white text-[#0B0F17] ring-white/20 hover:bg-white/90"
                  : "bg-white/10 text-white ring-white/15 hover:bg-white/20"
              }`}
              aria-label="Toggle chat"
            >
              <MessageSquareIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ===== Main ===== */}
      <div className="relative flex min-h-0 flex-1">
        {/* Stage */}
        <main className="relative flex min-w-0 flex-1 flex-col p-2">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-[#111826] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
            <div className="str-video str-video--dark-controls-theme absolute inset-0 pb-20">
              <SpeakerLayout participantsBarPosition="bottom" />
            </div>

            {/* Floating LIVE badge */}
            <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white ring-1 ring-white/15 backdrop-blur-md">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </div>

            {/* Floating Controls Bar */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
              <div className="str-video str-video--dark-controls-theme pointer-events-auto flex max-w-full items-center justify-center rounded-full bg-black/70 px-2 py-1.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] ring-1 ring-white/15 backdrop-blur-md">
                <CallControls onLeave={handleLeave} />
              </div>
            </div>
          </div>
        </main>

        {/* Chat Panel */}
        {chatClient && channel && isChatOpen && (
          <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[340px] flex-col border-l border-white/10 bg-[#0F141D] shadow-2xl sm:relative sm:shadow-none">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-3">
              <div className="flex min-w-0 flex-col leading-tight">
                <h3 className="truncate text-[12px] font-semibold tracking-tight text-white">
                  In-call messages
                </h3>
                <p className="truncate text-[10px] text-white/50">
                  Visible to everyone in this room
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <Chat client={chatClient} theme="str-chat__theme-dark">
                <Channel channel={channel}>
                  <Window>
                    <MessageList />
                    <MessageInput focus />
                  </Window>
                  <Thread />
                </Channel>
              </Chat>
            </div>
          </aside>
        )}
      </div>

      {/* ===== Stream SDK dark-theme + icon overrides ===== */}
      <style>{`
        .str-video--dark-controls-theme .str-video__call-controls__button {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.35) !important;
          color: #ffffff !important;
        }
        .str-video--dark-controls-theme .str-video__call-controls__button svg {
          color: #ffffff !important;
          fill: #ffffff !important;
        }
        .str-video--dark-controls-theme .str-video__call-controls__button:hover {
          background: rgba(255, 255, 255, 0.16) !important;
        }
        /* Disabled / off state (mic muted, camera off) keeps red fill, white icon+border */
        .str-video--dark-controls-theme .str-video__call-controls__button--variant-danger {
          background: rgba(222, 53, 11, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.5) !important;
        }
        .str-video--dark-controls-theme .str-video__call-controls__button--variant-danger svg {
          color: #ffffff !important;
          fill: #ffffff !important;
        }
        /* Participant name labels / call stats text */
        .str-video--dark-controls-theme .str-video__participant-details__name,
        .str-video--dark-controls-theme .str-video__participant-details,
        .str-video--dark-controls-theme .str-video__participant-view__label {
          color: #ffffff !important;
        }
        /* Camera-off placeholder circle: neutral dark ring instead of flat blue */
        .str-video--dark-controls-theme .str-video__avatar-fallback {
          background: #1E2A3D !important;
          color: #ffffff !important;
          border: 2px solid rgba(255, 255, 255, 0.25) !important;
        }
      `}</style>

      <SessionDecisionModal
        open={decisionModalOpen}
        application={decisionApplication}
        onSubmit={handleDecisionSubmit}
        onSkip={handleDecisionSkip}
        loading={submittingDecision}
      />
    </div>
  );
}

export default VideoCallUI;