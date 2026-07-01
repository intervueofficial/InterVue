import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";

import {
  getMe,
  selectRole,
} from "../controllers/authController.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);

router.post(
  "/select-role",
  protectRoute,
  selectRole
);

export default router;