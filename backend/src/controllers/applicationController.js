import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Session from "../models/Session.js";
import SessionViolation from "../models/SessionViolation.js";
import { streamClient, chatClient } from "../lib/stream.js";
import { checkEligibility } from "../utils/checkEligibility.js";
import { sendSelectionEmail, sendRejectionEmail, sendHiredEmail } from "../lib/resend.js";
import { ENV } from "../lib/env.js";
import { generatePerformanceSummary } from "../utils/generatePerformanceSummary.js";
import { generatePerformancePdf } from "../utils/generatePerformancePdf.js";

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

    // Duplicate-account guard: once enabled (REQUIRE_IDENTITY_VERIFICATION=true
    // after DigiLocker is configured — see IDENTITY_VERIFICATION_SETUP.md),
    // a candidate must verify their identity once via DigiLocker before
    // their first job application. Off by default so the app keeps
    // working before that's set up.
    if (ENV.REQUIRE_IDENTITY_VERIFICATION && !req.user.identityVerification?.verified) {
      return res.status(403).json({
        success: false,
        code: "IDENTITY_NOT_VERIFIED",
        message: "Please verify your identity via DigiLocker before applying to jobs.",
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

    const job = await Job.findById(jobId).select("requiredSkills");
    const requiredSkills = (job?.requiredSkills || []).map((s) => s.toLowerCase().trim());

    const applications = await Application.find({ job: jobId })
      .populate("candidate", "name email profileImage candidateProfile")
      // Default sort: eligible candidates first, then most experienced
      // first — with 500+ applicants an interviewer shouldn't have to
      // scroll/open each one just to find the strongest candidates.
      // Frontend still exposes other sort options on top of this.
      .sort({ isEligible: -1, "profileSnapshot.experienceYears": -1, createdAt: 1 });

    // Attach a computed skill-match count (how many of the job's
    // required skills this candidate's profile lists) so the frontend
    // can offer "Best Skill Match" as a sort option without every
    // client having to recompute the intersection itself.
    const applicationsWithMatch = applications.map((app) => {
      const candidateSkills = (app.profileSnapshot?.skills || []).map((s) =>
        s.toLowerCase().trim()
      );
      const skillMatchCount = requiredSkills.length
        ? requiredSkills.filter((s) => candidateSkills.includes(s)).length
        : 0;

      const obj = app.toObject();
      obj.skillMatchCount = skillMatchCount;
      obj.totalRequiredSkills = requiredSkills.length;
      return obj;
    });

    return res.json({ success: true, applications: applicationsWithMatch });
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
/**
 * Builds the AI performance report for a decided application (hired or
 * rejected only) from real session data — quiz score, code-grading
 * result, and proctoring attention flags — plus the interviewer's own
 * feedback. Saves the PDF + narrative onto the Session document so it
 * shows up in the History page (Interviewer/Admin only).
 *
 * NOTE: this report is intentionally never emailed to the candidate —
 * it's generated purely for the internal record kept on the Session
 * and surfaced via the History table + PDF download there.
 *
 * Deliberately non-blocking: any failure here (AI provider down, no
 * linked session, pdf generation error) is logged and swallowed so the
 * hire/reject decision + email still goes through without interruption
 * rather than failing the whole request.
 */
async function generatePerformanceReport(application, feedback) {
  try {
    if (!application.session) return null;

    const session = await Session.findById(application.session);
    if (!session) return null;

    const candidate = application.candidate;

    const codingScore =
      session.codeResult?.total > 0
        ? Math.round((session.codeResult.passed / session.codeResult.total) * 100)
        : null;

    const quizScore =
      session.quizResult?.total > 0
        ? Math.round((session.quizResult.score / session.quizResult.total) * 100)
        : null;

    const violationCount = candidate?.clerkId
      ? await SessionViolation.countDocuments({
          sessionId: session._id,
          candidateId: candidate.clerkId,
        })
      : 0;

    // Simple, explainable heuristic — not a biometric/scientific measure:
    // start at 100, dock 8 points per logged attention flag, floor at 0.
    const confidenceScore = Math.max(0, 100 - violationCount * 8);

    const summary = await generatePerformanceSummary({
      candidateName: candidate?.name || "Candidate",
      jobTitle: application.job?.title || "the role",
      codingScore,
      quizScore,
      confidenceScore,
      violationCount,
      interviewerFeedback: feedback || "",
    });

    const pdfBuffer = await generatePerformancePdf({
      candidateName: candidate?.name || "Candidate",
      jobTitle: application.job?.title || "the role",
      interviewDate: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      codingScore,
      quizScore,
      confidenceScore,
      summary,
      interviewerComment: feedback || "",
    });

    const pdfBase64 = pdfBuffer.toString("base64");

    session.performanceReport = {
      summary: summary.overallSummary,
      codingFeedback: summary.codingFeedback,
      quizFeedback: summary.quizFeedback,
      confidenceFeedback: summary.confidenceFeedback,
      codingScore,
      quizScore,
      confidenceScore,
      interviewerComment: feedback || "",
      pdfBase64,
      generatedAt: new Date(),
    };

    await session.save();

    return session.performanceReport;
  } catch (error) {
    console.error("generatePerformanceReport:", error.message);
    return null;
  }
}

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
      // Generated for the internal History record only — never emailed
      // to the candidate. See generatePerformanceReport() above.
      await generatePerformanceReport(application, feedback);

      await sendHiredEmail({
        to: application.candidate.email,
        name: application.candidate.name,
        jobTitle: application.job.title,
        feedback: feedback || "",
      });
    } else if (decision === "rejected") {
      await generatePerformanceReport(application, feedback);

      await sendRejectionEmail({
        to: application.candidate.email,
        name: application.candidate.name,
        jobTitle: application.job.title,
        feedback: feedback || "",
      });
    }
    // "waitlisted" -> no email, no report generated yet — candidate just
    // appears in the waitlist; a report is generated once a final
    // hired/rejected decision is made for them later.

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
