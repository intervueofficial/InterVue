import User from "../models/User.js";
import {
  extractAadhaarFields,
  computeAadhaarHash,
  maskAadhaar,
  isValidAadhaarChecksum,
} from "../lib/aadhaarOcr.js";

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

  user.name = name.trim();

  if (user.candidateProfile) {
    const p = user.candidateProfile;
    p.isComplete = !!(p.degree && p.fieldOfStudy && p.yearOfGraduation && p.skills?.length > 0);
  }

  try {
    await user.save();
  } catch (saveError) {
    
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

export async function getVerificationStatus(req, res) {
  return res.status(200).json({
    success: true,
    verification: req.user.identityVerification || { verified: false },
  });
}

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
      return res.status(422).json({
        success: false,
        message:
          "Couldn't read an Aadhaar number from that photo. Hold the card flat, make sure it's well-lit with no glare, and try again.",
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
