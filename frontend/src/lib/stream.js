import { StreamVideoClient } from "@stream-io/video-react-sdk";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

let client = null;

export const initializeStreamClient = async (user, token) => {
  // if client exists with same user instead of creating again return it
  if (client && client?.user?.id === user.id) return client;

  if (client) {
    await disconnectStreamClient();
  }

  if (!apiKey) throw new Error("Stream API key is not provided.");

  // Prefer the SDK's own singleton helper when available — this is what
  // avoids the "A StreamVideoClient already exists for user X" warning,
  // which happens when a previous instance for the same user hasn't
  // fully torn down yet (e.g. during a fast reconnect).
  if (typeof StreamVideoClient.getOrCreateInstance === "function") {
    client = StreamVideoClient.getOrCreateInstance({
      apiKey,
      user,
      token,
    });
  } else {
    client = new StreamVideoClient({
      apiKey,
      user,
      token,
    });
  }

  return client;
};

export const disconnectStreamClient = async () => {
  if (client) {
    try {
      await client.disconnectUser();
      client = null;
    } catch (error) {
      console.error("Error disconnecting Stream client:", error);
    }
  }
};
