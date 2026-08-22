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


router.get("/", getQuizzes);
router.get("/:id", getQuizById);


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