import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sessionApi } from "../api/sessions";
import { useAuth } from "@clerk/clerk-react";

export const useCreateSession = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      return sessionApi.createSession(data, token);
    },

    onSuccess: () => {
      toast.success("Session created");

      queryClient.invalidateQueries({
        queryKey: ["activeSessions"],
      });
    },

    onError: (error) =>
      toast.error(
        error.response?.data?.message ||
          "Failed to create session"
      ),
  });
};

export const useDeleteSession = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      return sessionApi.deleteSession(id, token);
    },

    onSuccess: () => {
      toast.success("Session deleted");

      queryClient.invalidateQueries({
        queryKey: ["activeSessions"],
      });
    },

    onError: (error) =>
      toast.error(
        error.response?.data?.message ||
          "Failed to delete session"
      ),
  });
};

export const useActiveSessions = () => {
  const { getToken } = useAuth();

  const result = useQuery({
    queryKey: ["activeSessions"],
    queryFn: async () => {
      const token = await getToken();

      const response = await sessionApi.getActiveSessions(token);
      return response;
    },
  });

  return result;
};

export const useMyRecentSessions = () => {
  const { getToken } = useAuth();

  const result = useQuery({
    queryKey: ["myRecentSessions"],
    queryFn: async () => {
      const token = await getToken();
      return sessionApi.getMyRecentSessions(token);
    },
  });

  return result;
};

export const useSessionById = (id) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const token = await getToken();
      return sessionApi.getSessionById(id, token);
    },
    enabled: !!id,
    refetchInterval: 5000,
  });
};

export const useJoinSession = () => {
  const { getToken } = useAuth();
const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["joinSession"],
    mutationFn: async (id) => {
      const token = await getToken();
      return sessionApi.joinSession(id, token);
    },
    onSuccess: () => {
  toast.success("Joined session successfully!");

  queryClient.invalidateQueries({
    queryKey: ["activeSessions"],
  });
},
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to join session"),
  });
};

export const useEndSession = () => {
  const { getToken } = useAuth();

  return useMutation({
    mutationKey: ["endSession"],
    mutationFn: async (id) => {
      const token = await getToken();
      return sessionApi.endSession(id, token);
    },
    onSuccess: () => toast.success("Session ended successfully"),
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to end session"),
  });
};

export const usePushProblem = (sessionId) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["pushProblem", sessionId],
    mutationFn: async (problemId) => {
      const token = await getToken();
      return sessionApi.pushProblem(sessionId, problemId, token);
    },
    onSuccess: (data) => {
      toast.success(
        `"${data?.session?.activeProblem?.title || "Problem"}" sent to candidate`
      );
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to push problem"),
  });
};

export const usePushQuiz = (sessionId) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["pushQuiz", sessionId],
    mutationFn: async (quizId) => {
      const token = await getToken();
      return sessionApi.pushQuiz(sessionId, quizId, token);
    },
    onSuccess: (data) => {
      toast.success(
        `"${data?.session?.activeQuiz?.title || "Quiz"}" sent to candidate`
      );
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to push quiz"),
  });
};

export const useClearActiveContent = (sessionId) => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["clearActiveContent", sessionId],
    mutationFn: async () => {
      const token = await getToken();
      return sessionApi.clearActiveContent(sessionId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to clear content"),
  });
};

export const useSubmitQuizResult = (sessionId) => {
  const { getToken } = useAuth();

  return useMutation({
    mutationKey: ["submitQuizResult", sessionId],
    mutationFn: async ({ score, total }) => {
      const token = await getToken();
      return sessionApi.submitQuizResult(sessionId, { score, total }, token);
    },
    onError: (error) =>
      console.log(
        "Failed to save quiz result:",
        error.response?.data?.message || error.message
      ),
  });
};

export const useSubmitCodeResult = (sessionId) => {
  const { getToken } = useAuth();

  return useMutation({
    mutationKey: ["submitCodeResult", sessionId],
    mutationFn: async ({ code, language }) => {
      const token = await getToken();
      return sessionApi.submitCodeResult(sessionId, { code, language }, token);
    },
    onError: (error) =>
      console.log(
        "Failed to save code result:",
        error.response?.data?.message || error.message
      ),
  });
};

// Loads the saved whiteboard once when the panel opens. Not part of the
// polling useSessionById query on purpose — board data can get large
// and doesn't need to be re-fetched every 5s along with the session.
export const useWhiteboardData = (sessionId) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["whiteboard", sessionId],
    queryFn: async () => {
      const token = await getToken();
      const res = await sessionApi.getWhiteboard(sessionId, token);
      return res.whiteboard;
    },
    enabled: !!sessionId,
    staleTime: Infinity, // it's a live-edited document; the socket sync keeps it fresh, not refetching
    refetchOnWindowFocus: false,
  });
};

// Silent, best-effort — used by the whiteboard's auto-save timer, the
// manual Save button, and Clear. Errors surface via toast in the
// component itself so callers can tailor the message per-action.
export const useSaveWhiteboard = (sessionId) => {
  const { getToken } = useAuth();

  return useMutation({
    mutationKey: ["saveWhiteboard", sessionId],
    mutationFn: async ({ elements, appState, version }) => {
      const token = await getToken();
      return sessionApi.saveWhiteboard(sessionId, { elements, appState, version }, token);
    },
  });
};