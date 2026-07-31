import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

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

        // Clerk webhooks need a public HTTPS endpoint to reach this
        // server (they can't hit localhost without a tunnel), so the
        // Inngest "sync-user" webhook that normally handles this may
        // never fire in local development. Upsert here too so Stream
        // Chat/Video always knows about the user regardless of whether
        // the webhook is reachable.
        await upsertStreamUser({
          id: user.clerkId,
          name: user.name,
          image: user.profileImage,
        });
      }

      // ===============================
      // KEEP PROFILE SYNCED
      // ===============================
      // Note: profileImage is intentionally NOT synced here. Candidates
      // can upload their own photo from My Profile (stored on Cloudinary),
      // and this endpoint runs on every authenticated request — if it kept
      // overwriting profileImage from Clerk's imageUrl, any custom photo
      // would get silently reverted right after being uploaded. Clerk's
      // avatar is only used once, as the default at account creation
      // above; from then on this app's own upload is the only thing that
      // changes it.

      let hasChanges = false;

      if (user.name !== name) {
        user.name = name;
        hasChanges = true;
      }

      if (user.email !== email) {
        user.email = email;
        hasChanges = true;
      }

      if (user.clerkId !== clerkId) {
        user.clerkId = clerkId;
        hasChanges = true;
      }

      if (hasChanges) {
        await user.save();

        await upsertStreamUser({
          id: user.clerkId,
          name: user.name,
          image: user.profileImage,
        });
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