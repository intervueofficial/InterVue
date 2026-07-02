import User from "../models/User.js";

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("getMe:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const selectRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!["admin", "interviewer", "candidate"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Only configured admin email can become admin
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

    if (
      role === "admin" &&
      req.user.email.toLowerCase() !== adminEmail
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to become Admin.",
      });
    }

    // Update role
    req.user.role = role;

    await req.user.save();

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("selectRole:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};