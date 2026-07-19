# Post-Interview Decision (Select / Reject / Wait) — File Manifest

Extract into your project root, overwriting existing files.

## NEW files
- backend/src/routes/applicationRoute.js is MODIFIED (see below), not new
- frontend/src/components/SessionDecisionModal.jsx — the popup shown right after the interviewer ends a session
- frontend/src/pages/interviewer/Waitlist.jsx — page to Approve/Reject candidates parked on wait

## MODIFIED files
- backend/src/models/Application.js — added `finalDecision` (pending/hired/rejected/waitlisted), `feedback`, `decidedBy`, `decidedAt`, and a `decisionHistory[]` audit trail
- backend/src/lib/resend.js — `sendRejectionEmail` now accepts optional `feedback`; added new `sendHiredEmail` template
- backend/src/controllers/applicationController.js — added:
  - `getApplicationBySession(sessionId)` — looks up the application tied to a session
  - `submitDecision(id)` — records hired/rejected/waitlisted + feedback, sends the right email (waitlisted sends no email)
  - `getWaitlist()` — lists all currently-waitlisted applications
- backend/src/routes/applicationRoute.js — added:
  - `GET /applications/by-session/:sessionId`
  - `PATCH /applications/:id/decision`
  - `GET /applications/waitlist`
- frontend/src/api/applicationApi.js — added matching API methods
- frontend/src/components/VideoCallUI.jsx — when the **host** (interviewer) ends a call, it now checks if the session came from a job application. If so, it shows `SessionDecisionModal` (Select / Reject / Wait + feedback) before navigating away. Sessions with no linked application behave exactly as before.
- frontend/src/components/AppShell.jsx — added "Waitlist" nav link for interviewer
- frontend/src/App.jsx — added `/waitlist` route

## How it works end-to-end
1. Interviewer finishes a job-linked interview and clicks "Leave/End Call".
2. If this session is tied to a job Application, a modal pops up: **Select / Reject / Wait**, with a feedback textarea.
3. **Select** → candidate's `finalDecision` = hired, hiring email sent (with feedback included if provided).
4. **Reject** → `finalDecision` = rejected, rejection email sent (with feedback if provided).
5. **Wait** → `finalDecision` = waitlisted, **no email sent**, candidate shows up in **Interviewer → Waitlist**.
6. From the Waitlist page, the interviewer can Approve or Reject at any time later, entering feedback at that moment — this triggers the same hire/reject email.
7. Every decision (including repeat visits from the waitlist) is logged in `decisionHistory` for a full audit trail.

## After extracting
No new dependencies — just drop the files in and restart both servers.
