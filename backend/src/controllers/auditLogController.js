import AuditLog from "../models/AuditLog.js";

// ==========================
// Paginated audit feed, most recent first
// ?page=1&limit=25
// ==========================
export const getAuditLog = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 100);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      AuditLog.find()
        .populate("actor", "name email profileImage role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    console.error("getAuditLog:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
