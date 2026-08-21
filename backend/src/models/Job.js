import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "Remote",
    },

    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      default: "Full-time",
    },

    // ==========================
    // Eligibility Criteria
    // ==========================
    criteria: {
      // Accepted degrees, e.g. ["B.Tech", "M.Tech", "MCA"]
      requiredDegrees: {
        type: [String],
        default: [],
      },

      // Minimum years of experience required
      minExperience: {
        type: Number,
        default: 0,
      },

      // Every skill listed here must be present on the candidate profile
      requiredSkills: {
        type: [String],
        default: [],
      },

      // Free-text note shown to candidates (not used for automated matching)
      qualificationNote: {
        type: String,
        default: "",
      },
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },

    // Shown to a candidate in the "application received" assurance
    // email right after they apply — e.g. "5" -> "You can expect to
    // hear back within 5 days." Lets the interviewer/admin set a
    // realistic, honest expectation per job instead of a generic
    // hardcoded window.
    expectedResponseDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 90,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
