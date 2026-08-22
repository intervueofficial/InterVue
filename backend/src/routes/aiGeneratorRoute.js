import express from "express";
import { generateQuestions, clearCache, getStats, getCandidateContext } from "../controllers/aiGeneratorController.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();








router.use(protectRoute);
router.use(requireRole("admin", "interviewer"));

router.post("/generate", generateQuestions);
router.post("/cache/clear", clearCache);
router.get("/stats", getStats);
router.get("/candidate-context/:candidateId", getCandidateContext);

export default router;