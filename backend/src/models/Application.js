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

    // ==========================
    // Post-interview decision
    // (set after the interviewer ends the video session)
    // ==========================
    finalDecision: {
      type: String,
      enum: ["pending", "hired", "rejected", "waitlisted"],
      default: "pending",
    },

    // Latest feedback / custom message from the interviewer,
    // used as the body of the email sent for the current decision.
    feedback: {
      type: String,
      default: "",
    },

    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    decidedAt: {
      type: Date,
      default: null,
    },

    // Full audit trail — a candidate can be waitlisted, revisited,
    // and finally hired/rejected, each step logged here.
    decisionHistory: {
      type: [
        {
          decision: {
            type: String,
            enum: ["hired", "rejected", "waitlisted"],
          },
          feedback: String,
          decidedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          decidedAt: Date,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// A candidate can only apply once per job
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
