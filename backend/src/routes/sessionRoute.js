import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { streamClient } from "../lib/stream.js";
import {
  createSession,
  endSession,
  getActiveSessions,
  getMyRecentSessions,
  getSessionById,
  joinSession,
} from "../controllers/sessionController.js";

import SessionViolation from "../models/SessionViolation.js";

const router = express.Router();

router.post("/", protectRoute, createSession);

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