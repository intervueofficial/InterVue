import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";

export const protectRoute = [
  requireAuth(),

  async (req, res, next) => {
    try {
      const { userId: clerkId } = req.auth();

      if (!clerkId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Fetch latest Clerk user
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const email =
        clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";

      const name =
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        clerkUser.username ||
        "User";

      const profileImage = clerkUser.imageUrl || "";

      // Find existing user by Clerk ID or Email
      let user = await User.findOne({
        $or: [{ clerkId }, { email }],
      });

      // Email exists but Clerk account changed
      if (user && user.clerkId !== clerkId) {
        user.clerkId = clerkId;
      }

      // ===============================
      // FIRST LOGIN
      // ===============================
      if (!user) {
        user = await User.create({
          clerkId,
          name,
          email,
          profileImage,
          role:
            email === process.env.ADMIN_EMAIL?.toLowerCase()
              ? "admin"
              : null,
          isActive: true,
        });

        console.log(`✅ New user created: ${email}`);
      }

      // ===============================
      // KEEP PROFILE SYNCED
      // ===============================

      let hasChanges = false;

      if (user.name !== name) {
        user.name = name;
        hasChanges = true;
      }

      if (user.email !== email) {
        user.email = email;
        hasChanges = true;
      }

      if (user.profileImage !== profileImage) {
        user.profileImage = profileImage;
        hasChanges = true;
      }

      if (user.clerkId !== clerkId) {
        user.clerkId = clerkId;
        hasChanges = true;
      }

      if (hasChanges) {
        await user.save();
      }

      // ===============================
      // ACCOUNT STATUS
      // ===============================

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been disabled.",
        });
      }

      req.user = user;

      next();
    } catch (error) {
      console.error("protectRoute:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
];