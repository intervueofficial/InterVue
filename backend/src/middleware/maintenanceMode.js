import { getSettings } from "../models/Setting.js";

// Blocks candidates (only) from a route while Maintenance Mode is on.
// Must run after protectRoute, since it reads req.user.role.
//
// Admins and interviewers are never blocked — an admin obviously needs
// to be able to turn maintenance mode back off, and interviewers running
// a live session shouldn't be cut off mid-interview by a switch flipped
// for unrelated reasons.
//
// Applied to the core candidate entry points: browsing/opening jobs,
// applying to a job, and joining a session. This is not exhaustive
// (every candidate-readable GET isn't wrapped), but it covers the
// actions that actually matter — a candidate can't start anything new
// while it's on.
export const blockCandidatesInMaintenance = async (req, res, next) => {
  try {
    if (req.user?.role !== "candidate") return next();

    const settings = await getSettings();

    if (settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message: settings.maintenanceMessage,
        maintenanceMode: true,
      });
    }

    next();
  } catch (error) {
    console.error("blockCandidatesInMaintenance:", error);
    // Fail open — a broken settings lookup should not take the whole
    // platform down for every candidate.
    next();
  }
};
