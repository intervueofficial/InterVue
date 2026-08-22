import User from "../models/User.js";
import Session from "../models/Session.js";
import Problem from "../models/Problem.js";
import { logAction } from "../lib/auditLog.js";
import {
  sendInterviewerApprovedEmail,
  sendInterviewerRejectedEmail,
} from "../lib/resend.js";

// =======================================
// Dashboard Statistics
// =======================================
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCandidates,
      totalInterviewers,
      totalAdmins,
      activeUsers,
      totalProblems,
      totalSessions,
      activeSessions,
      completedSessions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "candidate" }),
      User.countDocuments({ role: "interviewer" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isActive: true }),
      Problem.countDocuments(),
      Session.countDocuments(),
      Session.countDocuments({ status: "live" }),
      Session.countDocuments({ status: "completed" }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCandidates,
        totalInterviewers,
        totalAdmins,
        activeUsers,
        totalProblems,
        totalSessions,
        activeSessions,
        completedSessions,
      },
    });
  } catch (error) {
    console.error("getDashboardStats:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Get All Users
// =======================================
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("getUsers:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Update User Role
// =======================================
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "interviewer", "candidate"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const before = await User.findById(id).select("role");

    if (!before) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      {
        new: true,
        runValidators: true,
      }
    );

    await logAction({
      actor: req.user,
      action: "user.role_changed",
      targetType: "User",
      targetId: user._id,
      metadata: { before: before.role, after: role },
    });

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("updateUserRole:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Enable / Disable User
// =======================================
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const before = user.isActive;
    user.isActive = !user.isActive;

    await user.save();

    await logAction({
      actor: req.user,
      action: "user.status_toggled",
      targetType: "User",
      targetId: user._id,
      metadata: { before, after: user.isActive },
    });

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("toggleUserStatus:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Interviewer Approval
// =======================================

// List all interviewers currently awaiting a decision.
export const getInterviewerRequests = async (req, res) => {
  try {
    const requests = await User.find({
      role: "interviewer",
      "interviewerApproval.status": "pending",
    })
      .select("name email profileImage createdAt interviewerApproval")
      .sort({ "interviewerApproval.requestedAt": 1 });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("getInterviewerRequests:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const approveInterviewerRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const { note = "" } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "interviewer") {
      return res.status(400).json({
        success: false,
        message: "This user is not an interviewer applicant.",
      });
    }

    const before = user.interviewerApproval?.status;

    user.interviewerApproval.status = "approved";
    user.interviewerApproval.reviewedAt = new Date();
    user.interviewerApproval.reviewedBy = req.user._id;
    user.interviewerApproval.note = note;

    await user.save();

    await logAction({
      actor: req.user,
      action: "interviewer.approved",
      targetType: "User",
      targetId: user._id,
      metadata: { before, after: "approved" },
    });

    sendInterviewerApprovedEmail({ to: user.email, name: user.name }).catch((err) =>
      console.error("sendInterviewerApprovedEmail:", err)
    );

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("approveInterviewerRequest:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const rejectInterviewerRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const { note = "" } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "interviewer") {
      return res.status(400).json({
        success: false,
        message: "This user is not an interviewer applicant.",
      });
    }

    const before = user.interviewerApproval?.status;

    user.interviewerApproval.status = "rejected";
    user.interviewerApproval.reviewedAt = new Date();
    user.interviewerApproval.reviewedBy = req.user._id;
    user.interviewerApproval.note = note;

    await user.save();

    await logAction({
      actor: req.user,
      action: "interviewer.rejected",
      targetType: "User",
      targetId: user._id,
      metadata: { before, after: "rejected", note },
    });

    sendInterviewerRejectedEmail({ to: user.email, name: user.name, note }).catch((err) =>
      console.error("sendInterviewerRejectedEmail:", err)
    );

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("rejectInterviewerRequest:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Get All Sessions
// =======================================
export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate("host", "name email profileImage role")
      .populate("participant", "name email profileImage role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("getSessions:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Analytics
// =======================================
export const getAnalytics = async (req, res) => {
  try {
    const [
      sessionsByStatusRaw,
      problemsByDifficultyRaw,
      usersByRoleRaw,
      totalSessions,
      completedSessionsWithDuration,
    ] = await Promise.all([
      Session.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Problem.aggregate([
        { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      Session.countDocuments(),
      Session.find({
        status: "completed",
        startedAt: { $ne: null },
        endedAt: { $ne: null },
      }).select("startedAt endedAt"),
    ]);

    // ── Sessions created per day, last 14 days ──────────────────
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const sessionsOverTimeRaw = await Session.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const sessionsOverTime = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = sessionsOverTimeRaw.find((r) => r._id === key);
      sessionsOverTime.push({
        date: key,
        count: found ? found.count : 0,
      });
    }

    // ── Reduce grouped arrays into plain objects ────────────────
    const sessionsByStatus = sessionsByStatusRaw.reduce((acc, r) => {
      acc[r._id || "unknown"] = r.count;
      return acc;
    }, {});

    const problemsByDifficulty = problemsByDifficultyRaw.reduce((acc, r) => {
      acc[r._id || "unknown"] = r.count;
      return acc;
    }, {});

    const usersByRole = usersByRoleRaw.reduce((acc, r) => {
      acc[r._id || "unassigned"] = r.count;
      return acc;
    }, {});

    // ── Derived metrics ──────────────────────────────────────────
    const completedCount = sessionsByStatus.completed || 0;
    const completionRate =
      totalSessions > 0
        ? Math.round((completedCount / totalSessions) * 100)
        : 0;

    const durationsInMinutes = completedSessionsWithDuration
      .map((s) => (s.endedAt - s.startedAt) / 60000)
      .filter((m) => Number.isFinite(m) && m >= 0);

    const avgDurationMinutes = durationsInMinutes.length
      ? Math.round(
          durationsInMinutes.reduce((a, b) => a + b, 0) /
            durationsInMinutes.length
        )
      : 0;

    return res.status(200).json({
      success: true,
      analytics: {
        totalSessions,
        completionRate,
        avgDurationMinutes,
        sessionsByStatus,
        problemsByDifficulty,
        usersByRole,
        sessionsOverTime,
      },
    });
  } catch (error) {
    console.error("getAnalytics:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
