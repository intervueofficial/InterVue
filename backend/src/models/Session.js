import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    activeProblem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      default: null,
    },

    activeQuiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "waiting",
        "live",
        "completed",
        "cancelled",
      ],
      default: "scheduled",
    },

    callId: {
      type: String,
      default: "",
    },

startedAt: {
  type: Date,
  default: null,
},

endedAt: {
  type: Date,
  default: null,
},

currentStage: {
  type: String,
  enum: [
    "waiting",
    "problem",
    "quiz",
    "discussion",
    "completed",
  ],
  default: "waiting",
},

quizResult: {
  score: { type: Number, default: null },
  total: { type: Number, default: null },
  submittedAt: { type: Date, default: null },
},

codeResult: {
  passed: { type: Number, default: null },
  total: { type: Number, default: null },
  submittedAt: { type: Date, default: null },
},

performanceReport: {
  summary: { type: String, default: "" },
  codingFeedback: { type: String, default: "" },
  quizFeedback: { type: String, default: "" },
  confidenceFeedback: { type: String, default: "" },
  codingScore: { type: Number, default: null },
  quizScore: { type: Number, default: null },
  confidenceScore: { type: Number, default: null },
  interviewerComment: { type: String, default: "" },
  pdfBase64: { type: String, default: "" },
  generatedAt: { type: Date, default: null },
},

  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Session",
  sessionSchema
);