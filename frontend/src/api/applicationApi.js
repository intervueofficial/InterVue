import axiosInstance from "../lib/axios";

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const applicationApi = {
  // Candidate
  applyToJob: async (jobId, token) => {
    const { data } = await axiosInstance.post(
      `/applications/${jobId}/apply`,
      {},
      authHeader(token)
    );
    return data;
  },

  getMyApplications: async (token) => {
    const { data } = await axiosInstance.get("/applications/my", authHeader(token));
    return data;
  },

  // Interviewer / Admin
  getApplicantsForJob: async (jobId, token) => {
    const { data } = await axiosInstance.get(
      `/applications/job/${jobId}`,
      authHeader(token)
    );
    return data;
  },

  selectApplicant: async (applicationId, scheduledAt, token) => {
    const { data } = await axiosInstance.patch(
      `/applications/${applicationId}/select`,
      scheduledAt ? { scheduledAt } : {},
      authHeader(token)
    );
    return data;
  },

  rejectApplicant: async (applicationId, token) => {
    const { data } = await axiosInstance.patch(
      `/applications/${applicationId}/reject`,
      {},
      authHeader(token)
    );
    return data;
  },

  refreshFitScore: async (applicationId, token) => {
    const { data } = await axiosInstance.post(
      `/applications/${applicationId}/refresh-fit-score`,
      {},
      authHeader(token)
    );
    return data;
  },

  // Post-interview decision flow
  getApplicationBySession: async (sessionId, token) => {
    const { data } = await axiosInstance.get(
      `/applications/by-session/${sessionId}`,
      authHeader(token)
    );
    return data;
  },

  submitDecision: async (applicationId, decision, feedback, token) => {
    const { data } = await axiosInstance.patch(
      `/applications/${applicationId}/decision`,
      { decision, feedback },
      authHeader(token)
    );
    return data;
  },

  getWaitlist: async (token) => {
    const { data } = await axiosInstance.get("/applications/waitlist", authHeader(token));
    return data;
  },
};
