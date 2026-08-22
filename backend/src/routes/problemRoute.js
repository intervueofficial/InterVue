import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  gradeProblem,
} from "../controllers/problemController.js";

const router = express.Router();




router.get("/", getProblems);


router.get("/:id", getProblemById);


router.post("/:id/grade", protectRoute, gradeProblem);



router.post(
  "/",
  protectRoute,
  requireRole("admin", "interviewer"),
  createProblem
);

router.put(
  "/:id",
  protectRoute,
  requireRole("admin", "interviewer"),
  updateProblem
);

router.delete(
  "/:id",
  protectRoute,
  requireRole("admin", "interviewer"),
  deleteProblem
);

export default router;