import express from "express";

const router = express.Router();

const LANGUAGE_MAP = {
  javascript: { language: "nodejs", versionIndex: "4" },
  python: { language: "python3", versionIndex: "3" },
  java: { language: "java", versionIndex: "4" },
};

router.post("/", async (req, res) => {
  try {
    const { language, files } = req.body;

    const code = files?.[0]?.content;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const langConfig = LANGUAGE_MAP[language];

    if (!langConfig) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: code,
        language: langConfig.language,
        versionIndex: langConfig.versionIndex,
      }),
    });

    const data = await response.json();

    return res.json({
      run: {
        output: data.output,
        stderr: data.stderr || "",
      },
    });
  } catch (error) {
    console.error("Jdoodle error:", error);
    res.status(500).json({ error: "Execution failed" });
  }
});

export default router;