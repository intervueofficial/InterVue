import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  getVerificationStatus,
  scanAadhaar,
  confirmVerification,
} from "../controllers/identityVerificationController.js";

const router = express.Router();

router.get("/status", protectRoute, getVerificationStatus);

// Runs OCR on a captured Aadhaar photo, returns extracted fields for
// the candidate to review — does not save anything yet.
router.post("/verify/scan", protectRoute, scanAadhaar);

// Saves the (candidate-reviewed/corrected) verification.
router.post("/verify/confirm", protectRoute, confirmVerification);

export default router;
