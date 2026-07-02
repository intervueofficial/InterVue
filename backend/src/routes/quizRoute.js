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

// Admin only
router.post(
  "/",
  protectRoute,
  requireRole("admin"),
  createQuiz
);

router.put(
  "/:id",
  protectRoute,
  requireRole("admin"),
  updateQuiz
);

router.delete(
  "/:id",
  protectRoute,
  requireRole("admin"),
  deleteQuiz
);

export default router;