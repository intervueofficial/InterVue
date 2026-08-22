# Identity Verification (Live Aadhaar Camera Scan) — Reference

## What this solves

Email/phone uniqueness alone can't stop a candidate from creating
unlimited accounts (new email = new account) and applying to the same
job multiple times hoping one gets shortlisted. This feature adds a
one-time **Aadhaar card scan** step on the candidate's Profile page.
The candidate opens their device camera (gallery upload is not
allowed — see `AadhaarCameraCapture` behavior in
`IdentityVerificationCard.jsx`), captures a live photo of their
physical Aadhaar card, and the backend OCRs it to extract:

- **Name** — locked to the account from then on
- **Date of birth** — locked to the account from then on
- **Aadhaar number** — never stored raw, only a one-way SHA-256 hash,
  uniquely indexed in MongoDB so the same identity can never verify a
  second account

**Phone is the one exception** — it's not on the card in a form OCR
can reliably read, so it stays a manual, editable field.

A candidate cannot apply to any job until `candidateProfile.isComplete`
is true, and that now requires identity verification in addition to
the existing education/skills fields (see `authController.js`).

## How it works end to end

1. Candidate clicks **"Scan Aadhaar Card"** on Profile →
   `IdentityVerificationCard.jsx` opens a live camera view via
   `getUserMedia` (no `<input type="file">` anywhere in this flow).
2. Candidate captures a frame → `POST /api/identity/verify/scan` sends
   the captured JPEG (base64) to the backend.
3. `identityVerificationController.scanAadhaar` runs OCR
   (`lib/aadhaarOcr.js`, via `tesseract.js`) and returns the extracted
   `{ name, dob, aadhaarNumber, aadhaarNumberValid, otherCandidates }`
   — **nothing is saved yet**.
4. The frontend shows a review screen with those fields in **editable**
   inputs, because OCR on a phone photo of a card is genuinely
   error-prone (glare, tilt, worn cards, mixed-script text) — the
   candidate confirms or corrects them.
5. Candidate clicks **Confirm & Verify** →
   `POST /api/identity/verify/confirm` with the (possibly corrected)
   fields. The backend validates the Aadhaar number's **Verhoeff
   checksum** (the same check-digit algorithm UIDAI itself uses), hashes
   it, and checks the hash against every other user's
   `identityVerification.aadhaarHash`.
6. If it's new → saved, `user.name` is locked to the verified name, and
   `candidateProfile.isComplete` is re-evaluated.
   If it's a duplicate → rejected with
   `"This Aadhaar is already linked to another InterVue account."`

## Why OCR extraction is imperfect, and how the code compensates

Reading a government ID off a phone-camera photo is not as reliable as
a cryptographically-signed API response would be. Specific mitigations
already built in:

- **Verhoeff checksum validation** (`isValidAadhaarChecksum` in
  `lib/aadhaarOcr.js`) — an OCR misread of the 12-digit number will
  fail this check with overwhelming probability, so a bad read is
  caught before it can be saved as someone's permanent identity.
- **Mandatory human review step** — `scanAadhaar` never saves anything;
  the candidate always sees and can edit the extracted fields before
  `confirmVerification` commits them.
- **Multiple digit-run candidates surfaced** — if OCR finds more than
  one 12-digit run on the card (e.g. it also picked up a VID or another
  printed number), all candidates are returned so the review screen can
  show them as a hint.

None of this guarantees a perfect read every time — if OCR performs
badly in your testing environment (poor lighting, low-end webcam), that
shows up as the candidate needing to hand-correct fields on the review
screen, not as a silent bad save.

## What's implemented in the codebase

- `backend/src/lib/aadhaarOcr.js` — OCR extraction (name/DOB/Aadhaar
  number), Verhoeff checksum validation, and the one-way hash function.
- `backend/src/controllers/identityVerificationController.js` +
  `backend/src/routes/identityRoute.js` — `GET /api/identity/status`,
  `POST /verify/scan` (OCR only), `POST /verify/confirm` (saves).
- `backend/src/models/User.js` — `identityVerification` subdocument
  with a **unique + sparse index** on `aadhaarHash` — the actual DB
  constraint that blocks a duplicate identity, plus a race-condition
  safety net in `confirmVerification` (duplicate key error → same
  rejection, in case two verifications land concurrently).
- `backend/src/middleware/protectRoute.js` — stops syncing `user.name`
  from Clerk once identity is verified, so the locked verified name
  can't be silently overwritten on a later request.
- `backend/src/controllers/authController.js` — `candidateProfile.isComplete`
  requires identity verification in addition to the existing
  education/skills fields.
- `backend/src/controllers/applicationController.js` — `applyToJob`
  blocks any candidate whose profile isn't complete, which now
  includes verification.
- `frontend/src/components/IdentityVerificationCard.jsx` — the camera
  capture + review/confirm UI, shown on the candidate's Profile page.
- `frontend/src/pages/candidate/Profile.jsx` — Name and DOB render as
  locked, read-only fields once verified; the profile-completeness
  meter includes verification.
- `frontend/src/pages/candidate/Jobs.jsx` — Apply button/banner is
  gated on profile completeness (which includes verification).

## Local testing notes

- `getUserMedia` requires a secure context — `localhost` is fine, but
  testing from another device on your network needs HTTPS or it'll be
  blocked by the browser.
- OCR runs server-side via `tesseract.js`; the first request after a
  server restart will be slightly slower while it initializes.
- No environment variables are required for this feature — there's no
  mock/real mode split anymore, since OCR runs the same way in every
  environment.
