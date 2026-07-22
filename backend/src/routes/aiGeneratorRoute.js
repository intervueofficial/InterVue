import express from "express";
import { generateQuestions, clearCache, getStats } from "../controllers/aiGeneratorController.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

// Only admins and interviewers create problems/quizzes — a candidate has
// no reason to reach this endpoint. protectRoute also attaches req.user,
// which the controller uses as a stable per-user rate-limit key (the
// previous req.auth?.userId read was always undefined here, since
// @clerk/express's req.auth is a function, not a plain object — see
// protectRoute.js, which calls req.auth() — so every request was
// silently sharing one "anonymous" rate-limit bucket across all users).
router.use(protectRoute);
router.use(requireRole("admin", "interviewer"));

router.post("/generate", generateQuestions);
router.post("/cache/clear", clearCache);
router.get("/stats", getStats);

export default router;