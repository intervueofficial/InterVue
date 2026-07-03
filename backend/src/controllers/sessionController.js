import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can create sessions",
      });
    }

    const {
      title,
      description,
      scheduledAt,
    } = req.body;

    if (
      !title ||
      !description ||
      !scheduledAt
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const callId =
      "session_" +
      Date.now();

    const session =
      await Session.create({
        title,
        description,
        scheduledAt,
        createdBy: req.user._id,
        status: "scheduled",
        callId,
      });

    await streamClient.video
      .call("default", callId)
      .getOrCreate({
        data: {
          created_by_id:
            req.user.clerkId,
        },
      });

    const channel =
      chatClient.channel(
        "messaging",
        callId,
        {
          name: title,
          created_by_id:
            req.user.clerkId,
          members: [req.user.clerkId],
        }
      );

    await channel.create();

    return res.status(201).json({
      success: true,
      session,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({
      status: {
        $in: [
          "scheduled",
          "waiting",
          "live",
        ],
      },
    })
      .populate(
        "candidate",
        "name email profileImage role"
      )
      .populate(
        "interviewer",
        "name email profileImage role"
      )
      .populate(
        "createdBy",
        "name"
      )
      .sort({
        scheduledAt: 1,
      });

    return res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [
    { interviewer: userId },
    { candidate: userId },
],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session =
await Session.findById(id)
.populate(
"candidate",
"name email profileImage role clerkId"
)
.populate(
"interviewer",
"name email profileImage role clerkId"
)
.populate(
"createdBy",
"name"
)
.populate(
"activeProblem"
)
.populate(
"activeQuiz"
);
    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(
  req,
  res
) {
  try {
    const session =
      await Session.findById(
        req.params.id
      );

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (
      session.status ===
      "completed"
    ) {
      return res.status(400).json({
        message:
          "Interview already completed",
      });
    }

    if (
      req.user.role ===
      "candidate"
    ) {
      if (
        session.candidate &&
        session.candidate.toString() !==
          req.user._id.toString()
      ) {
        return res.status(400).json({
          message:
            "Candidate slot already occupied",
        });
      }

      session.candidate =
        req.user._id;
    }

    if (
      req.user.role ===
      "interviewer"
    ) {
      if (
        session.interviewer &&
        session.interviewer.toString() !==
          req.user._id.toString()
      ) {
        return res.status(400).json({
          message:
            "Interviewer slot already occupied",
        });
      }

      session.interviewer =
        req.user._id;
    }

if (
  session.candidate &&
  session.interviewer
) {
  session.status = "live";

  if (!session.startedAt) {
    session.startedAt = new Date();
  }
}
else {
  session.status = "waiting";
}

await session.save();

const populatedSession = await Session.findById(session._id)
  .populate(
    "candidate",
    "name email profileImage role clerkId"
  )
  .populate(
    "interviewer",
    "name email profileImage role clerkId"
  )
  .populate(
    "createdBy",
    "name"
  );

const channel = chatClient.channel(
  "messaging",
  session.callId
);

await channel.addMembers([
  req.user.clerkId,
]);

return res.json({
  success: true,
  session: populatedSession,
});

  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);
    console.log("Session found:", session?._id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

const isCandidate =
  session.candidate?.toString() === req.user._id.toString();

const isInterviewer =
  session.interviewer?.toString() === req.user._id.toString();

if (!isCandidate && !isInterviewer) {
  return res.status(403).json({
    message: "Unauthorized",
  });
}

    if (session.status === "completed") {
      return res.status(400).json({
        message: "Session already completed",
      });
    }

    session.status = "completed";

    session.endedAt = new Date();

session.currentStage =
  "completed";

    await session.save();
console.log("Session saved as completed");
    // Delete Stream Video (don't fail if it errors)
    try {
      const call = streamClient.video.call("default", session.callId);
      console.log("Deleting Stream Call...");
      await call.delete({ hard: true });
    } catch (err) {
      console.log("Video delete failed:", err.message);
    }

    try {
      const channel = chatClient.channel("messaging", session.callId);
      console.log("Deleting Stream Chat...");
      await channel.delete();
    } catch (err) {
      console.log("Chat delete failed:", err.message);
    }

    return res.status(200).json({
      message: "Session ended successfully",
      session,
    });

  } catch (error) {
    console.log("Error in endSession:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

export async function deleteSession(req, res) {
  try {
    const session = await Session.findById(
      req.params.id
    );

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    try {
      await streamClient.video
        .call("default", session.callId)
        .delete({
          hard: true,
        });
    } catch {}

    try {
      const channel = chatClient.channel(
        "messaging",
        session.callId
      );

      await channel.delete();
    } catch {}

session.status = "cancelled";

await session.save();

    return res.json({
      success: true,
      message: "Session deleted",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}