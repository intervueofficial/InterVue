# InterVue — AI Answer Grading + OTP Login + Cloudinary Profile Photos

Extract this into your project root, overwriting existing files.

This bundle implements the three changes you asked for. Two of them
(#2 and #3) need a small amount of dashboard/environment setup before
they'll work — details below.

---

## 1. AI now generates the answer too, and grading is done for real

**Problem before:** the AI generator only produced a problem + guessed
test cases. Grading ran entirely in the browser, and the score
(`passed`/`total`) was just trusted from whatever the client POSTed —
a candidate could open devtools and send `{ passed: 10, total: 10 }`
without writing a line of code.

**What changed:**

- `backend/src/controllers/aiGeneratorController.js` — the AI prompt now
  also asks for `solutionCode`: a full, correct reference solution (the
  "answer key"), not just the problem statement.
- Added `verifyProblemAgainstItsOwnSolution()` — after generation, the
  backend actually **executes** that reference solution against every
  generated test case and overwrites `expectedOutput` with what it
  really outputs. This means the test cases your candidates are graded
  against are backed by a verified real answer, not an LLM's guess at
  what the output should look like.
- `backend/src/lib/judge.js` — new shared code-execution helper (used by
  both "Run Code" and grading, so there's one execution path instead of
  duplicated logic).
- `backend/src/controllers/sessionController.js` — `submitCodeResult` no
  longer accepts a `passed`/`total` pair from the client. It now takes
  the candidate's `{ code, language }`, re-runs it against the active
  problem's test cases **on the server**, and computes the real score.
  A candidate can no longer fake a passing grade.
- `frontend/src/pages/SessionPage.jsx`, `hooks/useSessions.js`,
  `api/sessions.js` — updated to submit `{ code, language }` instead of a
  precomputed score.
- `frontend/src/pages/admin/ProblemForm.jsx` — added a "Reference
  Solution" field so you can see/edit the answer key on any problem
  (auto-filled when using "Generate with AI").
- `frontend/src/components/AIGeneratorWizard.jsx` — carries the
  generated `solutionCode` through to the form.
- `frontend/src/pages/admin/ViewProblemModal.jsx` — shows the reference
  solution when viewing a problem.

No new environment variables needed for this one — it reuses your
existing `JDOODLE_CLIENT_ID` / `JDOODLE_CLIENT_SECRET`.

---

## 2. OTP required before every sign-in and sign-up (via Clerk)

**What changed:**

- `frontend/src/pages/SignUpPage.jsx` and `frontend/src/pages/SignInPage.jsx`
  are fully rewritten as custom, **passwordless, email-OTP** flows using
  Clerk's headless `useSignUp` / `useSignIn` hooks instead of the hosted
  `<SignUp>` / `<SignIn>` widgets:
  - Sign up: enter name + email → Clerk emails a 6-digit code → entering
    it correctly is what actually creates the verified account.
  - Sign in: enter email → Clerk emails a 6-digit code → entering it
    signs you in. No password step at all, so there's no path into any
    dashboard that skips the OTP.
- `frontend/src/App.jsx` now routes `/sign-in` and `/sign-up` to these
  custom pages instead of Clerk's hosted components.
- Nobody can land on `/dashboard`, `/candidate/dashboard`,
  `/admin/dashboard`, etc. without an active Clerk session — that guard
  already existed in `App.jsx` and is unchanged; it's just now
  impossible to get a session without completing the OTP step.

### ⚠️ Required Clerk Dashboard setting (can't be done from code)

Your Clerk instance needs **"Email verification code"** enabled as a
sign-in strategy (not just for initial sign-up verification, which is
usually on by default). In the Clerk Dashboard:

1. Go to **User & Authentication → Email, Phone, Username**.
2. Under **Sign-in options**, make sure **"Email verification code"** is
   toggled on (alongside or instead of password).
3. Under **Email address**, make sure verification is required.

If a candidate/interviewer's sign-in shows "Email code sign-in isn't
enabled for this account," that setting is what's missing — Clerk
manages the actual OTP email delivery itself, so there's nothing to
configure in Resend for this part specifically.

---

## 3. Candidate profile picture via Cloudinary

**What changed:**

- `backend/src/lib/cloudinary.js` — Cloudinary SDK config.
- `backend/src/controllers/authController.js` — new `uploadProfileImage`
  controller: accepts a base64 image, uploads it to Cloudinary
  (face-cropped to 512×512), and saves the resulting URL onto the
  existing `User.profileImage` field (the same field already used for
  Stream chat/video avatars and the admin Users table).
- `backend/src/routes/authRoute.js` — new `POST /api/auth/profile-image`.
- `backend/src/server.js` — raised the JSON body size limit to 10mb so a
  base64-encoded photo fits in one request.
- `frontend/src/pages/candidate/Profile.jsx` — My Profile now has a
  clickable avatar (with a camera hover state) to upload/change your
  photo.
- `frontend/src/pages/interviewer/Applicants.jsx` — the applicants table
  now shows each candidate's photo, and a new **"View Profile"** button
  opens a full profile card (photo, skills, education, experience,
  resume link) — see the new
  `frontend/src/pages/interviewer/CandidateProfileModal.jsx`.

### Required setup

1. Create a free account at https://cloudinary.com (if you don't have
   one already).
