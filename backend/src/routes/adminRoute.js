import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getDashboardStats,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  getSessions,
} from "../controllers/adminController.js";

const router = express.Router();

// Protect all admin routes
router.use(protectRoute);
router.use(requireRole("admin"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// Users
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", toggleUserStatus);

// Sessions
router.get("/sessions", getSessions);

export default router;