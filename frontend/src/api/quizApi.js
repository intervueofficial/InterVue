import axiosInstance from "../lib/axios";

export const quizApi = {
  getQuizzes: async () => {
    const response = await axiosInstance.get("/quizzes");
    return response.data;
  },

  getQuizById: async (id) => {
    const response = await axiosInstance.get(`/quizzes/${id}`);
    return response.data;
  },

  createQuiz: async (data, token) => {
    const response = await axiosInstance.post(
      "/quizzes",
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

  updateQuiz: async (id, data, token) => {
    const response = await axiosInstance.put(
      `/quizzes/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

  deleteQuiz: async (id, token) => {
    const response = await axiosInstance.delete(
      `/quizzes/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },
};