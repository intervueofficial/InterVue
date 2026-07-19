import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";

import {
  getMe,
  selectRole,
  updateCandidateProfile,
} from "../controllers/authController.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);

router.post(
  "/select-role",
  protectRoute,
  selectRole
);

router.patch(
  "/profile",
  protectRoute,
  updateCandidateProfile
);

export default router;