2. From your Cloudinary Dashboard, copy **Cloud name**, **API Key**, and
   **API Secret**.
3. Add them to `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
4. Run `npm install` in `backend/` to pull in the new `cloudinary`
   dependency (already added to `package.json` / `package-lock.json`).

Without these env vars set, the upload endpoint responds with a clear
503 message rather than crashing the server.

---

## What I verified

- Backend: every modified/new file passes `node --check` (valid ESM
  syntax) and `judge.js` loads cleanly.
- Frontend: `vite build` completes successfully with the new pages/flows
  in place — no compile errors.
- Confirmed the reference-solution field round-trips correctly:
  AI generation → wizard normalization → form state → create/update
  payload → `Problem.solution` (this field already existed in the
  schema, just wasn't being populated before).

## Not changed / out of scope

- Resend is still only used for the selection/rejection/hired emails it
  already sent — Clerk sends the OTP emails itself (see the dashboard
  note above). If you specifically want OTP emails to go out through
  Resend's infrastructure, that requires configuring a custom SMTP
  provider inside Clerk's dashboard (Clerk supports pointing its email
  delivery at your own SMTP credentials), not an application code change.
- Waitlist.jsx (interviewer) wasn't given the same avatar/profile-card
  treatment as Applicants.jsx — say the word if you'd like that too.

---

## Patch: sign-up "Verification incomplete" fix

If you saw **"Verification incomplete. Please try again."** right after
entering a correct code, that meant the code itself was fine, but
Clerk's sign-up attempt came back with `status: "missing_requirements"`
instead of `"complete"` — your Clerk instance requires a **password**
for sign-up, and the original custom form only collected name + email.

Fixed in `frontend/src/pages/SignUpPage.jsx`:
- The sign-up form now also collects a password (min 8 characters) and
  sends it in `signUp.create(...)`.
- If a sign-up ever again comes back incomplete after a correct code,
  the error message now names exactly which field Clerk is still
  waiting on (`attempt.missingFields`), instead of a generic message —
  so it's diagnosable instead of a dead end.

Sign-in (`SignInPage.jsx`) was already unaffected by this — it uses the
`email_code` first factor directly and doesn't need a password.

---

## Patch: LeetCode-style function-call grading + JDoodle upgrade

**What changed:**

- **Problem model** (`backend/src/models/Problem.js`) — added `entryPoint`:
  the exact function/method name the candidate implements (e.g.
  `twoSum`). When set, grading calls that function directly.
- **AI generator** — the prompt now asks for a LeetCode-style shape:
  `entryPoint`, plus `testCases[].input` as a JSON array of arguments
  (e.g. `"[[2,7,11,15],9]"`) and `testCases[].expectedOutput` as the
  JSON-encoded return value (e.g. `"[0,1]"`), instead of raw
  stdin/stdout text.
- **`backend/src/lib/judge.js`** — added `buildHarness(language, code,
  entryPoint)`, which wraps a candidate's (or the AI's reference)
  code with a small driver that reads the arguments from stdin, calls
  `entryPoint(...args)` — whatever the candidate actually wrote, in
  whatever style/algorithm/imports they used — and prints the JSON
  return value. `gradeAgainstTestCases` now deep-compares the parsed
  JSON return value instead of doing a raw string match, so formatting
  differences (spacing, key order) never cause a false fail, but any
  real difference in the answer does. Supported for **JavaScript and
  Python**. Java problems automatically fall back to the previous
  full-program stdin/stdout comparison (deriving argument types from
  JSON alone isn't reliable in Java without knowing the method
  signature) — their own `import java.util.*;`-style imports at the top
  of the file are unaffected either way.
- **Answer verification** (`aiGeneratorController.js`) now runs the AI's
  own reference solution through this exact harness before saving a
  generated problem, so the "answer key" test cases are graded against
  is a verified real result, not an LLM's guess.
- **JDoodle version upgrade**: `LANGUAGE_MAP` in `judge.js` now uses
  `versionIndex: "0"` for every language instead of old hardcoded
  indexes — JDoodle's `"0"` always points at that language's latest
  supported runtime, so imports / standard library features that didn't
  exist in the previously pinned older versions now work.
- **Admin problem form** (`ProblemForm.jsx`) — added an "Entry Point"
  field, and relabeled test case inputs as "Arguments (JSON array)" /
  "Expected Return (JSON)". `ViewProblemModal.jsx` shows whether a
  problem is using function-call grading or the legacy fallback.
- Fully backward compatible: any existing problem with no `entryPoint`
  set keeps working exactly as before (raw stdin/stdout comparison).

**Note:** I couldn't execute an end-to-end JDoodle call to verify this
in my environment (JDoodle's API isn't reachable from my sandbox's
network egress), so the harness generation itself is unit-tested but
the live grading path is worth a quick manual test on your end — create
one AI-generated problem and submit a correct + incorrect solution in a
session to confirm both the pass and fail cases look right.
