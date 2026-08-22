import Subscription from "../models/Subscription.js";

const PLAN_RANK = { free: 0, pro: 1, premium: 2 };

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
