import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { logAction } from "../lib/auditLog.js";
import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary.js";
import { extractResumeText, RESUME_MIME_TYPES } from "../lib/resumeParser.js";

export async function createJob(req, res) {
  try {
    const {
      title,
      description,
      fieldOfStudy,
      location,
      employmentType,
      criteria,
      expectedResponseDays,
      sampleResumeNotes,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Job title is required",
      });
    }

    const job = await Job.create({
      title,
      description,
      fieldOfStudy,
      location,
      employmentType,
      criteria: {
        requiredDegrees: criteria?.requiredDegrees || [],
        minExperience: criteria?.minExperience || 0,
        requiredSkills: criteria?.requiredSkills || [],
        qualificationNote: criteria?.qualificationNote || "",
      },
      expectedResponseDays: expectedResponseDays || 7,
      sampleResumeNotes: sampleResumeNotes || "",
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, job });
  } catch (error) {
    console.error("createJob:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function getAllJobs(req, res) {
  try {
    const jobs = await Job.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, jobs });
  } catch (error) {
    console.error("getAllJobs:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function getOpenJobs(req, res) {
  try {
    const jobs = await Job.find({ status: "open" }).sort({ createdAt: -1 });

    
    const applications = await Application.find({
      candidate: req.user._id,
      job: { $in: jobs.map((j) => j._id) },
    });

    const appliedMap = new Map(
      applications.map((a) => [a.job.toString(), a])
    );

    const jobsWithStatus = jobs.map((job) => {
      const application = appliedMap.get(job._id.toString());

      return {
        ...job.toObject(),
        hasApplied: !!application,
        applicationStatus: application?.status || null,
      };
    });

    return res.json({ success: true, jobs: jobsWithStatus });
  } catch (error) {
    console.error("getOpenJobs:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function getJobById(req, res) {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.json({ success: true, job });
  } catch (error) {
    console.error("getJobById:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function updateJob(req, res) {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.json({ success: true, job });
  } catch (error) {
    console.error("updateJob:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function uploadJobSampleResume(req, res) {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        success: false,
        message:
          "File uploads aren't configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.",
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const { resume, fileName } = req.body;

    if (!resume || typeof resume !== "string") {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const mimeMatch = resume.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch?.[1];

    if (!mimeType || !RESUME_MIME_TYPES[mimeType]) {
      return res.status(400).json({
        success: false,
        message: "Only PDF or Word documents are allowed",
      });
    }

    const base64Data = resume.slice(resume.indexOf(",") + 1);
    const approxBytes = base64Data.length * 0.75;
    const MAX_BYTES = 10 * 1024 * 1024;

    if (approxBytes > MAX_BYTES) {
      return res.status(400).json({ success: false, message: "File is too large. Max 10MB." });
    }

    const upload = await cloudinary.uploader.upload(resume, {
      folder: "intervue/job-sample-resumes",
      public_id: job._id.toString(),
      overwrite: true,
      invalidate: true,
      resource_type: "raw",
      use_filename: true,
      filename_override: fileName || `${job._id}-sample-resume`,
      format: RESUME_MIME_TYPES[mimeType],
    });

    const sampleResumeText = await extractResumeText(resume);

    job.sampleEligibleResumeUrl = upload.secure_url;
    job.sampleResumeText = sampleResumeText;
    await job.save();

    await logAction({
      actor: req.user,
      action: "job.sample_resume_uploaded",
      targetType: "Job",
      targetId: job._id,
      metadata: { title: job.title },
    });

    return res.status(200).json({ success: true, job });
  } catch (error) {
    console.error("uploadJobSampleResume:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function deleteJob(req, res) {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    await Application.deleteMany({ job: job._id });

    await logAction({
      actor: req.user,
      action: "job.deleted",
      targetType: "Job",
      targetId: job._id,
      metadata: { title: job.title },
    });

    return res.json({ success: true, message: "Job deleted" });
  } catch (error) {
    console.error("deleteJob:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
