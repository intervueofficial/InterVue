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

      const clerkUser = await clerkClient.users.getUser(clerkId);

      const email =
        clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";

      const name =
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        "User";

      const profileImage = clerkUser.imageUrl || "";

      const role =
        email === process.env.ADMIN_EMAIL?.toLowerCase()
          ? "admin"
          : clerkUser.publicMetadata?.role || "candidate";

      let user = await User.findOne({ clerkId });

      // ==========================
      // CREATE NEW USER
      // ==========================

      if (!user) {
        user = await User.create({
          clerkId,
          name,
          email,
          profileImage,
          role,
          isActive: true,
        });

        console.log("✅ New User Created");
      }

      // ==========================
      // UPDATE EXISTING USER
      // ==========================

      let updated = false;

      if (user.name !== name) {
        user.name = name;
        updated = true;
      }

      if (user.email !== email) {
        user.email = email;
        updated = true;
      }

      if (user.profileImage !== profileImage) {
        user.profileImage = profileImage;
        updated = true;
      }

      if (!user.role) {
        user.role = role;
        updated = true;
      }

      if (user.isActive === undefined) {
        user.isActive = true;
        updated = true;
      }

      if (updated) {
        await user.save();
        console.log("✅ User Updated");
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