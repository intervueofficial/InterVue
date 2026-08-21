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

  isComplete: {
    type: Boolean,
    default: false,
  },
},
  },
  { timestamps: true } // createdAt, updatedAt
);

const User = mongoose.model("User", userSchema);

export default User;
