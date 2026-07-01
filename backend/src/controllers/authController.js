import User from "../models/User.js";

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("getMe:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const selectRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "interviewer", "candidate"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // First admin protection
    if (
      role === "admin" &&
      req.user.email !== process.env.ADMIN_EMAIL
    ) {
      return res.status(403).json({
        message: "Unauthorized to become admin",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};