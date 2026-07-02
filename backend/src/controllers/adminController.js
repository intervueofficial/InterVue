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
      Session.countDocuments({ status: "active" }),
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