import mongoose from "mongoose";

// key must match the identifiers lib/resend.js's getTemplate() looks up —
// one row per email type currently sent by the app. Placeholders use the
// {{fieldName}} syntax substituted in resend.js (e.g. {{candidateName}},
// {{jobTitle}}); each key's supported placeholders are documented in
// lib/resend.js's DEFAULT_TEMPLATES.
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
        "candidate_waitlisted",
        "candidate_rejected",
        "candidate_hired",
      ],
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    // Plain text, paragraphs separated by a blank line. resend.js wraps
    // this in the existing branded HTML layout (header banner, footer,
    // and — for selection/hired/rejected emails — the structural
    // interview-code / feedback boxes) rather than storing raw HTML here,
    // so an admin editing this can't accidentally break the layout.
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
