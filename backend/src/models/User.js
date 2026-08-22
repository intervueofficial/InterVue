import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      // No longer `required: true` — a user can legitimately have no
      // email yet (right after signup, or via an auth method that
      // doesn't return one). We now omit the field entirely in that
      // case (see protectRoute.js / inngest.js) rather than storing ""
      // for everyone, so `sparse` below only enforces uniqueness among
      // documents that actually have a real email — it no longer
      // collides two different no-email users against each other.
      unique: true,
      sparse: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
    type: String,
    enum: ["admin", "interviewer", "candidate"],
    default: null,
},
isActive: {
    type: Boolean,
    default: true
},

// ==========================
// Interviewer Approval (Admin Gatekeeping)
// ==========================
// Anyone can select "interviewer" as their role at signup, but they
// can't actually act as one until an admin approves them — see
// requireRole.js, which additionally checks this status for the
// "interviewer" role, and adminController.js's
// approve/rejectInterviewerRequest.
interviewerApproval: {
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedAt: { type: Date, default: null },
  reviewedAt: { type: Date, default: null },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  note: { type: String, default: "" },
},

// ==========================
// Identity Verification (Duplicate-Account Prevention)
// ==========================
// A candidate can trivially sign up for unlimited accounts with new
// email addresses — email/phone uniqueness alone can't stop that.
// This verifies identity by having the candidate scan their physical
// Aadhaar card via a live in-browser camera capture (no gallery
// upload — see AadhaarCameraCapture.jsx), OCR'd server-side
// (lib/aadhaarOcr.js) to extract name, DOB, and Aadhaar number.
//
// We never store the raw Aadhaar number — only a one-way SHA-256 hash
// of it, which is enough to enforce "one verified identity = one
// account" via the unique index below, without taking on Aadhaar-
// number storage/compliance risk. The captured image itself is never
// persisted — it's processed in memory for the OCR pass and discarded.
identityVerification: {
  provider: { type: String, default: "" }, // "aadhaar-ocr"
  verified: { type: Boolean, default: false },
  aadhaarHash: {
    type: String,
    // No `default: null` here on purpose. Mongoose applies schema
    // defaults on upsert-insert by default (setDefaultsOnInsert),
    // which was explicitly setting this to null on every single new
    // user — not leaving it unset. A `sparse` index only excludes
    // documents where the field is genuinely MISSING, not ones where
    // it's present with value null, so every unverified user (i.e.
    // everyone, since nobody's done verification yet) was colliding
    // with every other one on that shared null value. This was the
    // real cause of the "Failed to create or locate user" errors
    // chased throughout an earlier debugging session — leaving this
    // field genuinely unset until a real hash exists is what makes
    // the sparse unique index behave as intended. Same reasoning
    // applies to every other field in this sub-schema below.
    unique: true,
    sparse: true,
  },
  // Name and DOB as read directly off the scanned card — these become
  // the permanent, locked source of truth for the candidate's identity
  // once verified (see authController.getMe / protectRoute.js, which
  // stop syncing `name` from Clerk once this is set).
  verifiedName: { type: String, default: "" },
  verifiedDob: { type: String, default: "" }, // as OCR'd, e.g. "DD/MM/YYYY"
  maskedAadhaar: { type: String, default: "" }, // e.g. "XXXXXXXX1234"
  verifiedAt: { type: Date, default: null },
},

// ==========================
// Candidate Profile
// ==========================
candidateProfile: {
  phone: { type: String, default: "" },

  degree: { type: String, default: "" }, // e.g. "B.Tech", "M.Tech", "MCA"
  fieldOfStudy: { type: String, default: "" }, // e.g. "Computer Science"
  institution: { type: String, default: "" },
  yearOfGraduation: { type: Number, default: null },

  experienceYears: { type: Number, default: 0 },

  skills: {
    type: [String],
    default: [],
  },

  resumeUrl: { type: String, default: "" },

  // Best-effort extracted plain text of resumeUrl (see
  // lib/resumeParser.js) — populated on upload in
  // authController.uploadProfileResume. Used as AI context for
  // resume-aware question generation (aiGeneratorController.js) and
  // the AI fit score (utils/generateFitScore.js). Never shown directly
  // to any user — it's model input, not a display field.
  resumeText: { type: String, default: "" },

  isComplete: {
    type: Boolean,
    default: false,
  },
},
  },
  { timestamps: true } // createdAt, updatedAt
);

// Whenever role is (re)set to "interviewer" — at signup via selectRole,
// or later by an admin via updateUserRole — the account should always
// start out unapproved, even if it had a prior approved/rejected
// history (e.g. demoted to candidate, then re-promoted). This is the
// single source of truth for that default, so it applies no matter
// which code path changes the role.
function resetInterviewerApprovalToPending(target) {
  target.interviewerApproval = {
    status: "pending",
    requestedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    note: "",
  };
}

// Handles `user.role = "interviewer"; await user.save()` (selectRole).
userSchema.pre("save", function (next) {
  if (this.isModified("role") && this.role === "interviewer") {
    resetInterviewerApprovalToPending(this);
  }
  next();
});

// Handles `User.findByIdAndUpdate(id, { role: "interviewer" })`
// (adminController.updateUserRole), which bypasses document
// middleware/`pre("save")` entirely since it's query middleware.
userSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate() || {};
  const nextRole = update.role ?? update.$set?.role;

  if (nextRole === "interviewer") {
    if (!update.$set) update.$set = {};
    update.$set.interviewerApproval = {
      status: "pending",
      requestedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      note: "",
    };
    this.setUpdate(update);
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
