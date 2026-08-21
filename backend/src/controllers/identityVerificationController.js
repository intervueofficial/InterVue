import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import {
  isDigiLockerConfigured,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchAadhaarRecord,
  computeAadhaarHash,
  signState,
  verifyState,
} from "../lib/digilocker.js";

/**
 * Shared by both the real DigiLocker callback and the mock-submit
 * endpoint: given a verified identity record, either link it to `user`
 * or reject it as a duplicate of an already-verified account. This is
 * where the actual "one Aadhaar = one account" guarantee lives — the
 * `findOne` check plus the model's unique index on `aadhaarHash`
 * together stop the same identity from ever verifying twice, whether
 * that identity comes in via real DigiLocker or the mock form.
 */
async function finalizeVerification(user, record, provider) {
  if (!record?.last4 || !record?.dob) {
    return { ok: false, status: "failed", reason: "incomplete_record" };
  }

  const aadhaarHash = computeAadhaarHash(record);

  const existing = await User.findOne({
    "identityVerification.aadhaarHash": aadhaarHash,
    _id: { $ne: user._id },
  });

  if (existing) {
    return {
      ok: false,
      status: "duplicate",
      reason: "This identity is already linked to another InterVue account.",
    };
  }

  user.identityVerification = {
    provider,
    verified: true,
    aadhaarHash,
    verifiedName: record.name || "",
    maskedAadhaar: record.last4 ? `XXXXXXXX${record.last4}` : "",
    verifiedAt: new Date(),
  };

  try {
    await user.save();
  } catch (saveError) {
    // Safety net for a race between two concurrent verification
    // attempts landing on the same hash — the unique index catches
    // what the findOne check above might miss under concurrency.
    if (saveError?.code === 11000) {
      return {
        ok: false,
        status: "duplicate",
        reason: "This identity is already linked to another InterVue account.",
      };
    }
    throw saveError;
  }

  return { ok: true, status: "verified" };
}

// =======================================
// GET /api/identity/status
// =======================================
export async function getVerificationStatus(req, res) {
  return res.status(200).json({
    success: true,
    configured: isDigiLockerConfigured(),
    mockMode: ENV.DIGILOCKER_MOCK_MODE,
    required: ENV.REQUIRE_IDENTITY_VERIFICATION,
    verification: req.user.identityVerification || { verified: false },
  });
}

// =======================================
// GET /api/identity/verify/start
// Returns a redirect URL for the frontend to send the browser to — real
// DigiLocker's authorize screen, or (in mock mode) our own same-origin
// mock consent page.
// =======================================
export async function startVerification(req, res) {
  try {
    if (!isDigiLockerConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "Identity verification isn't configured yet. See backend/IDENTITY_VERIFICATION_SETUP.md.",
      });
    }

    if (req.user.identityVerification?.verified) {
      return res.status(200).json({ success: true, alreadyVerified: true });
    }

    const state = signState(req.user.clerkId);
    return res.status(200).json({ success: true, redirectUrl: buildAuthorizeUrl(state) });
  } catch (error) {
    console.error("startVerification:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// =======================================
// GET /api/identity/verify/callback
// Public route — real DigiLocker redirects the user's browser here
// directly (no Authorization header), so the user is identified via the
// signed `state` param instead of protectRoute. Always ends in a
// redirect back to the candidate's Profile page with a ?identity=...
// query param the frontend reads to show a toast. Not used in mock mode
// (see submitMockVerification below instead).
// =======================================
export async function handleCallback(req, res) {
  const frontendBase = (ENV.CLIENT_URL || "").replace(/\/$/, "");

  const redirectWithStatus = (status, reason) => {
    const params = new URLSearchParams({ identity: status });
    if (reason) params.set("reason", reason);
    return res.redirect(`${frontendBase}/candidate/profile?${params.toString()}`);
  };

  try {
    if (ENV.DIGILOCKER_MOCK_MODE) {
      return redirectWithStatus("failed", "mock_mode_active");
    }

    const { code, state, error } = req.query;

    if (error) return redirectWithStatus("failed", String(error));
    if (!code || !state) return redirectWithStatus("failed", "missing_code");

    const clerkId = verifyState(String(state));
    if (!clerkId) return redirectWithStatus("failed", "invalid_or_expired_state");

    const user = await User.findOne({ clerkId });
    if (!user) return redirectWithStatus("failed", "user_not_found");

    if (user.identityVerification?.verified) {
      return redirectWithStatus("already_verified");
    }

    const tokenData = await exchangeCodeForToken(String(code));
    const record = await fetchAadhaarRecord(tokenData.access_token);

    const result = await finalizeVerification(user, record, "digilocker");
    return redirectWithStatus(result.status, result.ok ? undefined : result.reason);
  } catch (error) {
    console.error("DigiLocker callback error:", error.message);
    return redirectWithStatus("failed", "server_error");
  }
}

// =======================================
// POST /api/identity/verify/mock-submit
// Only active when DIGILOCKER_MOCK_MODE=true. Called by the frontend's
// mock consent page (frontend/src/pages/MockDigiLocker.jsx) — an
// authenticated request (not a third-party redirect), so it uses
// protectRoute like a normal API call rather than the signed-state
// trick the real callback needs.
//
// This exists for group/college projects that don't have a registered
// organization to get real DigiLocker partner credentials — it runs
// the exact same duplicate-account logic (finalizeVerification above)
// against fake, user-entered identity data instead of a real DigiLocker
// round-trip, so the core feature (block duplicate accounts by hashed
// identity) is fully real and demoable without government approval.
// =======================================
export async function submitMockVerification(req, res) {
  try {
    if (!ENV.DIGILOCKER_MOCK_MODE) {
      return res.status(404).json({
        success: false,
        message: "Mock verification is not enabled on this server.",
      });
    }

    if (req.user.identityVerification?.verified) {
      return res.status(200).json({ success: true, status: "already_verified" });
    }

    const { name, dob, aadhaarNumber } = req.body || {};

    if (!name || !name.trim() || !dob) {
      return res.status(400).json({ success: false, message: "Name and date of birth are required." });
    }

    const digitsOnly = String(aadhaarNumber || "").replace(/\D/g, "");
    if (digitsOnly.length !== 12) {
      return res.status(400).json({
        success: false,
        message: "Enter a 12-digit Aadhaar number (this is mock data — any 12 digits work).",
      });
    }

    const record = { name: name.trim(), dob, last4: digitsOnly.slice(-4) };
    const result = await finalizeVerification(req.user, record, "digilocker-mock");

    if (!result.ok) {
      return res.status(409).json({ success: false, status: result.status, message: result.reason });
    }

    return res.status(200).json({ success: true, status: "verified" });
  } catch (error) {
    console.error("submitMockVerification:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
