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





router.use(protectRoute);
router.use(requireRole("admin"));


router.get("/subscriptions", getSubscriptions);
router.get("/subscriptions/stats", getSubscriptionStats);
router.patch("/subscriptions/:id/cancel", cancelSubscription);


router.get("/applications", getAllApplications);
router.get("/applications/stats", getPipelineStats);


router.get("/audit-log", getAuditLog);


router.get("/email-templates", getEmailTemplates);
router.patch("/email-templates/:key", updateEmailTemplate);


router.get("/system-health", getSystemHealth);
router.get("/settings", getPlatformSettings);
router.patch("/settings", updatePlatformSettings);

export default router;
