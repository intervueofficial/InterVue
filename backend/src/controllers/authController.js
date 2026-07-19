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

export const updateCandidateProfile = async (req, res) => {
  try {
    const {
      phone,
      degree,
      fieldOfStudy,
      institution,
      yearOfGraduation,
      experienceYears,
      skills,
      resumeUrl,
    } = req.body;

    const profile = {
      phone: phone || "",
      degree: degree || "",
      fieldOfStudy: fieldOfStudy || "",
      institution: institution || "",
      yearOfGraduation: yearOfGraduation || null,
      experienceYears:
        experienceYears === "" || experienceYears == null
          ? 0
          : Number(experienceYears),
      skills: Array.isArray(skills)
        ? skills.map((s) => s.trim()).filter(Boolean)
        : [],
      resumeUrl: resumeUrl || "",
    };

    // Consider the profile "complete" once the core required fields are filled
    profile.isComplete = !!(
      profile.degree &&
      profile.fieldOfStudy &&
      profile.yearOfGraduation &&
      profile.skills.length > 0
    );

    req.user.candidateProfile = profile;

    await req.user.save();

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("updateCandidateProfile:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};