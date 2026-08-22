import crypto from "crypto";
import { createWorker } from "tesseract.js";

/**
 * Live-camera Aadhaar card OCR (replaces the old DigiLocker OAuth
 * integration — see git history for that approach). The candidate
 * captures a photo of their physical Aadhaar card via the browser's
 * camera (AadhaarCameraCapture.jsx — no gallery upload allowed), we
 * OCR it here to pull out name, DOB, and the 12-digit Aadhaar number.
 *
 * Why OCR instead of DigiLocker: product decision to avoid a
 * government OAuth dependency and let a candidate verify with just
 * their physical card. Trade-off, and it's a real one: OCR on a phone
 * photo of a card is meaningfully less reliable than a government API
 * response — glare, tilt, and worn cards all cause misreads. That's
 * why the controller (identityVerificationController.js) always
 * returns the raw OCR'd fields to the frontend for the candidate to
 * review and correct before final submission, rather than silently
 * trusting whatever this extraction produces. The Aadhaar number
 * itself is what gets hashed and uniqueness-checked, so an OCR slip on
 * name/DOB doesn't threaten the dedup guarantee — only a slip on the
 * number could, which is why the number is validated with Verhoeff
 * checksum below rather than just "12 digits found somewhere".
 *
 * We never persist the captured image — it's processed in memory for
 * this one OCR pass and discarded. We never store the raw Aadhaar
 * number either — only its one-way SHA-256 hash (see computeAadhaarHash
 * below), same privacy posture the previous DigiLocker integration
 * had, for the same reason: private platforms can't lawfully hold raw
 * Aadhaar numbers at scale without UIDAI AUA/KUA licensing.
 */

// ---- Verhoeff checksum (the algorithm UIDAI uses for Aadhaar numbers) ----
// Lets us tell "OCR found 12 digits that happen to look like an Aadhaar
// number" apart from "OCR found the actual Aadhaar number" — a random
// 12-digit misread will fail this check with overwhelming probability.
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

/**
 * Every 12-digit run OCR turned up on the card, most-plausible first
 * (Verhoeff-valid candidates before invalid ones), so the caller can
 * try each in turn instead of trusting only the first regex match.
 */
function extractAadhaarCandidates(text) {
  const compact = text.replace(/[^\d\s]/g, " ");
  const runs = compact.match(/\d[\d\s]{10,16}\d/g) || [];

  const candidates = new Set();
  for (const run of runs) {
    const digits = run.replace(/\s/g, "");
    if (digits.length === 12) {
      candidates.add(digits);
    } else if (digits.length > 12) {
      // Grab any 12-digit window in case OCR merged an adjacent number.
      for (let i = 0; i + 12 <= digits.length; i++) {
        candidates.add(digits.slice(i, i + 12));
      }
    }
  }

  return [...candidates].sort(
    (a, b) => isValidAadhaarChecksum(b) - isValidAadhaarChecksum(a)
  );
}

