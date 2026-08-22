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

      ...(email ? { email } : {}),
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      profileImage: image_url || "",
      
      role:
        email === process.env.ADMIN_EMAIL?.toLowerCase()
          ? "admin"
          : "candidate",
      isActive: true,
    };

    const matchConditions = [{ clerkId: newUser.clerkId }];
    if (email) {
      matchConditions.push({ email });
    }

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
          {
            new: true,
            upsert: true,
          
            setDefaultsOnInsert: false,
          }
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
        console.error(`send-interview-join-reminders (session ${session._id}):`, error.message);
      }
    }

    return { checked: sessions.length };
  }
);

export const functions = [syncUser, deleteUserFromDB, sendInterviewJoinReminders];