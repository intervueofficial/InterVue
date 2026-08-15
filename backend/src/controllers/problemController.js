import Problem from "../models/Problem.js";
import { gradeAgainstTestCases } from "../lib/judge.js";

// =======================================
// Get All Problems
// =======================================
export const getProblems = async (req, res) => {
  try {
    const problems = await Problem.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      problems,
    });
  } catch (error) {
    console.error("getProblems:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Get Problem By Id
// =======================================
export const getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      problem,
    });
  } catch (error) {
    console.error("getProblemById:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Create Problem
// =======================================
export const createProblem = async (req, res) => {
  try {
    const problem = await Problem.create({
      ...req.body,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      problem,
    });
  } catch (error) {
    console.error("createProblem:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Update Problem
// =======================================
export const updateProblem = async (req, res) => {
  try {
    const existing = await Problem.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const isOwner = existing.createdBy?.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only edit problems you created",
      });
    }

    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      problem,
    });
  } catch (error) {
    console.error("updateProblem:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Grade Problem (practice mode — no session attached)
// =======================================
// Reuses the same LeetCode-style judge engine that live interview
// sessions use (lib/judge.js), so practice mode and real interviews
// grade identically — same per-test-case pass/fail, same error
// reporting. Unlike the session version, this doesn't persist a score
// anywhere; it's just "how am I doing right now" for a candidate
// practicing on their own.
export const gradeProblem = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "code is required",
      });
    }

    if (typeof language !== "string" || !language.trim()) {
      return res.status(400).json({
        success: false,
        message: "language is required",
      });
    }

    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const testCases = problem.testCases || [];

    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This problem has no test cases to grade against",
      });
    }

    const { passed, total, results } = await gradeAgainstTestCases({
      language,
      code,
      testCases,
      entryPoint: problem.entryPoint,
    });

    return res.json({
      success: true,
      passed,
      total,
      results,
    });
  } catch (error) {
    console.error("gradeProblem:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =======================================
// Delete Problem
// =======================================
export const deleteProblem = async (req, res) => {
  try {
    const existing = await Problem.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const isOwner = existing.createdBy?.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only delete problems you created",
      });
    }

    await Problem.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Problem deleted successfully",
    });
  } catch (error) {
    console.error("deleteProblem:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};