import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
} from "../controllers/problemController.js";

const router = express.Router();



// Get all problems
router.get("/", getProblems);

// Get single problem
router.get("/:id", getProblemById);

/*
|--------------------------------------------------------------------------
| Admin + Interviewer Routes
| (interviewer can only edit/delete problems they created — enforced
|  via ownership check in the controller)
|--------------------------------------------------------------------------
*/

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