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


router.get(
  "/open",
  protectRoute,
  requireRole("candidate"),
  blockCandidatesInMaintenance,
  getOpenJobs
);


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


router.get("/:id", protectRoute, getJobById);

export default router;