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

function VideoCallUI({ chatClient, channel, session, isHost }) {
  const navigate = useNavigate();
  const endSessionMutation = useEndSession();

  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

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
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f7f8fa]">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-7 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
          <Loader2Icon className="h-7 w-7 animate-spin text-slate-900" />
          <div className="text-center">
            <p className="text-[13px] font-semibold tracking-tight text-slate-900">
              Joining your interview
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
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
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#f7f8fa] text-slate-900 antialiased">
      {/* ===== Top Bar ===== */}
      <header className="z-20 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <span className="text-[12px] font-bold tracking-tight">I</span>
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[12px] font-semibold tracking-tight text-slate-900">
              {session?.title || "Interview Session"}
            </span>
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
              <CircleDotIcon className="h-2 w-2 text-red-500" />
              <span className="font-medium">Recording</span>
              <span className="text-slate-300">•</span>
              <span>{timeLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div
            className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 ring-1 ring-emerald-100 xl:flex"
            title="AI Face Recognition Active"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-700">
              AI Active
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
            <UsersIcon className="h-3 w-3 text-slate-500" />
            <span>{participantCount}</span>
          </div>

          {chatClient && channel && (
            <button
              type="button"
              onClick={() => setIsChatOpen((v) => !v)}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                isChatOpen
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-slate-900 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.4)] ring-1 ring-slate-200">
            <div className="str-video absolute inset-0 pb-20">
              <SpeakerLayout participantsBarPosition="bottom" />
            </div>

            {/* Floating LIVE badge */}
            <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-md">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </div>

            {/* Floating Controls Bar — overlays inside stage so it never gets clipped */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
              <div className="str-video pointer-events-auto flex max-w-full items-center justify-center rounded-full bg-white/95 px-2 py-1.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.4)] ring-1 ring-black/5 backdrop-blur-md">
                <CallControls onLeave={handleLeave} />
              </div>
            </div>
          </div>
        </main>

        {/* Chat Panel */}
        {chatClient && channel && isChatOpen && (
          <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[340px] flex-col border-l border-slate-200 bg-white shadow-2xl sm:relative sm:shadow-none">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-3">
              <div className="flex min-w-0 flex-col leading-tight">
                <h3 className="truncate text-[12px] font-semibold tracking-tight text-slate-900">
                  In-call messages
                </h3>
                <p className="truncate text-[10px] text-slate-500">
                  Visible to everyone in this room
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close chat"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <Chat client={chatClient} theme="str-chat__theme-light">
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
    </div>
  );
}

export default VideoCallUI;