import Job from "../models/Job.js";
import Application from "../models/Application.js";

// ==========================
// Admin: create a job posting
// ==========================
export async function createJob(req, res) {
  try {
    const {
      title,
      description,
      department,
      location,
      employmentType,
      criteria,
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
      department,
      location,
      employmentType,
      criteria: {
        requiredDegrees: criteria?.requiredDegrees || [],
        minExperience: criteria?.minExperience || 0,
        requiredSkills: criteria?.requiredSkills || [],
        qualificationNote: criteria?.qualificationNote || "",
      },
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, job });
  } catch (error) {
    console.error("createJob:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// ==========================
// Admin: list all jobs (any status)
// ==========================
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

// ==========================
// Candidate: list only open jobs
// ==========================
export async function getOpenJobs(req, res) {
  try {
    const jobs = await Job.find({ status: "open" }).sort({ createdAt: -1 });

    // Attach whether this candidate has already applied to each job
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

// ==========================
// Admin: update a job (details, criteria, or open/close status)
// ==========================
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

// ==========================
// Admin: delete a job
// ==========================
export async function deleteJob(req, res) {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    await Application.deleteMany({ job: job._id });

    return res.json({ success: true, message: "Job deleted" });
  } catch (error) {
    console.error("deleteJob:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
