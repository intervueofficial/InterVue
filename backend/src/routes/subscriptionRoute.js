import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  getMySubscription,
  upgradeMyPlan,
  cancelMySubscription,
} from "../controllers/subscriptionController.js";

const router = express.Router();





router.use(protectRoute);
router.use(requireRole("candidate"));

router.get("/me", getMySubscription);
router.post("/upgrade", upgradeMyPlan);
router.post("/cancel", cancelMySubscription);

export default router;
