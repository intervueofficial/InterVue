import crypto from "crypto";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Session from "../models/Session.js";
import SessionViolation from "../models/SessionViolation.js";
import { streamClient, chatClient } from "../lib/stream.js";
import { checkEligibility } from "../utils/checkEligibility.js";
import { sendSelectionEmail, sendRejectionEmail, sendWaitlistEmail, sendHiredEmail, sendApplicationReceivedEmail } from "../lib/resend.js";
import { formatInterviewDateTime, isMeaningfullyFuture } from "../utils/formatInterviewDateTime.js";
import { ENV } from "../lib/env.js";
import { generatePerformanceSummary } from "../utils/generatePerformanceSummary.js";
import { generatePerformancePdf } from "../utils/generatePerformancePdf.js";
import { generateFitScore } from "../utils/generateFitScore.js";

const FIT_SCORE_CACHE = new Map();
const FIT_SCORE_TTL_MS = 60 * 60 * 1000; // 1 hour — resumes don't change that often

function fitScoreCacheKey({ applicationId, resumeText, jobUpdatedAt }) {
  return crypto
    .createHash("md5")
    .update(JSON.stringify({ applicationId, resumeText, jobUpdatedAt }))
    .digest("hex");
}

async function computeFitScore(application, job, candidate, { force = false } = {}) {
  try {
    if (!application || !job || !candidate) return null;

    const profile = candidate.candidateProfile || {};
    const resumeText = profile.resumeText || "";

    const cacheKey = fitScoreCacheKey({
      applicationId: application._id.toString(),
      resumeText,
      jobUpdatedAt: job.updatedAt?.toISOString?.() || "",
    });

    if (!force) {
      const cached = FIT_SCORE_CACHE.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < FIT_SCORE_TTL_MS) {
        Object.assign(application, cached.data);
        await application.save();
        return cached.data;
      }
    }

    const result = await generateFitScore({
      candidateName: candidate.name || "Candidate",
      jobTitle: job.title,
      jobDescription: job.description,
      requiredDegrees: job.criteria?.requiredDegrees || [],
      requiredSkills: job.criteria?.requiredSkills || [],
      minExperience: job.criteria?.minExperience || 0,
      qualificationNote: job.criteria?.qualificationNote || "",
      sampleResumeText: job.sampleResumeText || "",
      candidateDegree: profile.degree,
      candidateFieldOfStudy: profile.fieldOfStudy,
      candidateExperienceYears: profile.experienceYears,
      candidateSkills: profile.skills || [],
      candidateResumeText: resumeText,
    });

    const update = {
      aiFitScore: result.score,
      aiFitSummary: result.summary,
      aiFitBreakdown: {
        skillsMatched: result.skillsMatched,
        skillsMissing: result.skillsMissing,
        experienceFit: result.experienceFit,
        educationFit: result.educationFit,
        resumeQualitySignal: result.resumeQualitySignal,
      },
      aiFitGeneratedAt: new Date(),
    };

    Object.assign(application, update);
    await application.save();

    if (result.score !== null) {
      FIT_SCORE_CACHE.set(cacheKey, { data: update, timestamp: Date.now() });
      if (FIT_SCORE_CACHE.size > 200) {
        const firstKey = FIT_SCORE_CACHE.keys().next().value;
        FIT_SCORE_CACHE.delete(firstKey);
      }
    }

    return update;
  } catch (error) {
    console.error("computeFitScore:", error.message);
    return null;
  }
}

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
      const identityVerified = Boolean(req.user.identityVerification?.verified);
      return res.status(400).json({
        success: false,
        code: identityVerified ? undefined : "IDENTITY_NOT_VERIFIED",
        message: identityVerified
          ? "Please complete your profile (education, experience, skills) before applying."
          : "Please verify your identity (Aadhaar scan) and complete your profile before applying.",
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

    if (isEligible) {
      try {
        const days = job.expectedResponseDays || 7;
        await sendApplicationReceivedEmail({
          to: req.user.email,
          name: req.user.name,
          jobTitle: job.title,
          waitDays: `${days} day${days === 1 ? "" : "s"}`,
        });
      } catch (emailError) {
        console.error("sendApplicationReceivedEmail:", emailError.message);
      }

      await computeFitScore(application, job, req.user);
    }

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

export async function getMyApplications(req, res) {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate("job", "title fieldOfStudy location status")
      .populate("session")
      .sort({ createdAt: -1 });

    return res.json({ success: true, applications });
  } catch (error) {
    console.error("getMyApplications:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function getApplicantsForJob(req, res) {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).select("requiredSkills");
    const requiredSkills = (job?.requiredSkills || []).map((s) => s.toLowerCase().trim());

    const applications = await Application.find({ job: jobId })
      .populate("candidate", "name email profileImage candidateProfile")

      .sort({ isEligible: -1, "profileSnapshot.experienceYears": -1, createdAt: 1 });

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

export async function refreshFitScore(req, res) {
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
        message: "Fit scores are only generated for candidates who passed the eligibility check.",
      });
    }

    const result = await computeFitScore(application, application.job, application.candidate, {
      force: true,
    });

    if (!result) {
      return res.status(502).json({
        success: false,
        message: "Couldn't generate a fit score right now. Please try again shortly.",
      });
    }

    return res.json({ success: true, application });
  } catch (error) {
    console.error("refreshFitScore:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

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

    // Interviewer can optionally pick a future date/time for the
    // interview (see the scheduling modal on the frontend Applicants
    // page); defaults to right now, preserving the original
    // instant-interview behavior when no date is chosen. Only a valid
    // future date is honored — anything invalid or in the past falls
    // back to "now" rather than silently failing the whole request.
    const requestedScheduledAt = req.body?.scheduledAt ? new Date(req.body.scheduledAt) : null;
    const scheduledAt =
      requestedScheduledAt && !Number.isNaN(requestedScheduledAt.getTime())
        ? requestedScheduledAt
        : new Date();

    const session = await Session.create({
      title: `Interview — ${application.job.title}`,
      description: `Interview for ${application.job.title}, scheduled after shortlisting.`,
      scheduledAt,
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

    // Real interview link/code policy: if the interview is scheduled
    // more than ~65 minutes out, the shortlist email confirms the date
    // & time ONLY — no join link yet. The link goes out separately,
    // exactly 1 hour before the interview, via the reminder cron below
    // (send-interview-join-reminders in lib/inngest.js). If it's an
    // "Instant Interview" (now, or less than ~65 minutes away — not
    // enough runway for a meaningful separate reminder), the link goes
    // out immediately in this same email instead, and we mark the
    // reminder as already "sent" so the cron doesn't also send one.
    const isScheduledForLater = isMeaningfullyFuture(scheduledAt, 65 * 60 * 1000);

    const { interviewDate, interviewTime } = formatInterviewDateTime(scheduledAt);

    await sendSelectionEmail({
      to: application.candidate.email,
      name: application.candidate.name,
      jobTitle: application.job.title,
      interviewDate,
      interviewTime,
      isScheduledForLater,
      sessionCode: isScheduledForLater ? undefined : callId,
      sessionLink: isScheduledForLater ? undefined : sessionLink,
    });

    if (!isScheduledForLater) {
      // Link already sent above — nothing left for the cron to do for
      // this session.
      session.reminderSentAt = new Date();
      await session.save();
    }

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
// message. "hired", "rejected", and "waitlisted" each trigger their
// own candidate email.
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
    } else if (decision === "waitlisted") {
      // No performance report yet — that's only generated once a final
      // hired/rejected decision is made for this candidate later. The
      // candidate still gets notified that they're on the waitlist now.
      await sendWaitlistEmail({
        to: application.candidate.email,
        name: application.candidate.name,
        jobTitle: application.job.title,
        feedback: feedback || "",
      });
    }

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
      .populate("job", "title fieldOfStudy location")
      .populate("candidate", "name email")
      .populate("session")
      .sort({ decidedAt: -1 });

    return res.json({ success: true, applications });
  } catch (error) {
    console.error("getWaitlist:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
