import axiosInstance from "../lib/axios";

export const adminApi = {
  // ==========================
  // Dashboard Stats
  // ==========================
  getDashboardStats: async (token) => {
    const { data } = await axiosInstance.get("/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  },

  // ==========================
  // Users
  // ==========================
  getUsers: async (token) => {
    const { data } = await axiosInstance.get("/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  },

  updateUserRole: async (id, role, token) => {
    const { data } = await axiosInstance.patch(
      `/admin/users/${id}/role`,
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },

  toggleUserStatus: async (id, token) => {
    const { data } = await axiosInstance.patch(
      `/admin/users/${id}/status`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },

  // ==========================
  // Sessions
  // ==========================
  getSessions: async (token) => {
    const { data } = await axiosInstance.get("/admin/sessions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  },
};