// Aadhaar prints DOB as "DD/MM/YYYY" next to a "DOB:"/"Year of Birth:"
// label (older cards only give year of birth).
function extractDob(text) {
  const dobMatch = text.match(
    /(?:DOB|Date of Birth)[:\s]*([0-3]?\d[\/\-.][01]?\d[\/\-.]\d{4})/i
  );
  if (dobMatch) return dobMatch[1].replace(/[-.]/g, "/");

  const looseDateMatch = text.match(/\b([0-3]?\d[\/\-][01]?\d[\/\-](19|20)\d{2})\b/);
  if (looseDateMatch) return looseDateMatch[1].replace(/-/g, "/");

  // OCR sometimes drops/merges one of the two slashes on the DOB line
  // (observed in testing: "DOB: 0401/2008" instead of "04/01/2008").
  // Fall back to a plain DDMM/YYYY or DDMMYYYY digit blob near the
  // DOB/Date of Birth label before giving up to year-of-birth-only.
  const mergedMatch = text.match(
    /(?:DOB|Date of Birth)[:\s]*([0-3]\d)[\/\-.]?([01]\d)[\/\-.]?((?:19|20)\d{2})/i
  );
  if (mergedMatch) return `${mergedMatch[1]}/${mergedMatch[2]}/${mergedMatch[3]}`;

  // Last resort: every pattern above requires the "DOB"/"Date of Birth"
  // label itself to be read correctly, which isn't guaranteed — it's
  // printed small, right next to the Devanagari label, and Tesseract
  // can garble it. Fall back to any bare 7-8 digit run in the text and
  // accept it only if it's a plausible DDMMYYYY date, so we don't
  // mistake an unrelated number (like a VID fragment) for a DOB.
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

// Best-effort name extraction: Aadhaar prints the name on its own line,
// generally the first all-letters line before the DOB/gender lines, in
// a mix of the regional language and English. We only want the English
// portion.
function extractName(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const noiseWords =
    /government|india|male|female|dob|date of birth|year of birth|aadhaar|uidai|unique identification|mobile/i;

  // 2-4 whitespace-separated ASCII-letter words, each starting with a
  // capital (dots allowed for initials). This is a substring match run
  // against each line, NOT a whole-line match — Tesseract sometimes
  // merges the Devanagari name and the English name onto a single OCR
  // "line" with no line break between them (e.g. "अभिषेक वाघ Abhishek
  // Wagh"), and matching only ASCII characters naturally skips over the
  // non-Latin script rather than rejecting the whole line because of it.
  //
  // Requiring an initial capital on every word isn't just cosmetic: an
  // Aadhaar card always prints the English name in Title Case, but when
  // Tesseract fails to read the *Devanagari* name line just above it,
  // it doesn't fail cleanly — it hallucinates Latin-lookalike glyphs
  // from the Devanagari shapes, almost always lowercase junk like "wr
  // ffl". That garbage line sits closer to the DOB/gender anchor than
  // the real name, so without this check it would win the "closest
  // candidate above the anchor" search below before we ever reach the
  // actual name.
  const namePattern = /[A-Z][A-Za-z.]{1,}(?:\s+[A-Z][A-Za-z.]{1,}){1,3}/g;

  const isPlausibleName = (str) => {
    if (noiseWords.test(str)) return false;
    const words = str.trim().split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    // Every word must be a real word-length token — this is what rules
    // out OCR noise like "ER Te E" (a 1-letter word) winning just
    // because it happened to appear earlier in the text than the
    // actual name.
    return words.every((w) => w.replace(/\./g, "").length >= 2);
  };

  const candidatesByLine = lines.map((line) =>
    (line.match(namePattern) || []).map((m) => m.trim()).filter(isPlausibleName)
  );

  // Aadhaar always prints the English name directly above the
  // DOB/gender lines, so prefer whichever candidate sits closest above
  // that anchor over just taking the first candidate in the text.
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

// Runs one OCR pass. `options.pageSegMode`, when given, is a Tesseract
// PSM value; `options.charWhitelist`, when given, restricts the
// character classifier to only those characters (see
// https://tesseract-ocr.github.io/tessdoc/ImproveQuality) — both
// applied via worker.setParameters. The one-shot `Tesseract.recognize`
// convenience function doesn't expose engine parameters like this, only
// worker-setup options, which is why we go through createWorker
// ourselves instead.
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

  // First pass: PSM 6 ("assume a single uniform block of text"),
  // instead of Tesseract's default PSM 3 ("fully automatic page
  // segmentation"). Tested head-to-head against real card photos: PSM
  // 3's layout analysis tries to detect columns/blocks on the card's
  // dense mix of photo, QR code, and bilingual text, and that guess is
  // what was randomly truncating or corrupting the name (e.g. dropping
  // the surname, or in one case substituting nearby noise for a whole
  // word — see the capitalization fix above). PSM 6 skips that
  // layout-guessing step and just reads the block top-to-bottom, which
  // consistently captured the full name correctly in testing where PSM
  // 3 did not.
  let rawText = await runOcr(dataUrl, { pageSegMode: "6" });
  let aadhaarCandidates = extractAadhaarCandidates(rawText);

  // The 12-digit Aadhaar number sits by itself at the bottom of the
  // card, apart from any paragraph of text, and even PSM 6 can still
  // miss or mangle it. If pass 1 didn't turn up a Verhoeff-valid
  // number, retry with "sparse text" mode (PSM 11), which looks for
  // text wherever it is on the page without assuming any block
  // structure at all — much better suited to an isolated digit string,
  // though in testing it was worse at grouping the multi-word name
  // onto one line, which is why it's a fallback rather than the
  // primary pass. We merge its output in rather than replace pass 1,
  // so a good name reading from pass 1 is never thrown away.
  if (!aadhaarCandidates.some(isValidAadhaarChecksum)) {
    const sparseText = await runOcr(dataUrl, { pageSegMode: "11" });
    rawText = `${rawText}\n${sparseText}`;
    aadhaarCandidates = extractAadhaarCandidates(rawText);
  }

  // Still nothing valid? Last resort: a pass restricted to a
  // digits-only character set. Tesseract's classifier normally has to
  // choose between every letter and digit it knows for each glyph —
  // telling it up front that only digits are possible removes the
  // letter-shaped distractors that cause a lot of digit misreads
  // (0/O, 1/I, 5/S, 8/B), at the cost of this pass being useless for
  // the name. Only worth the extra OCR round-trip after both general
  // passes above have already failed.
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
    rawText, // returned for the review-screen debug view only, never stored
  };
}

/**
 * One-way fingerprint of the Aadhaar number, used for the uniqueness
 * check — see the model comment in User.js for why we hash rather than
 * store the number itself.
 */
export function computeAadhaarHash(aadhaarNumber) {
  const digits = String(aadhaarNumber || "").replace(/\D/g, "");
  return crypto.createHash("sha256").update(digits).digest("hex");
}

export function maskAadhaar(aadhaarNumber) {
  const digits = String(aadhaarNumber || "").replace(/\D/g, "");
  return digits.length === 12 ? `XXXXXXXX${digits.slice(-4)}` : "";
}