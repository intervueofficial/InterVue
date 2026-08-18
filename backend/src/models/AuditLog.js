import mongoose from "mongoose";

// One row per meaningfully destructive/sensitive admin action — not every
// admin request. See lib/auditLog.js for the write helper and the list of
// call sites this is actually wired into.
const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Dot-namespaced so the feed reads naturally and stays greppable,
    // e.g. "problem.deleted", "user.role_changed",
    // "settings.maintenance_toggled".
    action: {
      type: String,
      required: true,
      trim: true,
    },

    targetType: {
      type: String,
      default: "",
      trim: true,
    },

    // Stored as a string rather than ObjectId — the target can be a Mongo
    // document id, but for settings-level actions there may be no single
    // document to point at, so this stays free-form.
    targetId: {
      type: String,
      default: "",
    },

    // Before/after values or any other context worth keeping, e.g.
    // { before: "candidate", after: "interviewer" }.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
