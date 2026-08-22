import axiosInstance from "../lib/axios";

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const jobApi = {
  // Admin
  createJob: async (job, token) => {
    const { data } = await axiosInstance.post("/jobs", job, authHeader(token));
    return data;
  },

  getAllJobs: async (token) => {
    const { data } = await axiosInstance.get("/jobs", authHeader(token));
    return data;
  },

  updateJob: async (id, job, token) => {
    const { data } = await axiosInstance.patch(`/jobs/${id}`, job, authHeader(token));
    return data;
  },

  uploadSampleResume: async (id, { resume, fileName }, token) => {
    const { data } = await axiosInstance.post(
      `/jobs/${id}/sample-resume`,
      { resume, fileName },
      authHeader(token)
    );
    return data;
  },

  deleteJob: async (id, token) => {
    const { data } = await axiosInstance.delete(`/jobs/${id}`, authHeader(token));
    return data;
  },

  // Candidate
  getOpenJobs: async (token) => {
    const { data } = await axiosInstance.get("/jobs/open", authHeader(token));
    return data;
  },

  getJobById: async (id, token) => {
    const { data } = await axiosInstance.get(`/jobs/${id}`, authHeader(token));
    return data;
  },
};
