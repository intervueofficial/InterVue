import { getSettings } from "../models/Setting.js";
import { logAction } from "../lib/auditLog.js";




export const getPlatformSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("getPlatformSettings:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




export const updatePlatformSettings = async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;

    const settings = await getSettings();
    const wasOn = settings.maintenanceMode;

    if (typeof maintenanceMode === "boolean") settings.maintenanceMode = maintenanceMode;
    if (typeof maintenanceMessage === "string" && maintenanceMessage.trim()) {
      settings.maintenanceMessage = maintenanceMessage.trim();
    }
    settings.updatedBy = req.user._id;

    await settings.save();

    if (typeof maintenanceMode === "boolean" && maintenanceMode !== wasOn) {
      await logAction({
        actor: req.user,
        action: "settings.maintenance_toggled",
        targetType: "Setting",
        targetId: "platform",
        metadata: { before: wasOn, after: maintenanceMode },
      });
    }

    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("updatePlatformSettings:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
