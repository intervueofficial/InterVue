// Shared code-execution helper (JDoodle-backed).
//
// This used to live only inside routes/executeRoute.js as a one-off
// handler for the "Run Code" button. It's now extracted so the same
// execution path can be reused server-side for grading — running the
// candidate's submitted code against a problem's test cases and
// comparing the result to the AI-generated reference answer, instead of
// trusting a passed/total pair sent straight from the browser.
//
// versionIndex "0" is used everywhere below instead of stale hardcoded
// indexes — JDoodle's "0" always maps to that language's latest
// supported runtime, which is what actually lets candidate code use
// modern imports (Node's `require`/ES built-ins, Python 3's standard
// library, Java's `import java.util.*` etc.) without hitting an
// outdated compiler.

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
      // JDoodle-level error (bad credentials, rate limit, etc), not a
      // compile/runtime error in the candidate's code.
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

// Only allow safe identifier characters through into generated source —
// entryPoint ultimately comes from AI output / admin input, and gets
// spliced directly into a driver program below.
function sanitizeEntryPoint(entryPoint) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(entryPoint || "") ? entryPoint : null;
}

/**
 * Wraps the candidate's (or reference solution's) code with a small
 * driver program that:
 *   1. reads the test case's arguments (a JSON array) from stdin,
 *   2. calls `entryPoint(...args)` — whatever function/method the
 *      candidate actually wrote, however they implemented it,
 *   3. prints the JSON-encoded return value.
 *
 * This is what makes grading LeetCode-style: the candidate can use any
 * logic/algorithm/imports they want, as long as their function returns
 * the right value for the given arguments — nothing else about their
 * code is inspected.
 *
 * Returns `null` if a harness can't be built for this language, in
 * which case callers should fall back to legacy raw stdin/stdout
 * comparison.
 */
export function buildHarness(language, code, entryPoint) {
  const fn = sanitizeEntryPoint(entryPoint);
  if (!fn || !code) return null;

  if (language === "javascript") {
    // Candidate code can freely use CommonJS `require(...)` for imports
    // anywhere in their code — JDoodle's Node runtime supports it
    // regardless of where in the file it appears.
    return `${code}

(function () {
  const __raw = require("fs").readFileSync(0, "utf8").trim();
  const __args = __raw ? JSON.parse(__raw) : [];
  const __result = ${fn}(...__args);
  console.log(JSON.stringify(__result === undefined ? null : __result));
})();`;
  }

  if (language === "python") {
    // Python's import statement works anywhere at top level, so
    // candidate imports above/below their function are both fine.
    return `${code}

import sys, json as __json
__raw = sys.stdin.read().strip()
__args = __json.loads(__raw) if __raw else []
__result = ${fn}(*__args)
print(__json.dumps(__result))`;
  }

  // Java requires knowing each argument's static type to call a method
  // via generated source, which isn't derivable from JSON alone — Java
  // problems fall back to legacy full-program (stdin/stdout) grading,
  // where the candidate's own imports at the top of the file already
  // work as normal, unaffected by this.
  return null;
}

/**
 * Structural JSON-value equality (order-sensitive for arrays, order
 * -insensitive for object keys) — comparing return values instead of
 * exact printed text avoids false failures from whitespace/formatting
 * differences while still catching any actual difference in the answer.
 */
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

/**
 * Runs `code` against every test case and reports pass/fail per case.
 *
 * When the problem has an `entryPoint`, this calls that function
 * directly with each test case's arguments (LeetCode-style — any
 * correct logic passes) and deep-compares the JSON return value.
 * Otherwise it falls back to the legacy mode: run the whole program
 * with the test case's input on stdin and compare trimmed stdout text.
 */
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
          // Candidate's code didn't print valid JSON (e.g. it printed
          // extra debug output, or threw before reaching our driver) —
          // treat as a fail rather than crashing the grading run.
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

