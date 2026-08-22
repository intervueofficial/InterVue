import crypto from "crypto";
import { createWorker } from "tesseract.js";

const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaarChecksum(number) {
  const digits = String(number || "").replace(/\D/g, "");
  if (digits.length !== 12) return false;

  let c = 0;
  const reversed = digits.split("").reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = D[c][P[i % 8][reversed[i]]];
  }
  return c === 0;
}

function extractAadhaarCandidates(text) {
  const compact = text.replace(/[^\d\s]/g, " ");
  const runs = compact.match(/\d[\d\s]{10,16}\d/g) || [];

  const candidates = new Set();
  for (const run of runs) {
    const digits = run.replace(/\s/g, "");
    if (digits.length === 12) {
      candidates.add(digits);
    } else if (digits.length > 12) {
      for (let i = 0; i + 12 <= digits.length; i++) {
        candidates.add(digits.slice(i, i + 12));
      }
    }
  }

  return [...candidates].sort(
    (a, b) => isValidAadhaarChecksum(b) - isValidAadhaarChecksum(a)
  );
}

function extractDob(text) {
  const dobMatch = text.match(
    /(?:DOB|Date of Birth)[:\s]*([0-3]?\d[\/\-.][01]?\d[\/\-.]\d{4})/i
  );
  if (dobMatch) return dobMatch[1].replace(/[-.]/g, "/");

  const looseDateMatch = text.match(/\b([0-3]?\d[\/\-][01]?\d[\/\-](19|20)\d{2})\b/);
  if (looseDateMatch) return looseDateMatch[1].replace(/-/g, "/");

  const mergedMatch = text.match(
    /(?:DOB|Date of Birth)[:\s]*([0-3]\d)[\/\-.]?([01]\d)[\/\-.]?((?:19|20)\d{2})/i
  );
  if (mergedMatch) return `${mergedMatch[1]}/${mergedMatch[2]}/${mergedMatch[3]}`;

  const bareDigitRuns = text.replace(/[^\d\s]/g, " ").match(/\b\d{7,8}\b/g) || [];
  for (const run of bareDigitRuns) {
    const digits = run.length === 7 ? `0${run}` : run;
    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));
    const currentYear = new Date().getFullYear();
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= currentYear) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  }

  const yobMatch = text.match(/(?:Year of Birth|YoB)[:\s]*(\d{4})/i);
  if (yobMatch) return yobMatch[1];

  return "";
}

function extractName(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const noiseWords =
    /government|india|male|female|dob|date of birth|year of birth|aadhaar|uidai|unique identification|mobile/i;

  const namePattern = /[A-Z][A-Za-z.]{1,}(?:\s+[A-Z][A-Za-z.]{1,}){1,3}/g;

  const isPlausibleName = (str) => {
    if (noiseWords.test(str)) return false;
    const words = str.trim().split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;

    return words.every((w) => w.replace(/\./g, "").length >= 2);
  };

  const candidatesByLine = lines.map((line) =>
    (line.match(namePattern) || []).map((m) => m.trim()).filter(isPlausibleName)
  );

  const anchorIndex = lines.findIndex((l) => /dob|date of birth|male|female/i.test(l));
  if (anchorIndex > 0) {
    for (let i = anchorIndex - 1; i >= 0; i--) {
      if (candidatesByLine[i]?.length) {
        return candidatesByLine[i][0].replace(/\s+/g, " ").trim();
      }
    }
  }

  for (const list of candidatesByLine) {
    if (list.length) return list[0].replace(/\s+/g, " ").trim();
  }
  return "";
}

async function runOcr(dataUrl, options = {}) {
  const { pageSegMode, charWhitelist } = options;
  const worker = await createWorker("eng");
  try {
    const params = {};
    if (pageSegMode) params.tessedit_pageseg_mode = pageSegMode;
    if (charWhitelist) params.tessedit_char_whitelist = charWhitelist;
    if (Object.keys(params).length) await worker.setParameters(params);
    const { data } = await worker.recognize(dataUrl);
    return data?.text || "";
  } finally {
    await worker.terminate();
  }
}

/**
 * @param {string} dataUrl - "data:image/jpeg;base64,...." captured
 *   frame from the live camera (see AadhaarCameraCapture.jsx).
 * @returns {Promise<{name: string, dob: string, aadhaarNumber: string,
 *   aadhaarCandidates: string[], rawText: string}>}
 */
export async function extractAadhaarFields(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    throw new Error("A captured image is required.");
  }

  let rawText = await runOcr(dataUrl, { pageSegMode: "6" });
  let aadhaarCandidates = extractAadhaarCandidates(rawText);

  if (!aadhaarCandidates.some(isValidAadhaarChecksum)) {
    const sparseText = await runOcr(dataUrl, { pageSegMode: "11" });
    rawText = `${rawText}\n${sparseText}`;
    aadhaarCandidates = extractAadhaarCandidates(rawText);
  }

  if (!aadhaarCandidates.some(isValidAadhaarChecksum)) {
    const digitsText = await runOcr(dataUrl, {
      pageSegMode: "11",
      charWhitelist: "0123456789 ",
    });
    rawText = `${rawText}\n${digitsText}`;
    aadhaarCandidates = extractAadhaarCandidates(rawText);
  }

  const aadhaarNumber =
    aadhaarCandidates.find(isValidAadhaarChecksum) || aadhaarCandidates[0] || "";

  return {
    name: extractName(rawText),
    dob: extractDob(rawText),
    aadhaarNumber,
    aadhaarCandidates,
    rawText, 
  };
}

export function computeAadhaarHash(aadhaarNumber) {
  const digits = String(aadhaarNumber || "").replace(/\D/g, "");
  return crypto.createHash("sha256").update(digits).digest("hex");
}

export function maskAadhaar(aadhaarNumber) {
  const digits = String(aadhaarNumber || "").replace(/\D/g, "");
  return digits.length === 12 ? `XXXXXXXX${digits.slice(-4)}` : "";
}