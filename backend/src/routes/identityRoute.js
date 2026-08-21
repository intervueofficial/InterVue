import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  getVerificationStatus,
  startVerification,
  handleCallback,
  submitMockVerification,
} from "../controllers/identityVerificationController.js";

const router = express.Router();

router.get("/status", protectRoute, getVerificationStatus);
router.get("/verify/start", protectRoute, startVerification);

// Public: DigiLocker redirects the user's raw browser here, with no
// Authorization header — see verifyState() in lib/digilocker.js for how
// this is still tied back to the right account.
router.get("/verify/callback", handleCallback);

// Authenticated: submitted directly by our own mock consent page
// (DIGILOCKER_MOCK_MODE=true only) — see IDENTITY_VERIFICATION_SETUP.md.
router.post("/verify/mock-submit", protectRoute, submitMockVerification);

export default router;
