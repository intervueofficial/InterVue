import Subscription from "../models/Subscription.js";
import { logAction } from "../lib/auditLog.js";

// Rough interview-prep pricing used only to derive an MRR figure from
// plan counts — there is no real payment gateway, so this is a display
// estimate, not billed revenue. Double-check these numbers before
// treating the MRR card as anything more than a rough figure.
const PLAN_PRICE_INR = {
  free: 0,
  pro: 499,
  premium: 1499,
};

// ==========================
// List subscriptions
// ==========================
export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate("candidate", "name email profileImage role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error("getSubscriptions:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================
// Cancel a subscription
// ==========================
export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    await subscription.save();

    await logAction({
      actor: req.user,
      action: "subscription.cancelled",
      targetType: "Subscription",
      targetId: subscription._id,
      metadata: { plan: subscription.plan },
    });

    return res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error("cancelSubscription:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================
// Billing stats — MRR, active count, plan breakdown, this month's churn
// ==========================
export const getSubscriptionStats = async (req, res) => {
  try {
    const [all, planBreakdownRaw, statusBreakdownRaw] = await Promise.all([
      Subscription.find(),
      Subscription.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
      Subscription.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const planBreakdown = planBreakdownRaw.reduce((acc, r) => {
      acc[r._id || "unknown"] = r.count;
      return acc;
    }, {});

    const statusBreakdown = statusBreakdownRaw.reduce((acc, r) => {
      acc[r._id || "unknown"] = r.count;
      return acc;
    }, {});

    const activeCount = all.filter((s) => s.status === "active").length;
    const trialingCount = all.filter((s) => s.status === "trialing").length;

    // MRR: sum of each active/trialing subscriber's plan price. Trialing
    // subscribers are included at their plan price since that's the rate
    // they'll convert to (or churn from) — a common SaaS convention for
    // "forecast MRR", clearly not "collected revenue".
    const mrr = all
      .filter((s) => s.status === "active" || s.status === "trialing")
      .reduce((sum, s) => sum + (PLAN_PRICE_INR[s.plan] ?? 0), 0);

    // Churn this month: subscriptions cancelled since the 1st of the
    // current month.
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const churnedThisMonth = all.filter(
      (s) => s.status === "cancelled" && s.cancelledAt && s.cancelledAt >= startOfMonth
    ).length;

    return res.status(200).json({
      success: true,
      stats: {
        mrr,
        currency: "INR",
        activeCount,
        trialingCount,
        churnedThisMonth,
        totalSubscribers: all.length,
        planBreakdown,
        statusBreakdown,
      },
    });
  } catch (error) {
    console.error("getSubscriptionStats:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
