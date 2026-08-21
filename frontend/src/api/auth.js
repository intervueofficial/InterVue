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
// Identity Verification (DigiLocker) — see backend/IDENTITY_VERIFICATION_SETUP.md
// =======================================
export const identityApi = {
  async getStatus(token) {
    const { data } = await axios.get("/identity/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Returns { redirectUrl } — the caller should navigate the browser
  // there (window.location.href = redirectUrl) since DigiLocker needs a
  // full-page redirect, not an XHR.
  async startVerification(token) {
    const { data } = await axios.get("/identity/verify/start", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  // Mock consent flow (DIGILOCKER_MOCK_MODE=true on the server) — used
  // by frontend/src/pages/MockDigiLocker.jsx in place of a real
  // DigiLocker OAuth round-trip.
  async submitMockVerification({ name, dob, aadhaarNumber }, token) {
    const { data } = await axios.post(
      "/identity/verify/mock-submit",
      { name, dob, aadhaarNumber },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  },
};