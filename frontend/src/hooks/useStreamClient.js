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
  }, [session, loadingSession, isHost, isParticipant, getToken]); // ✅ include getToken

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
  };
}

export default useStreamClient;