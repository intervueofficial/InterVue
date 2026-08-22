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

      const matchConditions = [{ clerkId }];
      if (email) {
        matchConditions.push({ email });
      }

      let user = await User.findOne({ $or: matchConditions });

      // Email exists but Clerk account changed
      if (user && user.clerkId !== clerkId) {
        user.clerkId = clerkId;
      }

      if (!user) {
        let isNewUser = false;

        const upsertPayload = {
          $setOnInsert: {
            clerkId,
            name,
            ...(email ? { email } : {}),
            profileImage,
            role:
              email === process.env.ADMIN_EMAIL?.toLowerCase()
                ? "admin"
                : null,
            isActive: true,
          },
        };

        let lastErr = null;
        for (let attempt = 0; attempt < 10 && !user; attempt++) {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, 500));
          }
          try {
            const rawResult = await User.findOneAndUpdate(
              { $or: matchConditions },
              upsertPayload,
              {
                new: true,
                upsert: true,
                rawResult: true,
                
                setDefaultsOnInsert: false,
              }
            );
            user = rawResult.value;
            
            isNewUser = !!rawResult.lastErrorObject?.upserted;
          } catch (err) {
            lastErr = err;
            if (err.code !== 11000) {
              throw err;
            }
          
          }
        }

        if (!user) {
          throw new Error(
            `Failed to create or locate user for clerkId=${clerkId} after upsert` +
              (lastErr ? ` (last error: ${lastErr.message})` : "")
          );
        }

        if (isNewUser) {
          console.log(`✅ New user created: ${email}`);

          await upsertStreamUser({
            id: user.clerkId,
            name: user.name,
            image: user.profileImage,
          });
        }
      }

      let hasChanges = false;

      if (!user.identityVerification?.verified && user.name !== name) {
        user.name = name;
        hasChanges = true;
      }

      if (email && user.email !== email) {
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