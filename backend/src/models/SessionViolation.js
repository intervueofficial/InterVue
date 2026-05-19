import mongoose from "mongoose";

const sessionViolationSchema =
  new mongoose.Schema(
    {
      candidateId: {
        type: String,
        required: true,
        index: true,
      },

      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },

      reason: {
        type: String,
        required: true,
        trim: true,
      },

      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

const SessionViolation =
  mongoose.model(
    "SessionViolation",
    sessionViolationSchema
  );

export default SessionViolation;