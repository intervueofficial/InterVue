# Branded Loader + Dashboard Upgrades — File Manifest

Extract into your project root, overwriting existing files.

## New branded loader (replaces every plain circular spinner)
**NEW:** `frontend/src/components/AppLoader.jsx` — a self-contained SVG
recreation of the InterVue mark (rounded blue-gradient square with a
white checkmark), animated with a gentle breathing pulse plus a looping
"draw-in and fade" animation on the checkmark. No image file needed —
pure SVG + CSS, so it can't break from a missing asset.

Swapped in everywhere the app used the plain daisyUI
`loading loading-spinner` circle:
- `App.jsx` — both full-app boot loaders (the ones you saw on
  `intervue.site`'s blank loading screen)
- `pages/MockInterviewPage.jsx`
- `pages/ProblemPage.jsx`
- `pages/ProblemsPage.jsx`
- `pages/QuizePage.jsx`
- `pages/Sessions.jsx`
- `pages/admin/Analytics.jsx`
- `pages/admin/ProblemTable.jsx`
- `pages/admin/QuizTable.jsx`

**Scope note:** I left the small inline spinners inside buttons (e.g.
"Saving...", "Submitting...") as-is — those are conventionally tiny and
swapping them for the full logo mark would look oversized/odd at 14-16px.
If you want those swapped too, say the word and I'll add a compact
variant of `AppLoader` sized for buttons.

## Dashboard upgrades (requested separately, bundled here since both touch loading states)
- `pages/DashboardPage.jsx` (interviewer dashboard — this is the file
  your route actually imports, NOT `pages/Dashboard.jsx`) — added a
  second stats row (This Week, Avg Quiz Score, Code Submissions, Reports
  Generated), a Recent Activity feed, a Signal Snapshot progress panel,
  and expanded Quick Links (Applicants, Waitlist). Every section has its
  own YouTube-style shimmer skeleton shown independently while its data
  loads.
- `pages/candidate/Dashboard.jsx` — same treatment for the candidate
  view: added Applications Submitted / Offers / Avg Coding Score / Profile
  Status stats, a My Applications activity feed, a Readiness Snapshot
  panel (quiz + coding score bars), a profile-incomplete banner, and
  expanded Quick Links (added Jobs Board, My Profile).
- `pages/candidate/CandidateDashboardLoading.jsx` — full-page skeleton
  updated to match the new sections (secondary stats row, activity feed,
  readiness panel) with the existing staggered fade-in.

## What I verified
- Frontend builds cleanly (`vite build` succeeds) with all files in place
- Confirmed **zero** remaining `loading loading-spinner` instances anywhere
  in the codebase (`grep` came back empty)
- Rendered the new loader's SVG to a PNG and visually confirmed it reads
  clearly as a blue rounded-square checkmark, matching your logo's style
- Caught and fixed two import-placement bugs from an automated find/replace
  pass (misplaced import statements inside multi-line lucide-react imports
  in `Analytics.jsx`, `ProblemTable.jsx`, `QuizTable.jsx`) before finalizing

## Setup required
None — no new dependencies, just drop these files in and restart the
frontend dev server / redeploy.
