import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";
import { blockCandidatesInMaintenance } from "../middleware/maintenanceMode.js";

import {
  createJob,
  getAllJobs,
  getOpenJobs,
  getJobById,
  updateJob,
  deleteJob,
  uploadJobSampleResume,
} from "../controllers/jobController.js";

const router = express.Router();

// Candidate-facing: open jobs only
router.get(
  "/open",
  protectRoute,
  requireRole("candidate"),
  blockCandidatesInMaintenance,
  getOpenJobs
);

// Admin CRUD (interviewer also needs read access for the Applicants dropdown)
router.post("/", protectRoute, requireRole("admin"), createJob);
router.get("/", protectRoute, requireRole("admin", "interviewer"), getAllJobs);
router.patch("/:id", protectRoute, requireRole("admin"), updateJob);
router.post(
  "/:id/sample-resume",
  protectRoute,
  requireRole("admin"),
  uploadJobSampleResume
);
router.delete("/:id", protectRoute, requireRole("admin"), deleteJob);

// Shared: view a single job (admin, interviewer, candidate)
router.get("/:id", protectRoute, getJobById);

export default router;