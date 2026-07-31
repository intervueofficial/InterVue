import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";

import {
  getMe,
  selectRole,
  updateCandidateProfile,
  uploadProfileImage,
  uploadProfileResume,
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

router.post(
  "/profile-image",
  protectRoute,
  uploadProfileImage
);

router.post(
  "/profile-resume",
  protectRoute,
  uploadProfileResume
);

export default router;