import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getDashboardStats,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  getSessions,
  getAnalytics,
  getInterviewerRequests,
  approveInterviewerRequest,
  rejectInterviewerRequest,
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

// Interviewer Approval
router.get("/interviewer-requests", getInterviewerRequests);
router.patch("/interviewer-requests/:userId/approve", approveInterviewerRequest);
router.patch("/interviewer-requests/:userId/reject", rejectInterviewerRequest);

// Sessions
router.get("/sessions", getSessions);

// Analytics
router.get("/analytics", getAnalytics);

export default router;