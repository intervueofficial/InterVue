import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => value.length === 4,
        message: "Exactly 4 options are required.",
      },
    },

    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },

    marks: {
      type: Number,
      default: 1,
      min: 1,
    },

    explanation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    duration: {
      type: Number,
      required: true,
      default: 30,
    },

    passingMarks: {
      type: Number,
      required: true,
      default: 5,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Quiz", quizSchema);