import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Application from "../models/Application.js";
import { deleteStreamUser, upsertStreamUser } from "./stream.js";
import { sendInterviewReminderEmail } from "./resend.js";
import { formatInterviewDateTime } from "../utils/formatInterviewDateTime.js";
import { ENV } from "./env.js";

export const inngest = new Inngest({ id: "InterVue" });

const syncUser = inngest.createFunction(
  {
    id: "sync-user",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event }) => {
    await connectDB();

    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
    } = event.data;

    const email =
      email_addresses?.[0]?.email_address?.toLowerCase() || "";

    const newUser = {
      clerkId: id,
      // Omit email entirely when blank rather than storing "" — see the
      // matching comment in protectRoute.js's upsert for why.
      ...(email ? { email } : {}),
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      profileImage: image_url || "",
      // Bug fix: this used process.env.ADMIN_EMAIL.toLowerCase() with
      // no optional chaining — if ADMIN_EMAIL isn't set in this
      // environment, that throws a TypeError on every single webhook
      // delivery, which is why every sync-user run was failing.
      // protectRoute.js already guards this the same way.
      role:
        email === process.env.ADMIN_EMAIL?.toLowerCase()
          ? "admin"
          : "candidate",
      isActive: true,
    };

    // Only match on email when it's non-empty — matching on email:""
    // would find and hijack an unrelated user who also has no email
    // yet. See the matching comment in protectRoute.js.
    const matchConditions = [{ clerkId: newUser.clerkId }];
    if (email) {
      matchConditions.push({ email });
    }

    // Why this is no longer a plain User.create(): protectRoute.js
    // *also* creates the Mongo user on first authenticated request
    // (deliberately — webhooks can't reach localhost in dev, so that
    // path exists as a fallback). In production both paths are live at
    // once: the instant someone signs up, this webhook fires AND their
    // browser calls /auth/me. Whichever wins creates the user first;
    // when this webhook lost that race, User.create() threw E11000 on
    // the unique clerkId/email index, Inngest retried a few times over
    // several minutes, then marked the run Failed — even though nothing
    // was actually wrong, the user already existed.
    //
    // findOneAndUpdate(..., { upsert: true }) treats "already exists"
    // as success instead of an error: whichever side got there first
    // wins, this just reads/creates the same document either way.
    //
    // See protectRoute.js for why this retries the atomic upsert itself
    // (not a plain findOne) on conflict.
    let user;
    let lastErr = null;
    for (let attempt = 0; attempt < 10 && !user; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 500));
      }
      try {
        user = await User.findOneAndUpdate(
          { $or: matchConditions },
          { $setOnInsert: newUser },
          { new: true, upsert: true }
        );
      } catch (err) {
        lastErr = err;
        if (err.code !== 11000) {
          throw err;
        }
      }
    }

    if (!user) {
      console.error(
        `syncUser: Failed to create or locate user for clerkId=${newUser.clerkId} after upsert` +
          (lastErr ? ` (last error: ${lastErr.message})` : "")
      );
      return;
    }

    await upsertStreamUser({
      id: newUser.clerkId.toString(),
      name: user?.name || newUser.name,
      image: user?.profileImage || newUser.profileImage,
    });
  }
);

const deleteUserFromDB = inngest.createFunction(
  {
    id: "delete-user-from-db",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event }) => {
    await connectDB();

    const { id } = event.data;

    await User.deleteOne({ clerkId: id });

    await deleteStreamUser(id.toString());
  }
);

// ==========================
// Join-link reminder — sent exactly 1 hour before the interview
// ==========================
// This is the ONLY place the real interview link/code gets emailed for
// interviews scheduled meaningfully in advance (see selectApplicant in
// applicationController.js — the initial shortlist email deliberately
// omits the link for anything more than ~65 minutes out). Runs every 5
// minutes and looks for sessions whose scheduledAt falls ~1 hour from
// now (a 10-minute catch window, comfortably wider than the 5-minute
// cadence so nothing slips through), that haven't already had their
// link sent. This requires Inngest to actually be registered/synced
// for this app (the /api/inngest endpoint in server.js) — on Render
// that happens automatically on deploy via the Inngest Cloud
// connection using INNGEST_EVENT_KEY/INNGEST_SIGNING_KEY; if reminders
// don't seem to be firing, check the Inngest dashboard's "Functions"
// tab to confirm this one synced.
const sendInterviewJoinReminders = inngest.createFunction(
  {
    id: "send-interview-join-reminders",
    triggers: [{ cron: "*/5 * * * *" }],
  },
  async () => {
    await connectDB();

    const now = Date.now();
    const windowStart = new Date(now + 55 * 60 * 1000); // ~55 min out
    const windowEnd = new Date(now + 65 * 60 * 1000); // ~65 min out

    const sessions = await Session.find({
      status: { $in: ["scheduled", "waiting"] },
      reminderSentAt: null,
      scheduledAt: { $gte: windowStart, $lte: windowEnd },
    })
      .populate("candidate", "name email")
      .populate("interviewer", "name email");

    for (const session of sessions) {
      try {
        if (!session.candidate?.email) continue;

        // Job title isn't stored on Session directly — look it up via
        // the Application this session was created from.
        const application = await Application.findOne({ session: session._id }).populate(
          "job",
          "title"
        );
        const jobTitle = application?.job?.title || session.title;

        const { interviewDate, interviewTime } = formatInterviewDateTime(session.scheduledAt);
        const sessionLink = `${ENV.CLIENT_URL || ""}/session/${session._id}`;

        await sendInterviewReminderEmail({
          to: session.candidate.email,
          name: session.candidate.name,
          jobTitle,
          interviewDate,
          interviewTime,
          sessionCode: session.callId,
          sessionLink,
        });

        session.reminderSentAt = new Date();
        await session.save();
      } catch (error) {
        // One candidate's bad data (missing job, email provider hiccup)
        // shouldn't stop reminders going out to everyone else in this run.
        console.error(`send-interview-join-reminders (session ${session._id}):`, error.message);
      }
    }

    return { checked: sessions.length };
  }
);

export const functions = [syncUser, deleteUserFromDB, sendInterviewJoinReminders];