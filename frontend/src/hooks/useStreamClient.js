import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";
import { useAuth } from "@clerk/clerk-react";

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const { getToken } = useAuth(); // ✅ HOOK AT TOP LEVEL

  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);

  useEffect(() => {
    let videoCall = null;
    let chatClientInstance = null;
    let isMounted = true; // ✅ prevent state updates after unmount

    const initCall = async () => {
      if (!session?.callId) return;
      if (!isHost && !isParticipant) return;
      if (session.status === "completed") return;

      try {
        // ✅ Get Clerk token
        const clerkToken = await getToken();

        // ✅ Fetch Stream token from backend
        const { token, userId, userName, userImage } =
          await sessionApi.getStreamToken(clerkToken);

        // ✅ Initialize video client
        const client = await initializeStreamClient(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );

        if (!isMounted) return;

        setStreamClient(client);

        // ✅ Join video call
        videoCall = client.call("default", session.callId);
        await videoCall.join({ create: true });

        if (!isMounted) return;
        setCall(videoCall);

        // ✅ Initialize chat client
        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        chatClientInstance = StreamChat.getInstance(apiKey);

        await chatClientInstance.connectUser(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );

        if (!isMounted) return;
        setChatClient(chatClientInstance);

const chatChannel = chatClientInstance.channel(
  "messaging",
  session.callId
);

// 🔥 Ensure user is a member before watching
await chatChannel.watch();

        if (!isMounted) return;
        setChannel(chatChannel);
      } catch (error) {
        // If this invocation was already superseded (e.g. React
        // StrictMode's dev-only mount → cleanup → mount cycle aborted
        // it mid-flight, or the user navigated away), don't show a
        // scary "failed" toast for a run that no longer matters —
        // that's exactly what was causing a false failure toast to
        // appear even when the real, current connection succeeded.
        if (!isMounted) return;

        console.error("Error init call", error);
        toast.error("Failed to join video call");
      } finally {
        if (isMounted) setIsInitializingCall(false);
      }
    };

    if (session && !loadingSession) {
      initCall();
    }

    // ✅ CLEANUP (important for memory + socket leaks)
    return () => {
      isMounted = false;

      (async () => {
        try {
          if (videoCall) await videoCall.leave();
          if (chatClientInstance) await chatClientInstance.disconnectUser();
          await disconnectStreamClient();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
    // ⚠️ Deliberately NOT depending on the whole `session` object here.
    // `session` comes from a query that polls every few seconds and
    // returns a brand-new object reference each time even when nothing
    // relevant changed, which was tearing down and re-creating the
    // entire call + chat connection on every poll — that's what caused
    // the repeated "Failed to join video call" toasts, the "Participant
    // not found" warnings, the duplicate-client warning, and candidates
    // getting disconnected mid-interview. We only actually need to
    // re-run this when the call itself changes or ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?._id, session?.callId, session?.status, loadingSession, isHost, isParticipant]);

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
  };
}

export default useStreamClient;