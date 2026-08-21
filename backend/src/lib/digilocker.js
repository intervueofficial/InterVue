import crypto from "crypto";
import { ENV } from "./env.js";

/**
 * DigiLocker OAuth 2.0 (Authorization Code) integration.
 *
 * Why DigiLocker instead of just collecting an Aadhaar number: private
 * platforms are legally barred from directly collecting/storing raw
 * Aadhaar numbers (Aadhaar Act, 2016) unless licensed as a UIDAI
 * AUA/KUA — that license is meant for banks/telecom, not a hiring
 * platform. DigiLocker sidesteps this entirely: the candidate
 * authenticates directly with UIDAI/DigiLocker (Aadhaar + OTP, on
 * their servers, not ours), and we only ever receive a masked,
 * pre-verified identity record back — never the number itself.
 *
 * Free to set up for a project: DigiLocker's "Requester Partner"
 * program has a self-serve developer sandbox at
 * https://partners.apisetu.gov.in/signup — sign up with just an email
 * + phone number, no company/GST/incorporation documents required.
 * See ../../IDENTITY_VERIFICATION_SETUP.md for the full walkthrough.
 *
 * These endpoints follow the public DigiLocker "Authorized Partner API"
 * spec (OAuth2 authorize -> token -> pull-document flow). By default
 * DIGILOCKER_BASE_URL points at the free sandbox; swap it for the
 * production DigiLocker URL if/when you register as a full production
 * partner later — nothing else in this file needs to change.
 */

const authorizeEndpoint = () => `${ENV.DIGILOCKER_BASE_URL}/public/oauth2/1/authorize`;
const tokenEndpoint = () => `${ENV.DIGILOCKER_BASE_URL}/public/oauth2/1/token`;
// Pulls the UIDAI-signed e-Aadhaar record for the user who just
// authenticated — this is the "document fetch" step of the partner API.
const aadhaarEndpoint = () => `${ENV.DIGILOCKER_BASE_URL}/public/oauth2/2/xml/eaadhaar`;

export const isDigiLockerConfigured = () =>
  ENV.DIGILOCKER_MOCK_MODE ||
  Boolean(
    ENV.DIGILOCKER_CLIENT_ID &&
      ENV.DIGILOCKER_CLIENT_SECRET &&
      ENV.DIGILOCKER_REDIRECT_URI &&
      ENV.DIGILOCKER_BASE_URL
  );

export function buildAuthorizeUrl(state) {
  if (ENV.DIGILOCKER_MOCK_MODE) {
    // No real organization/partner access needed — send the user to a
    // same-origin mock consent screen (frontend/src/pages/MockDigiLocker.jsx)
    // that exercises the identical hash + duplicate-blocking logic with
    // fake data, instead of a real DigiLocker OAuth round-trip.
    const base = (ENV.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    return `${base}/mock-digilocker?state=${encodeURIComponent(state)}`;
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: ENV.DIGILOCKER_CLIENT_ID,
    redirect_uri: ENV.DIGILOCKER_REDIRECT_URI,
    state,
  });

  return `${authorizeEndpoint()}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: ENV.DIGILOCKER_CLIENT_ID,
    client_secret: ENV.DIGILOCKER_CLIENT_SECRET,
    redirect_uri: ENV.DIGILOCKER_REDIRECT_URI,
  });

  const response = await fetch(tokenEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`DigiLocker token exchange failed (${response.status}): ${text}`);
  }

  return response.json(); // { access_token, token_type, digilockerid, ... }
}

export async function fetchAadhaarRecord(accessToken) {
  const response = await fetch(aadhaarEndpoint(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`DigiLocker Aadhaar fetch failed (${response.status}): ${text}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  if (contentType.includes("json")) {
    return parseAadhaarJson(JSON.parse(raw));
  }
  return parseAadhaarXml(raw);
}

// Field names can vary slightly depending on which DigiLocker gateway
// you register with — adjust the lookups below to match a real
// sandbox response the first time you test this end-to-end.
function parseAadhaarJson(data) {
  return {
    name: data.name || data.Poi?.name || "",
    dob: data.dob || data.Poi?.dob || "",
    gender: data.gender || data.Poi?.gender || "",
    last4: String(data.adhaar_last4 || data.uid || data.aadhaar || "").slice(-4),
  };
}

function extractXmlAttr(xml, tag, attr) {
  const match = xml.match(new RegExp(`<${tag}[^>]*\\b${attr}="([^"]*)"`, "i"));
  return match ? match[1] : "";
}

// UIDAI/DigiLocker e-Aadhaar XML carries identity fields as attributes
// on a <Poi>/<UidData>-style node. This is a best-effort generic
// extractor — same caveat as above re: exact tag names.
function parseAadhaarXml(xml) {
  const uidMatch = xml.match(/uid="(\d{4})(?:\d{0,8})?"/i) || xml.match(/(\d{4})<\/Uid>/i);

  return {
    name: extractXmlAttr(xml, "Poi", "name") || extractXmlAttr(xml, "UidData", "name"),
    dob: extractXmlAttr(xml, "Poi", "dob") || extractXmlAttr(xml, "UidData", "dob"),
    gender: extractXmlAttr(xml, "Poi", "gender"),
    last4: uidMatch ? uidMatch[1] : "",
  };
}

/**
 * A one-way SHA-256 fingerprint of the verified identity. This — not
 * the Aadhaar number itself — is what gets stored and uniquely
 * indexed, so the same person can never complete verification on a
 * second account: their second attempt produces the exact same hash,
 * which collides with the unique index on
 * User.identityVerification.aadhaarHash.
 */
export function computeAadhaarHash({ name, dob, last4 }) {
  const normalizedName = (name || "").trim().toLowerCase().replace(/\s+/g, " ");
  const normalizedDob = (dob || "").trim();
  const payload = `${normalizedName}|${normalizedDob}|${last4 || ""}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

const STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * DigiLocker's callback redirects the user's raw browser (no
 * Authorization header) — so we can't use protectRoute there. Instead
 * we sign the initiating user's clerkId into the OAuth `state` param
 * and verify the signature + expiry when it comes back, the same way
 * a CSRF/session token would work.
 */
export function signState(clerkId) {
  const payload = `${clerkId}.${Date.now()}`;
  const secret = ENV.JWT_SECRET || "intervue-digilocker-state-fallback";
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyState(state) {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;

    const [clerkId, timestamp, signature] = parts;
    const secret = ENV.JWT_SECRET || "intervue-digilocker-state-fallback";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${clerkId}.${timestamp}`)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    if (Date.now() - Number(timestamp) > STATE_TTL_MS) return null;

    return clerkId;
  } catch {
    return null;
  }
}
