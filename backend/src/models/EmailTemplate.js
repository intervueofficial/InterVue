import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "candidate_applied",
        "candidate_selected",
        "interview_reminder",
        "candidate_rejected",
        "candidate_waitlisted",
        "candidate_hired",
        "interviewer_approved",
        "interviewer_rejected",
      ],
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);

export default EmailTemplate;
