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

      // Find existing user by Clerk ID or Email.
      //
      // IMPORTANT: only include email in the match when it's non-empty.
      // Clerk can report an empty email (emailAddresses[0] missing) right
      // after signup or for certain auth methods — if two different
      // people both have email:"" at that moment, matching on email:""
      // would find and hijack a COMPLETELY UNRELATED user's document
      // (see the clerkId reassignment below), with two people's sign-ins
      // then fighting over the same document's clerkId — the actual
      // cause of the repeated "Failed to create or locate user" errors
      // and users' data intermittently vanishing/reappearing.
      const matchConditions = [{ clerkId }];
      if (email) {
        matchConditions.push({ email });
      }

      let user = await User.findOne({ $or: matchConditions });

      // Email exists but Clerk account changed
      if (user && user.clerkId !== clerkId) {
        user.clerkId = clerkId;
      }

      // ===============================
      // FIRST LOGIN
      // ===============================
      if (!user) {
        let isNewUser = false;

        // Why upsert instead of a plain create(): on a brand new
        // sign-in the frontend fires GET /auth/me and POST
        // /auth/select-role at (almost) the same instant (see
        // useAuthUser + useSyncRole). Both requests land here
        // concurrently, both see "no user yet", and both used to call
        // User.create() with the same clerkId/email — the second one
        // threw a Mongo E11000 duplicate-key error on the unique
        // index, which fell into the catch below as a bare 500. The
        // Clerk account existed (visible in the Clerk dashboard) but
        // whichever request lost the race never got a usable Mongo
        // user back, so its dashboard never loaded.
        //
        // findOneAndUpdate(..., { upsert: true }) lets Mongo resolve
        // that race atomically: whichever request arrives first
        // inserts the document, the other one just reads the same
        // document back via `new: true` instead of erroring.
        try {
          user = await User.findOneAndUpdate(
            { $or: matchConditions },
            {
              $setOnInsert: {
                clerkId,
                name,
                // Omit email entirely when blank rather than storing "".
                // Combined with the schema's email index now being
                // sparse (see User.js), this means multiple users with
                // no email yet don't collide with each other on the
                // unique index — each just has no email field at all,
                // instead of every one of them fighting over the same
                // literal "" value.
                ...(email ? { email } : {}),
                profileImage,
                role:
                  email === process.env.ADMIN_EMAIL?.toLowerCase()
                    ? "admin"
                    : null,
                isActive: true,
              },
            },
            { new: true, upsert: true }
          );
          isNewUser = true;
        } catch (err) {
          // Belt-and-braces: a genuine duplicate-key error can still
          // surface from the upsert itself under heavy concurrency.
          // If so, someone else's request just won — read back what
          // they created instead of failing the request.
          //
          // The winning insert can take a moment to become visible to
          // this read (e.g. right after a deploy, under a connection
          // burst) even though it already committed — so retry a few
          // times over ~1.5s before giving up, instead of failing on
          // the very first miss.
          if (err.code === 11000) {
            for (let attempt = 0; attempt < 6 && !user; attempt++) {
              if (attempt > 0) {
                await new Promise((r) => setTimeout(r, 500));
              }
              user = await User.findOne({ $or: matchConditions });
            }
          } else {
            throw err;
          }
        }

        if (!user) {
          throw new Error(
            `Failed to create or locate user for clerkId=${clerkId} after upsert`
          );
        }

        if (isNewUser) {
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

      // Only sync email when Clerk now reports a real one — never
      // overwrite an existing email with "", and never set the field to
      // "" for a user who has none yet (that's what caused the
      // unique-index collisions between different no-email users).
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