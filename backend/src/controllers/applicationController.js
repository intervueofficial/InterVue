import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Session from "../models/Session.js";
import { streamClient, chatClient } from "../lib/stream.js";
import { checkEligibility } from "../utils/checkEligibility.js";
import { sendSelectionEmail, sendRejectionEmail, sendHiredEmail } from "../lib/resend.js";
import { ENV } from "../lib/env.js";

// ==========================
// Candidate: apply to a job
// ==========================
export async function applyToJob(req, res) {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job || job.status !== "open") {
      return res.status(404).json({
        success: false,
        message: "Job not found or no longer open",
      });
    }

    const profile = req.user.candidateProfile;

    if (!profile || !profile.isComplete) {
      return res.status(400).json({
        success: false,
        message:
          "Please complete your profile (education, experience, skills) before applying.",
      });
    }

    const existing = await Application.findOne({
      job: jobId,
      candidate: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    const { isEligible, failedCriteria } = checkEligibility(job, profile);

    const application = await Application.create({
      job: jobId,
      candidate: req.user._id,
      profileSnapshot: {
        phone: profile.phone,
        degree: profile.degree,
        fieldOfStudy: profile.fieldOfStudy,
        institution: profile.institution,
        yearOfGraduation: profile.yearOfGraduation,
        experienceYears: profile.experienceYears,
        skills: profile.skills,
        resumeUrl: profile.resumeUrl,
      },
      isEligible,
      failedCriteria,
      status: isEligible ? "applied" : "not_eligible",
    });

    return res.status(201).json({
      success: true,
      isEligible,
      failedCriteria,
      application,
    });
  } catch (error) {
    console.error("applyToJob:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// ==========================
// Candidate: my applications
// ==========================
export async function getMyApplications(req, res) {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate("job", "title department location status")
      .populate("session")
      .sort({ createdAt: -1 });

    return res.json({ success: true, applications });
  } catch (error) {
    console.error("getMyApplications:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// ==========================
// Interviewer/Admin: tabular list of applicants for a job
// (only candidates who passed the automated eligibility check
// are worth the interviewer's time, but we show everyone with
// their status so nothing is hidden.)
// ==========================
export async function getApplicantsForJob(req, res) {
  try {
    const { jobId } = req.params;

    const applications = await Application.find({ job: jobId })
      .populate("candidate", "name email profileImage")
      .sort({ isEligible: -1, createdAt: 1 });

    return res.json({ success: true, applications });
  } catch (error) {
    console.error("getApplicantsForJob:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// ==========================
// Interviewer: select a candidate — creates an interview session
// and emails the candidate the join details
// ==========================
export async function selectApplicant(req, res) {
  try {
    const application = await Application.findById(req.params.id)
      .populate("job")
      .populate("candidate");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (!application.isEligible) {
      return res.status(400).json({
        success: false,
        message: "Cannot select a candidate who did not meet the job criteria",
      });
    }

    const callId = "session_" + Date.now();

    const session = await Session.create({
      title: `Interview — ${application.job.title}`,
      description: `Interview for ${application.job.title}, scheduled after shortlisting.`,
      scheduledAt: new Date(),
      createdBy: req.user._id,
      interviewer: req.user._id,
      candidate: application.candidate._id,
      status: "scheduled",
      callId,
    });

    await streamClient.video.call("default", callId).getOrCreate({
      data: { created_by_id: req.user.clerkId },
    });

    const channel = chatClient.channel("messaging", callId, {
      name: session.title,
      created_by_id: req.user.clerkId,
      members: [req.user.clerkId, application.candidate.clerkId],
    });

    await channel.create();

    application.status = "selected";
    application.session = session._id;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    await application.save();

    const sessionLink = `${ENV.CLIENT_URL || ""}/session/${session._id}`;

    await sendSelectionEmail({
      to: application.candidate.email,
      name: application.candidate.name,
      jobTitle: application.job.title,
      sessionCode: callId,
      sessionLink,
    });

    return res.json({ success: true, application, session });
  } catch (error) {
    console.error("selectApplicant:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// ==========================
// Interviewer: reject a candidate
// ==========================
export async function rejectApplicant(req, res) {
  try {
    const application = await Application.findById(req.params.id)
      .populate("job")
      .populate("candidate");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    application.status = "rejected";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    await application.save();

    await sendRejectionEmail({
      to: application.candidate.email,
      name: application.candidate.name,
      jobTitle: application.job.title,
    });

    return res.json({ success: true, application });
  } catch (error) {
    console.error("rejectApplicant:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// ==========================
// Interviewer: look up the application tied to a session
// (used right after a call ends to trigger the decision popup —
// returns null if this session wasn't created from a job application,
// e.g. an ad-hoc/practice session)
// ==========================
export async function getApplicationBySession(req, res) {
  try {
    const { sessionId } = req.params;

    const application = await Application.findOne({ session: sessionId })
      .populate("job", "title")
      .populate("candidate", "name email");

    if (!application) {
      return res.json({ success: true, application: null });
    }

    return res.json({ success: true, application });
  } catch (error) {
    console.error("getApplicationBySession:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// ==========================
// Interviewer: submit a post-interview decision
// (hired / rejected / waitlisted), with feedback or a custom
// message. Only "hired" and "rejected" trigger an email —
// "waitlisted" just parks the candidate for a later decision.
// ==========================
export async function submitDecision(req, res) {
  try {
    const { decision, feedback } = req.body;

    if (!["hired", "rejected", "waitlisted"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be one of: hired, rejected, waitlisted",
      });
    }

    const application = await Application.findById(req.params.id)
      .populate("job")
      .populate("candidate");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    application.finalDecision = decision;
    application.feedback = feedback || "";
    application.decidedBy = req.user._id;
    application.decidedAt = new Date();
    application.decisionHistory.push({
      decision,
      feedback: feedback || "",
      decidedBy: req.user._id,
      decidedAt: new Date(),
    });

    await application.save();

    if (decision === "hired") {
      await sendHiredEmail({
        to: application.candidate.email,
        name: application.candidate.name,
        jobTitle: application.job.title,
        feedback: feedback || "",
      });
    } else if (decision === "rejected") {
      await sendRejectionEmail({
        to: application.candidate.email,
        name: application.candidate.name,
        jobTitle: application.job.title,
        feedback: feedback || "",
      });
    }
    // "waitlisted" -> no email, candidate just appears in the waitlist

    return res.json({ success: true, application });
  } catch (error) {
    console.error("submitDecision:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// ==========================
// Interviewer/Admin: list all currently waitlisted candidates
// ==========================
export async function getWaitlist(req, res) {
  try {
    const applications = await Application.find({ finalDecision: "waitlisted" })
      .populate("job", "title department location")
      .populate("candidate", "name email")
      .populate("session")
      .sort({ decidedAt: -1 });

    return res.json({ success: true, applications });
  } catch (error) {
    console.error("getWaitlist:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
