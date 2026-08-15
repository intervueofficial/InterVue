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

    // The function/method name grading calls directly (LeetCode-style),
    // e.g. "twoSum". When set, the candidate's code is executed by
    // calling this function with each test case's arguments and
    // comparing the *return value* — so any correct implementation
    // passes, regardless of approach, and no boilerplate stdin/stdout
    // handling is required from the candidate. testCases[].input is then
    // a JSON-encoded array of arguments, e.g. "[[2,7,11,15],9]", and
    // testCases[].expectedOutput is JSON-encoded, e.g. "[0,1]".
    //
    // Left blank for legacy problems, which fall back to comparing raw
    // stdin/stdout text instead.
    entryPoint: {
      type: String,
      default: "",
      trim: true,
    },

    testCases: [
      {
        input: String,
        expectedOutput: String,
      },
    ],

    // Progressive, LeetCode-style hints shown to the candidate on request
    // (never all at once). Populated either by an admin/interviewer
    // typing them in manually, or by the AI generator — either way this
    // is what makes hints *dynamic*: they live on the problem document
    // itself, not hardcoded anywhere in the UI.
    hints: [
      {
        type: String,
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