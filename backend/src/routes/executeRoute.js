import express from "express";
import { runCode } from "../lib/judge.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { language, files, stdin } = req.body;

    const code = files?.[0]?.content;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const result = await runCode({ language, code, stdin });

    return res.json({
      run: {
        output: result.output,
        stderr: result.stderr,
      },
    });
  } catch (error) {
    console.error("Execute route error:", error);
    res.status(500).json({ error: "Execution failed" });
  }
});

export default router;
