import Subscription from "../models/Subscription.js";
import { logAction } from "../lib/auditLog.js";

const PLAN_RANK = { free: 0, pro: 1, premium: 2 };
const VALID_PLANS = ["free", "pro", "premium"];

const PLAN_PERIOD_DAYS = 30;

function toPublicShape(subscription) {
  if (!subscription) {
    return { plan: "free", status: "active", currentPeriodEnd: null, cancelledAt: null };
  }
  const isCurrent = ["active", "trialing"].includes(subscription.status);
  return {
    plan: isCurrent ? subscription.plan : "free",
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelledAt: subscription.cancelledAt,
    
    
    raw: {
      plan: subscription.plan,
      status: subscription.status,
    },
  };
}






export const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ candidate: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      subscription: toPublicShape(subscription),
    });
  } catch (error) {
    console.error("getMySubscription:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};











export const upgradeMyPlan = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!VALID_PLANS.includes(plan) || plan === "free") {
      return res.status(400).json({
        success: false,
        message: "plan must be 'pro' or 'premium'.",
      });
    }

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + PLAN_PERIOD_DAYS);

    let subscription = await Subscription.findOne({ candidate: req.user._id }).sort({
      createdAt: -1,
    });

    if (subscription) {
      subscription.plan = plan;
      subscription.status = "active";
      subscription.currentPeriodEnd = periodEnd;
      subscription.cancelledAt = null;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        candidate: req.user._id,
        plan,
        status: "active",
        startedAt: new Date(),
        currentPeriodEnd: periodEnd,
      });
    }

    await logAction({
      actor: req.user,
      action: "subscription.upgraded",
      targetType: "Subscription",
      targetId: subscription._id,
      metadata: { plan },
    });

    return res.status(200).json({
      success: true,
      subscription: toPublicShape(subscription),
    });
  } catch (error) {
    console.error("upgradeMyPlan:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




export const cancelMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ candidate: req.user._id }).sort({
      createdAt: -1,
    });

    if (!subscription || subscription.status === "cancelled") {
      return res.status(200).json({
        success: true,
        subscription: toPublicShape(subscription),
      });
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    await subscription.save();

    await logAction({
      actor: req.user,
      action: "subscription.self_cancelled",
      targetType: "Subscription",
      targetId: subscription._id,
      metadata: { plan: subscription.plan },
    });

    return res.status(200).json({
      success: true,
      subscription: toPublicShape(subscription),
    });
  } catch (error) {
    console.error("cancelMySubscription:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
