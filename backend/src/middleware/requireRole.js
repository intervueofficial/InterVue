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