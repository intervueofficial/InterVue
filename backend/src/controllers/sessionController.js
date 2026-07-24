import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import Problem from "../models/Problem.js";
import Quiz from "../models/Quiz.js";

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

export async function getActiveSessions(req, res) {
  try {
    const { role, _id } = req.user;

    // Admins manage the whole pipeline, so they can see every active
    // session. Interviewers and candidates must only ever see sessions
    // they are actually a party to — otherwise every interviewer/candidate
    // would see every other candidate's private interview on this screen.
    const scopeFilter =
      role === "admin"
        ? {}
        : role === "interviewer"
        ? { interviewer: _id }
        : role === "candidate"
        ? { candidate: _id }
        : { _id: null }; // unknown role → no sessions

    const sessions = await Session.find({
      status: {
        $in: [
          "scheduled",
          "waiting",
          "live",
        ],
      },
      ...scopeFilter,
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
      .populate("candidate", "name email profileImage role")
      .populate("interviewer", "name email profileImage role")
      .populate("createdBy", "name")
      .populate("activeProblem", "title difficulty tags")
      .populate("activeQuiz", "title difficulty questions")
      .select("-performanceReport.pdfBase64")
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

    // Make sure whoever just joined can actually read/write the
    // session's chat channel. The channel is created at session-creation
    // time with only the admin as a member (see createSession), so
    // without this, the second person to join (usually the candidate)
    // gets a Stream "not allowed to perform action ReadChannel" error
    // the moment their client tries to watch() the channel.
    try {
      await chatClient
        .channel("messaging", session.callId)
        .addMembers([req.user.clerkId]);
    } catch (chatError) {
      console.log(
        "Error adding user to chat channel:",
        chatError.message
      );
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

/**
 * Candidate submits their quiz answers/score for the currently active quiz.
 * Grading itself happens client-side (in QuizPanel); this just persists
 * the final score so it can show up later in the candidate's Results page.
 */
export async function submitQuizResult(req, res) {
  try {
    const { id } = req.params;
    const { score, total } = req.body;

    if (typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({
        message: "score and total are required numbers",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (
      !session.candidate ||
      session.candidate.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only the candidate on this session can submit a quiz result",
      });
    }

    session.quizResult = { score, total, submittedAt: new Date() };
    await session.save();

    return res.json({
      success: true,
      quizResult: session.quizResult,
    });
  } catch (error) {
    console.log("Error in submitQuizResult:", error.message);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

const populateSession = (query) =>
  query
    .populate("candidate", "name email profileImage role clerkId")
    .populate("interviewer", "name email profileImage role clerkId")
    .populate("createdBy", "name")
    .populate("activeProblem")
    .populate("activeQuiz");

/**
 * Persists the candidate's code-grading result (tests passed / total)
 * for this session, computed client-side by running their code against
 * every test case on the active problem. Used later for the AI-generated
 * post-interview performance report.
 */
export async function submitCodeResult(req, res) {
  try {
    const { id } = req.params;
    const { passed, total } = req.body;

    if (typeof passed !== "number" || typeof total !== "number") {
      return res.status(400).json({
        message: "passed and total are required numbers",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (
      !session.candidate ||
      session.candidate.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only the candidate on this session can submit a code result",
      });
    }

    session.codeResult = { passed, total, submittedAt: new Date() };
    await session.save();

    return res.json({
      success: true,
      codeResult: session.codeResult,
    });
  } catch (error) {
    console.log("Error in submitCodeResult:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Interviewer pushes a coding problem to the candidate.
 * The candidate's client polls the session and shows a popup
 * as soon as `activeProblem` changes.
 */
export async function pushProblem(req, res) {
  try {
    const { id } = req.params;
    const { problemId } = req.body;

    if (!problemId) {
      return res.status(400).json({
        message: "problemId is required",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (
      !session.interviewer ||
      session.interviewer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only the interviewer assigned to this session can push content",
      });
    }

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    session.activeProblem = problem._id;
    session.activeQuiz = null;
    session.currentStage = "problem";

    await session.save();

    const populatedSession = await populateSession(Session.findById(id));

    return res.json({
      success: true,
      session: populatedSession,
    });
  } catch (error) {
    console.log("Error in pushProblem:", error.message);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/**
 * Interviewer pushes a quiz to the candidate.
 */
export async function pushQuiz(req, res) {
  try {
    const { id } = req.params;
    const { quizId } = req.body;

    if (!quizId) {
      return res.status(400).json({
        message: "quizId is required",
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (
      !session.interviewer ||
      session.interviewer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only the interviewer assigned to this session can push content",
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    session.activeQuiz = quiz._id;
    session.activeProblem = null;
    session.currentStage = "quiz";

    await session.save();

    const populatedSession = await populateSession(Session.findById(id));

    return res.json({
      success: true,
      session: populatedSession,
    });
  } catch (error) {
    console.log("Error in pushQuiz:", error.message);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/**
 * Interviewer clears whatever is currently pushed
 * (goes back to the waiting/discussion state).
 */
export async function clearActiveContent(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (
      !session.interviewer ||
      session.interviewer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only the interviewer assigned to this session can do this",
      });
    }

    session.activeProblem = null;
    session.activeQuiz = null;
    session.currentStage = "discussion";

    await session.save();

    const populatedSession = await populateSession(Session.findById(id));

    return res.json({
      success: true,
      session: populatedSession,
    });
  } catch (error) {
    console.log("Error in clearActiveContent:", error.message);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

/**
 * Loads the saved whiteboard for a session. Kept as its own endpoint
 * (rather than folded into getSessionById, which the UI polls every
 * few seconds) so board data — which can get large — isn't fetched
 * on every poll, only once when the panel actually opens.
 */
export async function getWhiteboard(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id).select("whiteboard interviewer candidate");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const userId = req.user._id.toString();
    const isCandidate = session.candidate && session.candidate.toString() === userId;
    const isInterviewer = session.interviewer && session.interviewer.toString() === userId;
    const isAdmin = req.user.role === "admin";

    if (!isCandidate && !isInterviewer && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this whiteboard" });
    }

    return res.json({
      success: true,
      whiteboard: session.whiteboard || { elements: [], appState: {}, version: 0 },
    });
  } catch (error) {
    console.log("Error in getWhiteboard:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Saves the whiteboard — used for both the periodic auto-save and the
 * explicit "Save" / "Clear" actions. Both the interviewer and the
 * candidate on a session may save (they can both draw); a plain admin
 * viewer cannot. `version` is a simple counter so a slow, stale
 * auto-save request can't clobber a newer one that already landed.
 */
export async function saveWhiteboard(req, res) {
  try {
    const { id } = req.params;
    const { elements, appState, version } = req.body;

    const session = await Session.findById(id).select("whiteboard interviewer candidate");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const userId = req.user._id.toString();
    const isCandidate = session.candidate && session.candidate.toString() === userId;
    const isInterviewer = session.interviewer && session.interviewer.toString() === userId;

    if (!isCandidate && !isInterviewer) {
      return res.status(403).json({ message: "Not authorized to edit this whiteboard" });
    }

    // Stale-write guard: ignore a save whose version is behind what's
    // already stored (e.g. a delayed auto-save landing after a newer one).
    const currentVersion = session.whiteboard?.version || 0;
    if (typeof version === "number" && version < currentVersion) {
      return res.json({ success: true, skipped: true, whiteboard: session.whiteboard });
    }

    session.whiteboard = {
      elements: Array.isArray(elements) ? elements : [],
      appState: appState && typeof appState === "object" ? appState : {},
      version: currentVersion + 1,
      updatedAt: new Date(),
      updatedBy: req.user._id,
    };

    await session.save();

    return res.json({ success: true, whiteboard: session.whiteboard });
  } catch (error) {
    console.log("Error in saveWhiteboard:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function downloadPerformanceReport(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const isCandidate =
      session.candidate && session.candidate.toString() === req.user._id.toString();
    const isInterviewer =
      session.interviewer && session.interviewer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isCandidate && !isInterviewer && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this report" });
    }

    if (!session.performanceReport?.pdfBase64) {
      return res.status(404).json({ message: "No performance report available yet" });
    }

    const buffer = Buffer.from(session.performanceReport.pdfBase64, "base64");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="performance-report-${id}.pdf"`
    );
    return res.send(buffer);
  } catch (error) {
    console.log("Error in downloadPerformanceReport:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
