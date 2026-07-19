# Job Posting / Application / Eligibility Feature — File Manifest

Extract this zip **into your project root** (`InterVue-InterVuePro/`), overwriting
existing files. Folder structure matches your repo exactly, so files land in
the right place.

## NEW files
- backend/src/models/Job.js
- backend/src/models/Application.js
- backend/src/lib/resend.js
- backend/src/utils/checkEligibility.js
- backend/src/controllers/jobController.js
- backend/src/controllers/applicationController.js
- backend/src/routes/jobRoute.js
- backend/src/routes/applicationRoute.js
- frontend/src/api/jobApi.js
- frontend/src/api/applicationApi.js
- frontend/src/pages/admin/JobForm.jsx
- frontend/src/pages/admin/Jobs.jsx
- frontend/src/pages/candidate/Profile.jsx
- frontend/src/pages/candidate/Jobs.jsx
- frontend/src/pages/interviewer/Applicants.jsx

## MODIFIED files (overwrite the existing ones)
- backend/src/models/User.js — added `candidateProfile` subdocument
- backend/src/lib/env.js — added RESEND_API_KEY / RESEND_FROM_EMAIL
- backend/src/controllers/authController.js — added `updateCandidateProfile`
- backend/src/routes/authRoute.js — added PATCH /auth/profile
- backend/src/server.js — mounted /api/jobs and /api/applications
- backend/package.json — added "resend" dependency
- frontend/src/api/auth.js — added `updateProfile` method
- frontend/src/components/AppShell.jsx — added Jobs/Applicants/Profile nav links
- frontend/src/App.jsx — added new routes

## After extracting
1. `cd backend && npm install` (installs the new `resend` package)
2. Add to `backend/.env`:
   ```
   RESEND_API_KEY=your_resend_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
3. `cd frontend && npm install` (no new frontend deps, but safe to re-run)
4. Test flow: Admin → Jobs → post a job → Candidate → Profile → fill in →
   Jobs Board → Apply → Interviewer → Applicants → Select → check candidate email
