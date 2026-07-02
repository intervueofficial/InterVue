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
| Admin Only Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protectRoute,
  requireRole("admin"),
  createProblem
);

router.put(
  "/:id",
  protectRoute,
  requireRole("admin"),
  updateProblem
);

router.delete(
  "/:id",
  protectRoute,
  requireRole("admin"),
  deleteProblem
);

export default router;