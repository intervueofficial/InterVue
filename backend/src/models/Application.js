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

    aiFitScore: {
      type: Number,
      default: null,
    },

    aiFitSummary: {
      type: String,
      default: "",
    },

    aiFitBreakdown: {
      skillsMatched: { type: [String], default: [] },
      skillsMissing: { type: [String], default: [] },
      experienceFit: { type: String, default: "" },
      educationFit: { type: String, default: "" },
      resumeQualitySignal: { type: String, default: "" },
    },

    aiFitGeneratedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "not_eligible", 
        "applied",
        "selected", 
        "rejected", 
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

    finalDecision: {
      type: String,
      enum: ["pending", "hired", "rejected", "waitlisted"],
      default: "pending",
    },

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

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
