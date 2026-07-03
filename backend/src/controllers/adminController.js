import User from "../models/User.js";
import Session from "../models/Session.js";
import Problem from "../models/Problem.js";

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

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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

    user.isActive = !user.isActive;

    await user.save();

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
