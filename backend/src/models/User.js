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
