import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Snapshot of the candidate's profile at the time of applying,
    // so interviewers see exactly what was evaluated even if the
    // candidate edits their profile later.
    profileSnapshot: {
      phone: String,
      degree: String,
      fieldOfStudy: String,
      institution: String,
      yearOfGraduation: Number,
      experienceYears: Number,
      skills: [String],
      resumeUrl: String,
    },

    isEligible: {
      type: Boolean,
      required: true,
    },

    failedCriteria: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "not_eligible", // failed automated eligibility check
        "applied", // eligible, waiting for interviewer review
        "selected", // interviewer picked them, session created + email sent
        "rejected", // interviewer passed on them
      ],
      default: "applied",
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A candidate can only apply once per job
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
