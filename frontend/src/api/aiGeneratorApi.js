import axiosInstance from "../lib/axios";

export const aiGeneratorApi = {
  generate: async (payload, token) => {
    const { data } = await axiosInstance.post("/ai/generate", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  getCandidateContext: async (candidateId, jobId, token) => {
    const { data } = await axiosInstance.get(
      `/ai/candidate-context/${candidateId}`,
      {
        params: jobId ? { jobId } : undefined,
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  },
};
