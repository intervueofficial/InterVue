import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";
import { blockCandidatesInMaintenance } from "../middleware/maintenanceMode.js";

import {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  selectApplicant,
  rejectApplicant,
  getApplicationBySession,
  submitDecision,
  getWaitlist,
  refreshFitScore,
} from "../controllers/applicationController.js";

const router = express.Router();

// Candidate
router.post(
  "/:jobId/apply",
  protectRoute,
  requireRole("candidate"),
  blockCandidatesInMaintenance,
  applyToJob
);

router.get(
  "/my",
  protectRoute,
  requireRole("candidate"),
  getMyApplications
);

// Interviewer / Admin
router.get(
  "/job/:jobId",
  protectRoute,
  requireRole("interviewer", "admin"),
  getApplicantsForJob
);

router.patch(
  "/:id/select",
  protectRoute,
  requireRole("interviewer", "admin"),
  selectApplicant
);

router.patch(
  "/:id/reject",
  protectRoute,
  requireRole("interviewer", "admin"),
  rejectApplicant
);

router.post(
  "/:id/refresh-fit-score",
  protectRoute,
  requireRole("interviewer", "admin"),
  refreshFitScore
);

// Post-interview decision flow
router.get(
  "/by-session/:sessionId",
  protectRoute,
  requireRole("interviewer", "admin"),
  getApplicationBySession
);

router.patch(
  "/:id/decision",
  protectRoute,
  requireRole("interviewer", "admin"),
  submitDecision
);

router.get(
  "/waitlist",
  protectRoute,
  requireRole("interviewer", "admin"),
  getWaitlist
);

export default router;
