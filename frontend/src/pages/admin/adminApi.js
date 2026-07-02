import axiosInstance from "../lib/axios";

export const adminApi = {
  // Dashboard statistics
  getDashboardStats: async (token) => {
    const response = await axiosInstance.get("/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  // Users
  getUsers: async (token) => {
    const response = await axiosInstance.get("/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  deleteUser: async (id, token) => {
    const response = await axiosInstance.delete(`/admin/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  // Sessions
  getSessions: async (token) => {
    const response = await axiosInstance.get("/admin/sessions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  deleteSession: async (id, token) => {
    const response = await axiosInstance.delete(`/admin/sessions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  // Problems
  getProblems: async (token) => {
    const response = await axiosInstance.get("/admin/problems", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  deleteProblem: async (id, token) => {
    const response = await axiosInstance.delete(`/admin/problems/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  // Analytics
  getAnalytics: async (token) => {
    const response = await axiosInstance.get("/admin/analytics", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};