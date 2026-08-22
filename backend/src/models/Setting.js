import mongoose from "mongoose";






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



export async function getSettings() {
  let settings = await Setting.findById("platform");
  if (!settings) {
    settings = await Setting.create({ _id: "platform" });
  }
  return settings;
}

export default Setting;
