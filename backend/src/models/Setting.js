import mongoose from "mongoose";

// Singleton document (single fixed _id) holding platform-wide settings
// that need to be real — i.e. actually read by the backend — rather than
// the browser-only "Platform Preferences" panel on the admin Settings
// page. Start small: just Maintenance Mode. Add fields here as more of
// that panel gets wired up for real.
const settingSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "platform",
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    maintenanceMessage: {
      type: String,
      default: "InterVue is undergoing scheduled maintenance. Please check back shortly.",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, _id: false }
);

const Setting = mongoose.model("Setting", settingSchema);

// Always returns the one platform settings document, creating it with
// defaults on first access so callers never have to null-check.
export async function getSettings() {
  let settings = await Setting.findById("platform");
  if (!settings) {
    settings = await Setting.create({ _id: "platform" });
  }
  return settings;
}

export default Setting;
