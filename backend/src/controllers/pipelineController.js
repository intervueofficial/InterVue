import Application from "../models/Application.js";

// ==========================
// All applications across every job — the interviewer side
// (pages/interviewer/Applicants.jsx) only ever shows one job's
// applicants at a time; this is the cross-job funnel view for admin.
// Supports optional ?status= and ?job= filters, applied server-side so
// large application tables don't have to ship every row to the client
// just to filter three of them.
// ==========================
export const getAllApplications = async (req, res) => {
  try {
    const { status, job } = req.query;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (job && job !== "all") filter.job = job;

    const applications = await Application.find(filter)
      .populate("candidate", "name email profileImage")
      .populate("job", "title department location")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("getAllApplications:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================
// Funnel counts across all jobs, by status
// ==========================
export const getPipelineStats = async (req, res) => {
  try {
    const byStatusRaw = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const byStatus = { not_eligible: 0, applied: 0, selected: 0, rejected: 0 };
    byStatusRaw.forEach((r) => {
      if (r._id in byStatus) byStatus[r._id] = r.count;
    });

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        byStatus,
      },
    });
  } catch (error) {
    console.error("getPipelineStats:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
