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

  selectApplicant: async (applicationId, token) => {
    const { data } = await axiosInstance.patch(
      `/applications/${applicationId}/select`,
      {},
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
};
