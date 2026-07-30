// Shared code-execution helper (JDoodle-backed).
//
// This used to live only inside routes/executeRoute.js as a one-off
// handler for the "Run Code" button. It's now extracted so the same
// execution path can be reused server-side for grading — running the
// candidate's submitted code against a problem's test cases and
// comparing the result to the AI-generated reference answer, instead of
// trusting a passed/total pair sent straight from the browser.

export const LANGUAGE_MAP = {
  javascript: { language: "nodejs", versionIndex: "4" },
  python: { language: "python3", versionIndex: "3" },
  java: { language: "java", versionIndex: "4" },
};

/**
 * Runs a snippet of code against JDoodle's execute API.
 * @param {{ language: string, code: string, stdin?: string }} params
 * @returns {Promise<{ success: boolean, output: string, stderr: string }>}
 */
export async function runCode({ language, code, stdin = "" }) {
  const langConfig = LANGUAGE_MAP[language];

  if (!langConfig) {
    return {
      success: false,
      output: "",
      stderr: `Unsupported language: ${language}`,
    };
  }

  if (!code) {
    return { success: false, output: "", stderr: "No code provided" };
  }

  try {
    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: code,
        language: langConfig.language,
        versionIndex: langConfig.versionIndex,
        stdin: stdin || "",
      }),
    });

    const data = await response.json();

    return {
      success: !data.stderr,
      output: data.output || "",
      stderr: data.stderr || "",
    };
  } catch (error) {
    console.error("JDoodle execution error:", error.message);
    return { success: false, output: "", stderr: "Execution failed" };
  }
}

/**
 * Runs `code` against every test case and reports pass/fail per case,
 * comparing (trimmed) stdout to the test case's expected output.
 */
export async function gradeAgainstTestCases({ language, code, testCases = [] }) {
  const results = [];
  let passed = 0;

  for (const tc of testCases) {
    const result = await runCode({ language, code, stdin: tc.input || "" });

    const actual = (result.output || "").trim();
    const expected = (tc.expectedOutput || "").trim();
    const testPassed = result.success && actual === expected;

    if (testPassed) passed += 1;

    results.push({
      input: tc.input || "",
      expectedOutput: tc.expectedOutput || "",
      actualOutput: actual,
      passed: testPassed,
      error: result.stderr || undefined,
    });
  }

  return { passed, total: testCases.length, results };
}
