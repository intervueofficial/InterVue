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

---

## Patch: resume upload fixed, profile photo no longer reverts, live profile on interviewer card

**Root causes found and fixed:**

1. **Resume upload was 404ing** — the frontend already called
   `POST /auth/profile-resume`, but that route was never registered in
   `authRoute.js`, and the controller that did exist expected the file
   under a `file` body key while the frontend sends `resume`. Fixed both:
   route is now registered, and `uploadProfileResume` reads `req.body.resume`.
2. **Profile picture kept reverting to the Clerk avatar** —
   `middleware/protectRoute.js` runs on every authenticated request and
   was unconditionally overwriting `user.profileImage` with Clerk's
   `imageUrl` any time they differed. So the moment a candidate uploaded
   a custom photo, the very next request silently reverted it. Removed
   that overwrite — Clerk's avatar is now only used once, as the default
   at first signup; from then on, the candidate's own upload (via My
   Profile) is the only thing that changes it. No more need to change it
   through a Clerk account page.
3. **Interviewer's "View Profile" card showed a stale resume/skills** —
   it only ever read `application.profileSnapshot`, frozen at the moment
   the candidate applied. `getApplicantsForJob` now also populates the
   candidate's live `candidateProfile`, and `CandidateProfileModal.jsx`
   prefers that live data over the snapshot (falling back to the
   snapshot only for fields the live profile doesn't have) — so a resume
   uploaded *after* applying still shows up correctly.

No database/schema changes were needed — `candidateProfile.resumeUrl`
already existed; this was purely a wiring/logic bug, not a missing
Cloudinary setup on your end (assuming `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are already set in
`backend/.env`, which they need to be for either upload to work).

**Also redesigned `candidate/Profile.jsx`** — hero card with a gradient
banner and overlapping avatar, a live profile-completeness meter,
sectioned cards (Background / Skills / Resume) with icons, and subtle
entrance/hover animations via `framer-motion`. All existing
save/upload logic is unchanged, just the layout.

---

## Patch: Cloudinary CDN cache invalidation on overwrite

Overwriting an existing Cloudinary `public_id` (which both the profile
photo and resume uploads do, so re-uploads replace the old file instead
of piling up) does **not** automatically clear Cloudinary's own CDN
cache. Without `invalidate: true`, the app's database correctly points
at the new file, but Cloudinary's edge servers can keep serving the old
cached version for a while regardless. Added `invalidate: true` to both
upload calls in `authController.js` (`uploadProfileImage` and
`uploadProfileResume`) so a re-upload is reflected immediately.

**Also confirmed from your screenshot:** the resume-upload 404 against
`api.intervue.site` means that deployed backend is still running the
*previous* version of the code — `/auth/profile-resume` genuinely isn't
registered there yet. This zip has the fix (same as last time), but it
needs to actually be deployed/restarted on that server for the route to
exist — pulling the new code alone via `git pull` doesn't take effect
until the Node process is restarted. The profile picture upload
succeeding in your screenshot confirms Cloudinary credentials are set up
correctly there already, so once redeployed the resume upload should
work the same way.

---

## Patch: resume upload 413 + CORS-masking-a-413 fix

Two real bugs in `backend/src/server.js`, both about how large uploads
were handled:

1. **`cors()` was registered *after* `express.json()`.** When a request
   body is too large, Express rejects it during body parsing — before
   it ever reaches the CORS middleware. So the error response went out
   with no `Access-Control-Allow-Origin` header, and the browser
   reported it as a CORS failure instead of showing the real `413`
   status. Moved `cors()` to run first, so every response — including
   error responses — carries the right headers and you see the actual
   error instead of a misleading CORS message.
2. **The JSON body limit (10mb) was smaller than a 10MB resume actually
   needs.** Base64-encoding a file inflates its size by ~37%, so a
   resume right at the app's own 10MB limit becomes ~13-14MB on the
   wire — bigger than the 10mb cap, so it always failed. Raised the
   limit to 15mb to leave real headroom.

**One thing I can't verify from here:** some hosting platforms enforce
their own request size cap independent of Express — e.g. Vercel
serverless functions hard-cap request bodies around 4.5MB no matter
what your code says, and some reverse proxies (nginx) need
`client_max_body_size` raised too. If resumes still 413 after
redeploying with this fix, check whether `api.intervue.site` is behind
one of those and whether it needs a platform-level limit increase (not
an Express one) — let me know what it's hosted on and I can point you
at the exact setting.

---

## Patch: "Solved!" popup after grading

**What changed:**

- New `frontend/src/components/session/GradingResultModal.jsx` — a
  celebratory popup shown right after "Submit for Grading" comes back
  from the server. All-tests-passed shows a green "Problem Solved!"
  state; a partial result shows amber with a per-test-case breakdown
  (input / expected / what your code actually returned) so the
  candidate can see exactly what to fix, using the same detailed
  `results` array the backend already returns from
  `submitCodeResult` (built on the AI-generated-and-verified reference
  answer + entry-point harness grading from before) — nothing new
  needed on the backend for this.
- `SessionPage.jsx` now also stores that `results` array and opens the
  popup on every submission (a fresh object each time, so back-to-back
  submissions with the same pass/total still reopen it rather than
  silently no-op).
- `CandidateLayout.jsx` renders the popup as an overlay above the whole
  session view, not just inside the code editor panel, so it's
  impossible to miss.

Dismissing the popup (✕, the footer button, or clicking outside it)
just closes it — the small "X/Y tests passed" badge next to the Submit
button (already existing) still stays up afterward as a persistent
reminder of the last result.
