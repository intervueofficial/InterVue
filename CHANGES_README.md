# Bug Fix + AI Performance Report — File Manifest

Extract into your project root, overwriting existing files.

## Bug fix
- **frontend/src/components/SessionDecisionModal.jsx** — the decision popup
  was `z-[100]`, but the AI proctoring overlay (canvas + HUD) uses
  `z-index: 9990`/`9998` and is `position: fixed`, so it painted on top of
  the modal. Raised to `z-[10050]` so it's always on top regardless of
  what else is running in the session.

## New feature: AI-generated performance report
When an interviewer makes a **final** decision (Select/Hire or Reject —
not Wait) with feedback, the system now:
1. Pulls real session data: quiz score, coding test pass-rate, and a
   proctoring-based engagement score
2. Sends those numbers + the interviewer's feedback to an AI model
   (reusing your existing OpenRouter setup, same fallback models) to
   generate a narrative summary
3. Builds a real PDF report from all of this
4. **Attaches the PDF to the hire/reject email** sent to the candidate
5. **Shows the same report in the candidate's Results page**, with a
   "Download Report (PDF)" button

### How "Coding Skills" is measured (this required new plumbing)
There was no persisted way to know how well a candidate's code actually
did — code execution was previously one-shot with no test-case grading.
Added:
- **Submit for Grading** button in the code editor (next to Run Code) —
  runs the candidate's code against *every* test case on the active
  problem (via a new `stdin` passthrough to the execution API) and
  reports pass/total
- This result is persisted on the Session (`codeResult: { passed, total }`)
  and is what feeds the "Coding Skills" score in the report

### How "Confidence / Engagement" is measured
This is a simple, explainable heuristic — **not** a scientific or
biometric measure — built from your existing proctoring violation log:
`confidenceScore = max(0, 100 − violations × 8)`. Fewer attention flags
during the session → higher score. This is stated plainly in the PDF's
footer disclaimer so it's never presented as more authoritative than it is.

### How "Quiz Accuracy" is measured
Uses the quiz score your app already persists on the Session
(`quizResult.score / quizResult.total`) — no new plumbing needed there.

## Files changed

**Backend:**
- `models/Session.js` — added `codeResult` and `performanceReport` fields
- `controllers/sessionController.js` — added `submitCodeResult` (candidate
  persists their test-case pass rate) and `downloadPerformanceReport`
  (serves the stored PDF, access-controlled to candidate/interviewer/admin)
- `routes/sessionRoute.js` — wired `PATCH /:id/code-result`,
  `GET /:id/report`; excluded the heavy PDF blob from the recent-sessions
  list query
- `routes/executeRoute.js` — added `stdin` passthrough to JDoodle so code
  can run against a specific test-case input
- `controllers/applicationController.js` — `submitDecision` now generates
  the report and attaches it to hire/reject emails. **Fully non-blocking**:
  if AI generation or PDF creation fails for any reason, it's logged and
  the decision + email still goes through, just without an attachment
- `lib/resend.js` — `sendHiredEmail`/`sendRejectionEmail` accept an
  optional `reportAttachment`
- **NEW** `utils/generatePerformanceSummary.js` — calls your existing
  OpenRouter setup to generate the AI narrative; never throws, always
  returns usable fallback text if every model fails
- **NEW** `utils/generatePerformancePdf.js` — builds the actual PDF via
  `pdfkit`. I generated and visually verified a test PDF — layout is clean
- `package.json` — added `pdfkit`

**Frontend:**
- `lib/piston.js` — `executeCode` now accepts an optional `input` (stdin)
- `api/sessions.js` — added `submitCodeResult` and `downloadReport`
- `hooks/useSessions.js` — added `useSubmitCodeResult`
- `components/CodeEditorPanel.jsx` — added "Submit for Grading" button +
  pass/total badge
- `components/session/CandidateLayout.jsx` — forwards grading props through
- `pages/SessionPage.jsx` — `handleSubmitForGrading` runs code against
  every test case and persists the result
- `pages/candidate/Results.jsx` — shows the AI summary, 3 score bars
  (coding/quiz/confidence), and a working PDF download button on any
  session that has a generated report

## Setup required
1. `cd backend && npm install` (pulls in `pdfkit`)
2. Make sure `OPENROUTER_API_KEY` is already set (your team's existing
   "Create with AI" feature already needs this — no new env var required)
3. Restart both servers

## What I verified here
- All backend files pass `node --check` (syntax valid)
- **Actually generated a real PDF** with `pdfkit` and visually confirmed
  layout via rendering — not just code review
- Frontend builds cleanly (`vite build` succeeds) with every change in place
- I could NOT test the actual OpenRouter call or a full end-to-end hire
  decision from this sandbox (no network access to OpenRouter, no real
  Mongo/Clerk/Stream credentials) — your first real test should be:
  create a job → candidate applies, gets shortlisted → do a mock interview
  (submit a quiz, submit code for grading) → interviewer selects them with
  feedback → confirm the email arrives with a PDF attached, and the report
  shows up on the candidate's Results page.
