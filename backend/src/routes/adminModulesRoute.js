import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getSubscriptions,
  getSubscriptionStats,
  cancelSubscription,
} from "../controllers/billingController.js";

import {
  getAllApplications,
  getPipelineStats,
} from "../controllers/pipelineController.js";

import { getAuditLog } from "../controllers/auditLogController.js";

import {
  getEmailTemplates,
  updateEmailTemplate,
} from "../controllers/emailTemplateController.js";

import { getSystemHealth } from "../controllers/systemHealthController.js";

import {
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/settingsController.js";

const router = express.Router();

// Same pattern as adminRoute.js — every endpoint here is admin-only.
// This is a second router (rather than growing adminRoute.js further)
// so the five new features stay grouped together; both are mounted at
// /api/admin in server.js.
router.use(protectRoute);
router.use(requireRole("admin"));

// ── Feature 1: Billing & Subscriptions ──────────────────────────
router.get("/subscriptions", getSubscriptions);
router.get("/subscriptions/stats", getSubscriptionStats);
router.patch("/subscriptions/:id/cancel", cancelSubscription);

// ── Feature 2: Cross-Job Applications Pipeline ──────────────────
router.get("/applications", getAllApplications);
router.get("/applications/stats", getPipelineStats);

// ── Feature 3: Audit Log ────────────────────────────────────────
router.get("/audit-log", getAuditLog);

// ── Feature 4: Email Templates ──────────────────────────────────
router.get("/email-templates", getEmailTemplates);
router.patch("/email-templates/:key", updateEmailTemplate);

// ── Feature 5: System Health + real Maintenance Mode ────────────
router.get("/system-health", getSystemHealth);
router.get("/settings", getPlatformSettings);
router.patch("/settings", updatePlatformSettings);

export default router;
