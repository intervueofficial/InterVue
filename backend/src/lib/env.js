import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const ENV = {
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  STREAM_API_KEY: process.env.STREAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_REPLY_TO: process.env.RESEND_REPLY_TO,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // ==========================
  // Identity Verification (DigiLocker)
  // ==========================
  // Free self-serve registration (no company/GST docs needed) at
  // https://partners.apisetu.gov.in/signup — see
  // backend/IDENTITY_VERIFICATION_SETUP.md for the full walkthrough.
  DIGILOCKER_CLIENT_ID: process.env.DIGILOCKER_CLIENT_ID,
  DIGILOCKER_CLIENT_SECRET: process.env.DIGILOCKER_CLIENT_SECRET,
  DIGILOCKER_REDIRECT_URI: process.env.DIGILOCKER_REDIRECT_URI,
  // Base URL of whichever DigiLocker "Requester" gateway you register
  // with (API Setu sandbox by default). Swap for production DigiLocker
  // once/if you register as a full partner later.
  DIGILOCKER_BASE_URL:
    process.env.DIGILOCKER_BASE_URL || "https://digilocker.meripehchaan.gov.in",
  // Off by default so the app keeps working out of the box before
  // DigiLocker credentials are configured. Set to "true" once you've
  // registered and tested the flow, to actually block job applications
  // from unverified candidates.
  REQUIRE_IDENTITY_VERIFICATION: process.env.REQUIRE_IDENTITY_VERIFICATION === "true",
  // For student/group projects without a registered organization:
  // real DigiLocker "Requester" partner access requires a formal org
  // (incorporation date, official domain email, etc.) that a college
  // project usually doesn't have. Setting this to "true" swaps in a
  // local mock consent screen that exercises the exact same
  // hash + unique-index duplicate-blocking logic, with fake data
  // instead of a real DigiLocker OAuth round-trip. See
  // backend/IDENTITY_VERIFICATION_SETUP.md.
  DIGILOCKER_MOCK_MODE: process.env.DIGILOCKER_MOCK_MODE === "true",
};