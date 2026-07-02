import mongoose from "mongoose";

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    tags: [
      {
        type: String,
      },
    ],

    starterCode: {
      type: String,
      default: "",
    },

    solution: {
      type: String,
      default: "",
    },

    testCases: [
      {
        input: String,
        expectedOutput: String,
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Problem", problemSchema);