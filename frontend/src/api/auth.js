import axios from "../lib/axios";

export const authApi = {
  async selectRole(role, token) {
    const { data } = await axios.post(
      "/auth/select-role",
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },

  async updateProfile(profile, token) {
    const { data } = await axios.patch(
      "/auth/profile",
      profile,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },

  async uploadProfileImage(imageDataUrl, token) {
    const { data } = await axios.post(
      "/auth/profile-image",
      { image: imageDataUrl },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },

  // Uploads a resume (PDF/DOC/DOCX) to Cloudinary via the backend and
  // returns the updated user, with the new URL at
  // user.candidateProfile.resumeUrl (and echoed at data.resumeUrl too).
  async uploadResume(resumeDataUrl, token) {
    const { data } = await axios.post(
      "/auth/profile-resume",
      { resume: resumeDataUrl },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;
  },
};