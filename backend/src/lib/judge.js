export const LANGUAGE_MAP = {
  javascript: { language: "nodejs", versionIndex: "0" },
  python: { language: "python3", versionIndex: "0" },
  java: { language: "java", versionIndex: "0" },
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

    if (data.error) {
      return { success: false, output: "", stderr: String(data.error) };
    }

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

function sanitizeEntryPoint(entryPoint) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(entryPoint || "") ? entryPoint : null;
}

export function buildHarness(language, code, entryPoint) {
  const fn = sanitizeEntryPoint(entryPoint);
  if (!fn || !code) return null;

  if (language === "javascript") {
    return `${code}

(function () {
  const __raw = require("fs").readFileSync(0, "utf8").trim();
  const __args = __raw ? JSON.parse(__raw) : [];
  const __result = ${fn}(...__args);
  console.log(JSON.stringify(__result === undefined ? null : __result));
})();`;
  }

  if (language === "python") {
    return `${code}

import sys, json as __json
__raw = sys.stdin.read().strip()
__args = __json.loads(__raw) if __raw else []
__result = ${fn}(*__args)
print(__json.dumps(__result))`;
  }
  return null;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object") {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k, i) => k === bKeys[i] && deepEqual(a[k], b[k]));
  }
  return false;
}

export async function gradeAgainstTestCases({ language, code, testCases = [], entryPoint }) {
  const results = [];
  let passed = 0;

  const harness = entryPoint ? buildHarness(language, code, entryPoint) : null;

  for (const tc of testCases) {
    const runInput = harness ? tc.input || "[]" : tc.input || "";
    const result = await runCode({ language, code: harness || code, stdin: runInput });

    let testPassed = false;
    let actual = (result.output || "").trim();

    if (result.success) {
      if (harness) {
        try {
          const actualValue = JSON.parse(actual);
          const expectedValue = JSON.parse(tc.expectedOutput || "null");
          testPassed = deepEqual(actualValue, expectedValue);
        } catch {
         
          testPassed = false;
        }
      } else {
        testPassed = actual === (tc.expectedOutput || "").trim();
      }
    }

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

