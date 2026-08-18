import AuditLog from "../models/AuditLog.js";

/**
 * Records one audit log entry. Fire-and-forget by design — a logging
 * failure (bad DB connection, validation error, whatever) must never
 * take down the actual request it's describing, so every failure is
 * swallowed here after being logged to the console.
 *
 * @param {Object} params
 * @param {Object} params.actor - the req.user performing the action (needs ._id)
 * @param {string} params.action - dot-namespaced action name, e.g. "problem.deleted"
 * @param {string} [params.targetType] - e.g. "Problem", "User", "Job"
 * @param {string|mongoose.Types.ObjectId} [params.targetId]
 * @param {Object} [params.metadata] - before/after values or other context
 */
export async function logAction({ actor, action, targetType = "", targetId = "", metadata = {} }) {
  try {
    if (!actor?._id || !action) return;

    await AuditLog.create({
      actor: actor._id,
      action,
      targetType,
      targetId: targetId ? String(targetId) : "",
      metadata,
    });
  } catch (error) {
    console.error("logAction (non-fatal):", error);
  }
}
