export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Interviewer accounts additionally need admin approval before they
    // can use any interviewer-gated route. Admin routes (requireRole
    // never includes "admin" alongside a pending-approval concern here)
    // are unaffected — this only fires when "interviewer" is one of the
    // accepted roles AND the requester actually is one.
    if (
      req.user.role === "interviewer" &&
      req.user.interviewerApproval?.status !== "approved"
    ) {
      return res.status(403).json({
        message:
          req.user.interviewerApproval?.status === "rejected"
            ? "Your interviewer application was not approved."
            : "Your interviewer access is pending admin approval.",
        interviewerApprovalStatus: req.user.interviewerApproval?.status || "pending",
      });
    }

    next();
  };
};