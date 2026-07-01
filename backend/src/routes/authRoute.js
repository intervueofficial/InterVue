import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getMe } from "../controllers/authController.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);

export default router;