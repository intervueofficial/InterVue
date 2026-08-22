import crypto from "crypto";
import { ENV } from "./env.js";

const authorizeEndpoint = () => `${ENV.DIGILOCKER_BASE_URL}/public/oauth2/1/authorize`;
const tokenEndpoint = () => `${ENV.DIGILOCKER_BASE_URL}/public/oauth2/1/token`;

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

  return response.json(); 
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

function parseAadhaarXml(xml) {
  const uidMatch = xml.match(/uid="(\d{4})(?:\d{0,8})?"/i) || xml.match(/(\d{4})<\/Uid>/i);

  return {
    name: extractXmlAttr(xml, "Poi", "name") || extractXmlAttr(xml, "UidData", "name"),
    dob: extractXmlAttr(xml, "Poi", "dob") || extractXmlAttr(xml, "UidData", "dob"),
    gender: extractXmlAttr(xml, "Poi", "gender"),
    last4: uidMatch ? uidMatch[1] : "",
  };
}

export function computeAadhaarHash({ name, dob, last4 }) {
  const normalizedName = (name || "").trim().toLowerCase().replace(/\s+/g, " ");
  const normalizedDob = (dob || "").trim();
  const payload = `${normalizedName}|${normalizedDob}|${last4 || ""}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

const STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes

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
