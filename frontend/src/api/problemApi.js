import axiosInstance from "../lib/axios";

export const problemApi = {
  getProblems: async () => {
    const { data } = await axiosInstance.get("/problems");
    return data;
  },

  getProblem: async (id) => {
    const { data } = await axiosInstance.get(`/problems/${id}`);
    return data;
  },

  createProblem: async (problem, token) => {
    const { data } = await axiosInstance.post(
      "/problems",
      problem,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },

  updateProblem: async (id, problem, token) => {
    const { data } = await axiosInstance.put(
      `/problems/${id}`,
      problem,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },

  deleteProblem: async (id, token) => {
    const { data } = await axiosInstance.delete(
      `/problems/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },
};