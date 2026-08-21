# Identity Verification (DigiLocker) — Setup Guide

## What this solves

Email/phone uniqueness alone can't stop a candidate from creating
unlimited accounts (new Gmail = new account). This feature adds a
one-time **"Verify with DigiLocker"** step on the candidate's Profile
page. The candidate authenticates directly against UIDAI (Aadhaar +
OTP, on the government's own servers), and we only ever receive a
masked, pre-verified identity record back — never the raw Aadhaar
number, only a one-way hash of it, uniquely indexed in MongoDB so the
same identity can never verify a second account.

## Two ways to run this: Mock mode vs. real DigiLocker

**If you don't have a registered organization (most group/college
projects), use Mock Mode — it's ready to go right now, no signup, no
approval, fully free, and demonstrates the real feature.**

Real DigiLocker "Requester" partner access (the production OAuth
integration) requires representing a registered organization — a date
of incorporation, an official domain email, etc. That's a genuine
requirement of the government portal, not something a standalone
student project can self-serve around. Mock Mode exists specifically
for this situation.

---

## Option A — Mock Mode (recommended for a college project)

### What it is

A local, same-origin "consent screen" that stands in for DigiLocker's
real UI. The person enters a name, DOB, and a 12-digit number (openly
labeled as fake/demo data — nothing real is sent anywhere). The
backend then runs the **exact same** duplicate-blocking logic as the
real integration would: hash `(name + DOB + last 4 digits)`, check it
against the unique index, reject if it's already used.

This means the actual feature you're being graded/reviewed on — "one
verified identity can only ever back one account" — is **fully real
and demoable**, even though the identity data itself is self-reported
rather than pulled from UIDAI.

### Setup (2 minutes)

In `backend/.env`:

```env
DIGILOCKER_MOCK_MODE=true
```

That's it — restart the backend. No other DIGILOCKER_* vars are
needed in this mode.

### How to demo it

1. Log in as a candidate, go to **My Profile** → click
   **"Verify with DigiLocker."**
2. You'll land on `/mock-digilocker` — a consent-style screen clearly
   labeled **"MOCK / DEMO ENVIRONMENT."**
3. Enter any name, DOB, and any 12 digits → **Approve & Continue.**
4. You're redirected back to Profile, now showing "Verified via
   DigiLocker."
5. **To demonstrate the actual duplicate-block:** log in as a
   *second* candidate account and repeat the same 12 digits + same
   name + DOB. It will correctly come back as
   **"This identity is already linked to another InterVue account"**
   — that's the unique index on `User.identityVerification.aadhaarHash`
   doing its job.

### For your project report

You can honestly describe this as: *"Integrated against the real
DigiLocker OAuth2 Authorized-Partner API specification end-to-end
(`backend/src/lib/digilocker.js`), with a mock identity provider
substituted for the actual government consent screen, since production
partner access requires a registered organization that a standalone
student project doesn't have. The duplicate-account prevention logic
itself — hashing and uniquely indexing the verified identity — is
fully functional and independent of which provider supplies the
identity data."*

---

## Option B — Real DigiLocker (only if you later get organizational access)

If your college/institution is willing to register (e.g. your
department wants this live for a real deployment later), here's the
real path — verified current URLs as of writing:

1. **Free developer account** (no org needed for this step):
   `https://partners.apisetu.gov.in/signup` — sign up with an email +
   phone.
2. **Public sandbox playground** (test against mock data, no approval
   wait): `https://sandbox.api-setu.in/` → DigiLocker → "Try in
   Sandbox."
3. **Full production Requester registration** (does require a real
   organization — incorporation date, official domain email, manual
   approval): `https://www.digilocker.gov.in/web/partners/requesters`

If you complete registration and get real `client_id`/`client_secret`,
set:

```env
DIGILOCKER_MOCK_MODE=false
DIGILOCKER_CLIENT_ID=your_client_id
DIGILOCKER_CLIENT_SECRET=your_client_secret
DIGILOCKER_REDIRECT_URI=http://localhost:5001/api/identity/verify/callback
DIGILOCKER_BASE_URL=https://digilocker.meripehchaan.gov.in
```

Nothing else changes — `lib/digilocker.js` and the controller already
branch on `DIGILOCKER_MOCK_MODE`, so flipping it swaps the whole flow
from mock to real without touching any other code.

> **Field-name caveat**: the exact JSON/XML field names DigiLocker
> returns can vary slightly by gateway. `parseAadhaarJson` /
> `parseAadhaarXml` in `lib/digilocker.js` are written defensively, but
> sanity-check them against a real sandbox response the first time you
> test end-to-end.

---

## Turning enforcement on (either mode)

Once you're happy with testing (mock or real), set:

```env
REQUIRE_IDENTITY_VERIFICATION=true
```

From then on, unverified candidates see a "Verify Identity" prompt
instead of an Apply button on the Jobs board, and
`POST /api/applications/:jobId/apply` rejects them with
`code: "IDENTITY_NOT_VERIFIED"`.

Leave it `false`/unset any time you want the app to work normally
without this gate — nothing else in the app depends on it.

## What's already wired up in the codebase

- `backend/src/lib/digilocker.js` — OAuth2 client + mock-mode
  branching + the identity hash function.
- `backend/src/controllers/identityVerificationController.js` +
  `backend/src/routes/identityRoute.js` — `/api/identity/status`,
  `/verify/start`, `/verify/callback` (real), `/verify/mock-submit`
  (mock).
- `backend/src/models/User.js` — `identityVerification` subdocument
  with a **unique + sparse index** on `aadhaarHash` — the actual DB
  constraint that blocks a duplicate identity.
- `frontend/src/components/IdentityVerificationCard.jsx` — shown on
  the candidate's Profile page.
- `frontend/src/pages/MockDigiLocker.jsx` — the mock consent screen.
- `frontend/src/pages/candidate/Jobs.jsx` — Apply button/banner is
  identity-gated once `REQUIRE_IDENTITY_VERIFICATION=true`.
- `backend/src/controllers/applicationController.js` — `applyToJob`
  blocks unverified candidates once enabled.
