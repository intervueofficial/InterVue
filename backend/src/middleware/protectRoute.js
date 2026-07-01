import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      let user = await User.findOne({ clerkId });

      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkId);

        user = await User.create({
          clerkId,
          name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
          email: clerkUser.emailAddresses[0]?.emailAddress,
          profileImage: clerkUser.imageUrl,
          role:
  clerkUser.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL
    ? "admin"
    : "candidate",
          isActive: true,
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message: "Your account has been disabled.",
        });
      }

      req.user = user;

      next();
    } catch (error) {
      console.error("protectRoute:", error);

      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },
];