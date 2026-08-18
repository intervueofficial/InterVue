import Quiz from "../models/Quiz.js";
import { logAction } from "../lib/auditLog.js";

// =======================================
// Get All Quizzes
// =======================================
export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      quizzes,
    });
  } catch (error) {
    console.error("getQuizzes:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Get Quiz By Id
// =======================================
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    return res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error("getQuizById:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Create Quiz
// =======================================
export const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      duration,
      passingMarks,
      questions,
      isPublished,
    } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      difficulty,
      duration,
      passingMarks,
      questions,
      isPublished,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      quiz,
      message: "Quiz created successfully",
    });
  } catch (error) {
    console.error("createQuiz:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// =======================================
// Update Quiz
// =======================================
export const updateQuiz = async (req, res) => {
  try {
    const existing = await Quiz.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const isOwner = existing.createdBy?.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only edit quizzes you created",
      });
    }

    const {
      title,
      description,
      difficulty,
      duration,
      passingMarks,
      questions,
      isPublished,
    } = req.body;

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        difficulty,
        duration,
        passingMarks,
        questions,
        isPublished,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      quiz,
      message: "Quiz updated successfully",
    });
  } catch (error) {
    console.error("updateQuiz:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Delete Quiz
// =======================================
export const deleteQuiz = async (req, res) => {
  try {
    const existing = await Quiz.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const isOwner = existing.createdBy?.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only delete quizzes you created",
      });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    await logAction({
      actor: req.user,
      action: "quiz.deleted",
      targetType: "Quiz",
      targetId: existing._id,
      metadata: { title: existing.title },
    });

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    console.error("deleteQuiz:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};