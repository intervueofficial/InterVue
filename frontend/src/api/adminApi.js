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

  deleteUser: async (id, token) => {
  const { data } = await axiosInstance.delete(
    `/admin/users/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
},

deleteSession: async (id, token) => {
  const { data } = await axiosInstance.delete(
    `/admin/sessions/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
},

getProblems: async (token) => {
  const { data } = await axiosInstance.get(
    "/admin/problems",
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
    `/admin/problems/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
},

getAnalytics: async (token) => {
  const { data } = await axiosInstance.get(
    "/admin/analytics",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
},

  // ==========================
  // Billing & Subscriptions
  // ==========================
  getSubscriptions: async (token) => {
    const { data } = await axiosInstance.get("/admin/subscriptions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getSubscriptionStats: async (token) => {
    const { data } = await axiosInstance.get("/admin/subscriptions/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  cancelSubscription: async (id, token) => {
    const { data } = await axiosInstance.patch(
      `/admin/subscriptions/${id}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },

  // ==========================
  // Cross-Job Applications Pipeline
  // ==========================
  getAllApplications: async (token, { status, job } = {}) => {
    const params = {};
    if (status && status !== "all") params.status = status;
    if (job && job !== "all") params.job = job;

    const { data } = await axiosInstance.get("/admin/applications", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getPipelineStats: async (token) => {
    const { data } = await axiosInstance.get("/admin/applications/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // ==========================
  // Audit Log
  // ==========================
  getAuditLog: async (token, { page = 1, limit = 25 } = {}) => {
    const { data } = await axiosInstance.get("/admin/audit-log", {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // ==========================
  // Email Templates
  // ==========================
  getEmailTemplates: async (token) => {
    const { data } = await axiosInstance.get("/admin/email-templates", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateEmailTemplate: async (key, { subject, body }, token) => {
    const { data } = await axiosInstance.patch(
      `/admin/email-templates/${key}`,
      { subject, body },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },

  // ==========================
  // System Health
  // ==========================
  getSystemHealth: async (token) => {
    const { data } = await axiosInstance.get("/admin/system-health", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // ==========================
  // Interviewer Approval
  // ==========================
  getInterviewerRequests: async (token) => {
    const { data } = await axiosInstance.get("/admin/interviewer-requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  approveInterviewerRequest: async (userId, note, token) => {
    const { data } = await axiosInstance.patch(
      `/admin/interviewer-requests/${userId}/approve`,
      { note },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },

  rejectInterviewerRequest: async (userId, note, token) => {
    const { data } = await axiosInstance.patch(
      `/admin/interviewer-requests/${userId}/reject`,
      { note },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },

  // ==========================
  // Platform Settings (Maintenance Mode)
  // ==========================
  getPlatformSettings: async (token) => {
    const { data } = await axiosInstance.get("/admin/settings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updatePlatformSettings: async (payload, token) => {
    const { data } = await axiosInstance.patch("/admin/settings", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};