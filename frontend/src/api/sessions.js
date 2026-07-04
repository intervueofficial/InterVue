import axiosInstance from "../lib/axios";

export const sessionApi = {
  createSession: async (data, token) => {
    const response = await axiosInstance.post("/sessions", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  getActiveSessions: async (token) => {
    const response = await axiosInstance.get("/sessions/active", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  getMyRecentSessions: async (token) => {
    const response = await axiosInstance.get("/sessions/my-recent", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  getSessionById: async (id, token) => {
    const response = await axiosInstance.get(`/sessions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  joinSession: async (id, token) => {
    const response = await axiosInstance.post(
      `/sessions/${id}/join`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  endSession: async (id, token) => {
    const response = await axiosInstance.post(
      `/sessions/${id}/end`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  getStreamToken: async (token) => {
    const response = await axiosInstance.get(`/chat/token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  deleteSession: async (id, token) => {
  const response = await axiosInstance.delete(`/sessions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
},

  pushProblem: async (id, problemId, token) => {
    const response = await axiosInstance.patch(
      `/sessions/${id}/push-problem`,
      { problemId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  pushQuiz: async (id, quizId, token) => {
    const response = await axiosInstance.patch(
      `/sessions/${id}/push-quiz`,
      { quizId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  clearActiveContent: async (id, token) => {
    const response = await axiosInstance.patch(
      `/sessions/${id}/clear-content`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  submitQuizResult: async (id, { score, total }, token) => {
    const response = await axiosInstance.patch(
      `/sessions/${id}/quiz-result`,
      { score, total },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};