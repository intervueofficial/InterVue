import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  getMySubscription,
  upgradeMyPlan,
  cancelMySubscription,
} from "../controllers/subscriptionController.js";

const router = express.Router();

// Self-service only — a candidate can read and change their own
// subscription, nothing else. Admin-side visibility (list all, cancel
// any, stats) lives separately in adminModulesRoute.js /
// billingController.js.
router.use(protectRoute);
router.use(requireRole("candidate"));

router.get("/me", getMySubscription);
router.post("/upgrade", upgradeMyPlan);
router.post("/cancel", cancelMySubscription);

export default router;
