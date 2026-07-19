import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  selectApplicant,
  rejectApplicant,
} from "../controllers/applicationController.js";

const router = express.Router();

// Candidate
router.post(
  "/:jobId/apply",
  protectRoute,
  requireRole("candidate"),
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

export default router;
