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

// =======================================
// Identity Verification (live-camera Aadhaar OCR scan)
// =======================================
export const identityApi = {
  async getStatus(token) {
    const { data } = await axios.get("/identity/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Sends one captured camera frame (data URL) for server-side OCR.
  // Doesn't save anything — returns extracted fields for the candidate
  // to review/correct before confirmVerification.
  async scanAadhaar(imageDataUrl, token) {
    const { data } = await axios.post(
      "/identity/verify/scan",
      { image: imageDataUrl },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },

  // Saves the (candidate-confirmed) verification.
  async confirmVerification({ name, dob, aadhaarNumber }, token) {
    const { data } = await axios.post(
      "/identity/verify/confirm",
      { name, dob, aadhaarNumber },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },
};