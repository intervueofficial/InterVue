import User from "../models/User.js";
import {
  extractAadhaarFields,
  computeAadhaarHash,
  maskAadhaar,
  isValidAadhaarChecksum,
} from "../lib/aadhaarOcr.js";

/**
 * Given a confirmed identity record (name + dob + aadhaarNumber, after
 * the candidate has reviewed/corrected whatever OCR produced), either
 * link it to `user` or reject it as a duplicate of an already-verified
 * account. This is where the actual "one Aadhaar = one account"
 * guarantee lives — the `findOne` check plus the model's unique index
 * on `aadhaarHash` together stop the same identity from ever verifying
 * twice.
 */
async function finalizeVerification(user, { name, dob, aadhaarNumber }) {
  const aadhaarHash = computeAadhaarHash(aadhaarNumber);

  const existing = await User.findOne({
    "identityVerification.aadhaarHash": aadhaarHash,
    _id: { $ne: user._id },
  });

  if (existing) {
    return {
      ok: false,
      status: "duplicate",
      reason: "This Aadhaar is already linked to another InterVue account.",
    };
  }

  user.identityVerification = {
    provider: "aadhaar-ocr",
    verified: true,
    aadhaarHash,
    verifiedName: name.trim(),
    verifiedDob: dob.trim(),
    maskedAadhaar: maskAadhaar(aadhaarNumber),
    verifiedAt: new Date(),
  };

  // Lock the account's display name to the verified name from here on
  // — protectRoute.js stops syncing `name` from Clerk once this is set.
  user.name = name.trim();

  // Re-evaluate profile completeness now that verification just
  // changed — isComplete requires both the profile fields AND
  // verification (see authController.js), so a candidate who already
  // filled everything else becomes eligible to apply right after this.
  if (user.candidateProfile) {
    const p = user.candidateProfile;
    p.isComplete = !!(p.degree && p.fieldOfStudy && p.yearOfGraduation && p.skills?.length > 0);
  }

  try {
    await user.save();
  } catch (saveError) {
    // Safety net for a race between two concurrent verification
    // attempts landing on the same hash — the unique index catches
    // what the findOne check above might miss under concurrency.
    if (saveError?.code === 11000) {
      return {
        ok: false,
        status: "duplicate",
        reason: "This Aadhaar is already linked to another InterVue account.",
      };
    }
    throw saveError;
  }

  return { ok: true, status: "verified" };
}

// =======================================
// GET /api/identity/status
// =======================================
export async function getVerificationStatus(req, res) {
  return res.status(200).json({
    success: true,
    verification: req.user.identityVerification || { verified: false },
  });
}

// =======================================
// POST /api/identity/verify/scan
// Body: { image: "data:image/jpeg;base64,..." } — a single frame
// captured from the candidate's live camera (never a gallery upload —
// enforced client-side in AadhaarCameraCapture.jsx).
//
// Runs OCR and returns the extracted fields WITHOUT saving anything,
// so the frontend can show a review/correction screen before the
// candidate commits — OCR on a phone photo of a card is genuinely
// error-prone (glare, tilt, worn cards), so we never treat a raw OCR
// pass as final.
// =======================================
export async function scanAadhaar(req, res) {
  try {
    if (req.user.identityVerification?.verified) {
      return res.status(200).json({ success: true, alreadyVerified: true });
    }

    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ success: false, message: "No image was captured." });
    }

    const result = await extractAadhaarFields(image);

    if (!result.aadhaarNumber) {
      // OCR couldn't confidently find a 12-digit Aadhaar number. Rather
      // than dead-ending the candidate here, hand back whatever partial
      // fields OCR did manage (name/dob/any unconfirmed digit runs) so
      // the frontend can open the same review screen pre-filled and let
      // them type the number in by hand. The Verhoeff checksum in
      // confirmVerification still guards against a bad manual entry, so
      // this doesn't weaken the fraud check — it just avoids blocking a
      // candidate whose photo was merely hard for OCR to read.
      return res.status(422).json({
        success: false,
        message:
          "Couldn't read an Aadhaar number from that photo. Hold the card flat, make sure it's well-lit with no glare, and try again — or enter the details manually below.",
        needsManualEntry: true,
        extracted: {
          name: result.name,
          dob: result.dob,
          aadhaarNumber: "",
          aadhaarNumberValid: false,
          otherCandidates: result.aadhaarCandidates.slice(0, 4),
        },
      });
    }

    return res.status(200).json({
      success: true,
      extracted: {
        name: result.name,
        dob: result.dob,
        aadhaarNumber: result.aadhaarNumber,
        aadhaarNumberValid: isValidAadhaarChecksum(result.aadhaarNumber),
        otherCandidates: result.aadhaarCandidates.slice(1, 4),
      },
    });
  } catch (error) {
    console.error("scanAadhaar:", error);
    return res.status(500).json({
      success: false,
      message: "Couldn't process that image. Please try again.",
    });
  }
}

// =======================================
// POST /api/identity/verify/confirm
// Body: { name, dob, aadhaarNumber } — the fields from scanAadhaar's
// response, after the candidate has reviewed and corrected them if
// needed. This is the step that actually saves the verification.
// =======================================
export async function confirmVerification(req, res) {
  try {
    if (req.user.identityVerification?.verified) {
      return res.status(200).json({ success: true, status: "already_verified" });
    }

    const { name, dob, aadhaarNumber } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!dob || !dob.trim()) {
      return res.status(400).json({ success: false, message: "Date of birth is required." });
    }

    const digitsOnly = String(aadhaarNumber || "").replace(/\D/g, "");
    if (digitsOnly.length !== 12) {
      return res
        .status(400)
        .json({ success: false, message: "Aadhaar number must be 12 digits." });
    }
    if (!isValidAadhaarChecksum(digitsOnly)) {
      return res.status(400).json({
        success: false,
        message: "That doesn't look like a valid Aadhaar number. Please re-check the digits.",
      });
    }

    const result = await finalizeVerification(req.user, { name, dob, aadhaarNumber: digitsOnly });

    if (!result.ok) {
      return res.status(409).json({ success: false, status: result.status, message: result.reason });
    }

    return res.status(200).json({ success: true, status: "verified", user: req.user });
  } catch (error) {
    console.error("confirmVerification:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
