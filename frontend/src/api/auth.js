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
};