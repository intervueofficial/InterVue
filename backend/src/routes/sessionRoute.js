import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  createSession,
  deleteSession,
  endSession,
  getActiveSessions,
  getMyRecentSessions,
  getSessionById,
  joinSession,
  pushProblem,
  pushQuiz,
  clearActiveContent,
  submitQuizResult,
  submitCodeResult,
  downloadPerformanceReport,
  getWhiteboard,
  saveWhiteboard,
} from "../controllers/sessionController.js";

import SessionViolation from "../models/SessionViolation.js";

const router = express.Router();

router.post(
  "/",
  protectRoute,
  requireRole("admin"),
  createSession
);

router.delete(
  "/:id",
  protectRoute,
  requireRole("admin"),
  deleteSession
);

router.get(
  "/active",
  protectRoute,
  getActiveSessions
);

router.get(
  "/my-recent",
  protectRoute,
  getMyRecentSessions
);

router.get(
  "/:id",
  protectRoute,
  getSessionById
);

router.post(
  "/:id/join",
  protectRoute,
  joinSession
);

router.post(
  "/:id/end",
  protectRoute,
  endSession
);

router.patch(
  "/:id/push-problem",
  protectRoute,
  requireRole("interviewer"),
  pushProblem
);

router.patch(
  "/:id/push-quiz",
  protectRoute,
  requireRole("interviewer"),
  pushQuiz
);

router.patch(
  "/:id/clear-content",
  protectRoute,
  requireRole("interviewer"),
  clearActiveContent
);

router.patch(
  "/:id/quiz-result",
  protectRoute,
  requireRole("candidate"),
  submitQuizResult
);

router.patch(
  "/:id/code-result",
  protectRoute,
  requireRole("candidate"),
  submitCodeResult
);

router.get(
  "/:id/report",
  protectRoute,
  downloadPerformanceReport
);

router.get(
  "/:id/whiteboard",
  protectRoute,
  requireRole("admin", "interviewer", "candidate"),
  getWhiteboard
);

router.patch(
  "/:id/whiteboard",
  protectRoute,
  requireRole("interviewer", "candidate"),
  saveWhiteboard
);

router.post(
  "/terminate",
  async (req, res) => {
    try {
      const {
        candidateId,
        sessionId,
        reason,
      } = req.body;

      if (!candidateId || !reason) {
        return res.status(400).json({
          success: false,
          message:
            "Candidate ID and reason are required",
        });
      }

      const violation =
        await SessionViolation.create({
          candidateId,
          sessionId,
          reason,
          timestamp: new Date(),
        });

      return res.status(201).json({
        success: true,
        message: "Violation recorded",
        violation,
      });
    } catch (error) {
      console.error(
        "Terminate session error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

export default router;