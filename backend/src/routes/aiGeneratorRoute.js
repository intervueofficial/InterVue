import express from "express";
import { generateQuestions, clearCache, getStats } from "../controllers/aiGeneratorController.js";
import { requireAuth } from "@clerk/express";

const router = express.Router();

router.post("/generate", requireAuth(), generateQuestions);
router.post("/cache/clear", requireAuth(), clearCache);
router.get("/stats", requireAuth(), getStats);

export default router;
