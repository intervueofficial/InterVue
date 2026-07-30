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

  // NOTE: field name ("resume") and response shape are assumed to mirror
  // uploadProfileImage's ({ image }) pattern, since the uploadResume
  // controller wasn't available. If the backend expects a different key
  // or returns the URL under a different path, update the body key below
  // and the `url` extraction in Profile.jsx's resume mutation to match.
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