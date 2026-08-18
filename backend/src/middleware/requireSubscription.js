import Subscription from "../models/Subscription.js";

// free < pro < premium — used to check "does this plan meet or exceed
// the required tier" rather than an exact match, so a premium
// subscriber isn't blocked from a pro-gated feature.
const PLAN_RANK = { free: 0, pro: 1, premium: 2 };

/**
 * requireSubscription("pro") -> blocks candidates whose active/trialing
 * plan rank is below "pro". Must run after protectRoute.
 *
 * A candidate with no Subscription document at all is treated as being
 * on the free plan (rather than erroring), since Subscription rows are
 * only created once someone actually upgrades — there's no free-plan
 * row created at signup.
 *
 * Only "active" and "trialing" subscriptions count toward access;
 * "past_due" and "cancelled" fall back to free-plan behavior even if a
 * higher plan is still recorded on the row, since payment/renewal isn't
 * current.
 */
export const requireSubscription = (minPlan) => async (req, res, next) => {
  try {
    if (req.user?.role !== "candidate") return next();

    const requiredRank = PLAN_RANK[minPlan] ?? 0;
    if (requiredRank === 0) return next();

    const subscription = await Subscription.findOne({ candidate: req.user._id }).sort({
      createdAt: -1,
    });

    const isCurrent = subscription && ["active", "trialing"].includes(subscription.status);
    const currentRank = isCurrent ? PLAN_RANK[subscription.plan] ?? 0 : 0;

    if (currentRank < requiredRank) {
      return res.status(403).json({
        success: false,
        message: `This feature requires the ${minPlan} plan or higher.`,
        upgradeRequired: true,
        requiredPlan: minPlan,
        currentPlan: isCurrent ? subscription.plan : "free",
      });
    }

    next();
  } catch (error) {
    console.error("requireSubscription:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
