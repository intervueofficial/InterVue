import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from "../controllers/quizController.js";

const router = express.Router();

// Public
router.get("/", getQuizzes);
router.get("/:id", getQuizById);

// Admin + Interviewer (interviewer can only edit/delete their own — enforced in controller)
router.post(
  "/",
  protectRoute,
  requireRole("admin", "interviewer"),
  createQuiz
);

router.put(
  "/:id",
  protectRoute,
  requireRole("admin", "interviewer"),
  updateQuiz
);

router.delete(
  "/:id",
  protectRoute,
  requireRole("admin", "interviewer"),
  deleteQuiz
);

export default router;