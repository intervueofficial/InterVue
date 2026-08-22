import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
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
// email addresses — email/phone uniqueness alone can't stop that. This
// verifies identity via DigiLocker (Aadhaar-backed, government OAuth),
// which UIDAI itself already deduplicates biometrically at issuance —
// one Aadhaar per person, guaranteed at the source.
//
// We never store the raw Aadhaar number — only a one-way SHA-256 hash
// of (normalized name + DOB + last 4 digits), which is enough to
// enforce "one verified identity = one account" via the unique index
// below, without taking on Aadhaar-number storage/compliance risk.
identityVerification: {
  provider: { type: String, default: "" }, // "digilocker"
  verified: { type: Boolean, default: false },
  aadhaarHash: {
    type: String,
    default: null,
    unique: true,
    sparse: true, // allows many docs with no hash yet (unverified users)
  },
  verifiedName: { type: String, default: "" },
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
