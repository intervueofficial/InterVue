import User from "../models/User.js";
import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary.js";

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

// =======================================
// Upload Candidate Profile Picture (Cloudinary)
// =======================================
// The candidate uploads a photo from My Profile. It's stored on the same
// `profileImage` field the rest of the app already reads (e.g. Stream
// chat/video, the admin Users table) — so once uploaded it's automatically
// what an interviewer sees on the candidate's profile card in Applicants.
export const uploadProfileImage = async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        success: false,
        message:
          "Image uploads aren't configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.",
      });
    }

    const { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    // Expects a data URL (e.g. "data:image/png;base64,...."), which is
    // what the browser's FileReader.readAsDataURL produces.
    if (!image.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    const upload = await cloudinary.uploader.upload(image, {
      folder: "intervue/profile-pictures",
      public_id: req.user.clerkId,
      overwrite: true,
      // Overwriting a public_id does NOT bust Cloudinary's own CDN cache
      // by default — without this, the old photo can keep being served
      // globally for a while even though our DB already points at the
      // new one.
      invalidate: true,
      resource_type: "image",
      transformation: [
        { width: 512, height: 512, crop: "fill", gravity: "face" },
      ],
    });

    req.user.profileImage = upload.secure_url;
    await req.user.save();

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("uploadProfileImage:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload image. Please try again.",
    });
  }
};

// =======================================
// Upload Candidate Resume (Cloudinary)
// =======================================
// The candidate uploads a PDF/Word doc from My Profile. Stored as a raw
// Cloudinary asset (not an image transform) and saved on
// `candidateProfile.resumeUrl`, which the resume link/download button and
// the admin/interviewer Applicants view read from.
const ALLOWED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const uploadProfileResume = async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        success: false,
        message:
          "File uploads aren't configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.",
      });
    }

    const { resume, fileName } = req.body;

    if (!resume || typeof resume !== "string") {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    // Expects a data URL (e.g. "data:application/pdf;base64,....")
    const mimeMatch = resume.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch?.[1];

    if (!mimeType || !ALLOWED_RESUME_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        message: "Only PDF or Word documents are allowed",
      });
    }

    // Rough size check on the base64 payload (~10MB limit, matching the UI)
    const base64Data = resume.slice(resume.indexOf(",") + 1);
    const approxBytes = base64Data.length * 0.75;
    const MAX_BYTES = 10 * 1024 * 1024;

    if (approxBytes > MAX_BYTES) {
      return res.status(400).json({
        success: false,
        message: "File is too large. Max 10MB.",
      });
    }

    const RESUME_EXTENSION_BY_MIME = {
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    };

    const upload = await cloudinary.uploader.upload(resume, {
      folder: "intervue/resumes",
      public_id: req.user.clerkId,
      overwrite: true,
      invalidate: true,
      resource_type: "raw",
      use_filename: true,
      filename_override: fileName || `${req.user.clerkId}-resume`,
      // Cloudinary "raw" assets otherwise carry no file extension, which
      // can leave browsers unsure how to open/download the link — this
      // keeps it as a proper .pdf/.doc/.docx URL.
      format: RESUME_EXTENSION_BY_MIME[mimeType],
    });

    req.user.candidateProfile = req.user.candidateProfile || {};
    req.user.candidateProfile.resumeUrl = upload.secure_url;

    // Re-evaluate profile completeness now that the resume changed
    const profile = req.user.candidateProfile;
    profile.isComplete = !!(
      profile.degree &&
      profile.fieldOfStudy &&
      profile.yearOfGraduation &&
      profile.skills?.length > 0
    );

    await req.user.save();

    return res.status(200).json({
      success: true,
      user: req.user,
      resumeUrl: req.user.candidateProfile.resumeUrl,
    });
  } catch (error) {
    console.error("uploadProfileResume:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload resume. Please try again.",
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