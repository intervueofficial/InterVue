import { getSettings } from "../models/Setting.js";

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

    next();
  }
};
