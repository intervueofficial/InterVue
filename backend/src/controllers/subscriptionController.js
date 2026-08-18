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
    // Raw record too, in case the consuming frontend wants to show e.g.
    // "you were on Pro until it lapsed" instead of just "free".
    raw: {
      plan: subscription.plan,
      status: subscription.status,
    },
  };
}

// ==========================
// GET /api/subscription/me
// Candidates with no Subscription row are on the free plan by default —
// no row is created until they actually upgrade.
// ==========================
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

// ==========================
// POST /api/subscription/upgrade   body: { plan: "pro" | "premium" }
//
// NOTE: no real payment gateway is wired up anywhere in this project
// (see billingController.js). This immediately activates the requested
// plan — there is no checkout, no card capture, nothing charged. It
// exists so a subscription-gated feature has something real to unlock
// against. Swap this out for an actual payment provider's webhook/
// confirm-payment flow before this is real revenue.
// ==========================
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

// ==========================
// POST /api/subscription/cancel
// ==========================
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
