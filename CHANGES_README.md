# AI Report → History Page + Letteric Ratings — File Manifest

This is a **full, drop-in replacement zip** — extract into your project
root, overwriting existing files. No files were removed from the repo;
only edited/added ones are listed below.

## 1. AI performance-report PDF is no longer emailed to candidates
The hired/rejected candidate emails used to attach an AI-generated
performance-report PDF. That attachment is now removed — candidates get
the same clean email template (subject/body still fully editable from
Admin → Email Templates) with no PDF attached.

- `backend/src/lib/resend.js` — `sendHiredEmail` / `sendRejectionEmail`
  no longer accept or attach `reportAttachment`. (The low-level `send()`
  wrapper still technically supports attachments generically, in case
  you need them for something else later — it's just never populated
  by these two functions anymore.)
- `backend/src/controllers/applicationController.js` —
  `generateAndAttachPerformanceReport` renamed to
  `generatePerformanceReport`. It still generates the PDF + AI summary
  and saves them onto the `Session` document (so History has something
  to show), it just no longer returns an email-attachment object, and
  `submitDecision` no longer passes one to the email functions.

## 2. New "History" page (Interviewer + Admin only)
A dedicated page listing every **completed** interview session in a
table: candidate (photo/name/email), role applied for, interviewer
(admin view only), date, final decision (Hired/Rejected/Waitlisted),
the AI report's ratings, and actions to view full candidate profile or
download the PDF report.

- `frontend/src/components/InterviewHistory.jsx` — **NEW.** Shared
  table + profile modal, used by both scopes below.
- `frontend/src/pages/admin/History.jsx` — **NEW.** Thin wrapper,
  routed at `/admin/history`.
- `frontend/src/pages/interviewer/History.jsx` — **NEW.** Thin wrapper,
  routed at `/history`.
- `frontend/src/components/AppShell.jsx` — added a "History" sidebar
  link (Archive icon) to both the Admin and Interviewer nav groups.
- `frontend/src/App.jsx` — registered the two new routes, each gated to
  its role like every other route in the app.
- `frontend/src/api/sessions.js` — added `sessionApi.getHistory()`.
- `backend/src/controllers/sessionController.js` — added
  `getSessionHistory`, scoped so interviewers only see sessions they
  ran and admins see everything platform-wide. Joins each session back
  to its `Application` (if any) for job title / decision / profile
  snapshot.
- `backend/src/routes/sessionRoute.js` — added
  `GET /api/sessions/history` (admin + interviewer only), registered
  *before* the existing `GET /:id` route so it isn't swallowed by the
  `:id` param matcher.
- Downloading the PDF from the History table reuses the existing
  `GET /api/sessions/:id/report` endpoint — no backend changes needed
  there, it already authorizes interviewers/admins/the candidate
  themselves.

## 3. Percentages replaced with letteric ratings in the AI report
Everywhere the AI-generated report showed a raw `%` for coding, quiz,
or confidence/engagement, it now shows a plain-language rating instead:

**Worst → Good → Better → Best → Excellent** (ascending, 5 tiers across
0–100).

- `backend/src/utils/ratingScale.js` — **NEW.** `scoreToRating(score)`,
  the single source of truth for the tier thresholds.
- `backend/src/utils/generatePerformancePdf.js` — the PDF's "Scores"
  section (now "Ratings") prints the colored rating word instead of
  `NN%` for all three metrics.
- `frontend/src/utils/rating.js` — **NEW.** Frontend mirror of the same
  thresholds, plus a color lookup for badges.
- `frontend/src/components/RatingBadge.jsx` — **NEW.** Small reusable
  pill badge component for a rating.
- `frontend/src/pages/candidate/Results.jsx` — the candidate's own "AI
  Performance Report" card (in their Results page, not an email) now
  shows rating badges instead of percentage bars.
- `frontend/src/components/InterviewHistory.jsx` — the History table's
  Coding/Quiz/Confidence columns and profile modal use the same badges.

Raw numeric scores are still stored in the database (`Session.performanceReport.codingScore` etc.) — only the **display** layer was changed, so nothing here is a breaking data-model change.

## What I verified
- `node --check` passes on every touched backend file (correct ESM
  syntax).
- `npm run build` (Vite) succeeds cleanly with all new/edited frontend
  files in place — zero build errors.
- Confirmed **zero** remaining references to the old
  `generateAndAttachPerformanceReport` name or `reportAttachment` param
  anywhere in the codebase.
- `/sessions/history` is registered ahead of `/sessions/:id` in the
  route file, so it won't be misrouted.

## Setup required
None — no new dependencies, no environment variable changes, no schema
migration. Just drop these files in and restart/redeploy both apps.
