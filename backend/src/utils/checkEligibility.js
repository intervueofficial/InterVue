/**
 * Strict eligibility check: every criterion on the job must be
 * satisfied by the candidate's profile, or the application is
 * marked not eligible with the specific reasons listed.
 */
export function checkEligibility(job, profile) {
  const failedCriteria = [];

  const criteria = job.criteria || {};
  const requiredDegrees = (criteria.requiredDegrees || []).map((d) =>
    d.trim().toLowerCase()
  );
  const requiredSkills = (criteria.requiredSkills || []).map((s) =>
    s.trim().toLowerCase()
  );
  const minExperience = criteria.minExperience || 0;

  // Degree — must exactly match one of the accepted degrees
  if (requiredDegrees.length > 0) {
    const candidateDegree = (profile.degree || "").trim().toLowerCase();

    if (!requiredDegrees.includes(candidateDegree)) {
      failedCriteria.push(
        `Degree must be one of: ${criteria.requiredDegrees.join(", ")}`
      );
    }
  }

  // Experience — must meet or exceed minimum
  if (minExperience > 0) {
    const candidateExperience = profile.experienceYears || 0;

    if (candidateExperience < minExperience) {
      failedCriteria.push(
        `Requires at least ${minExperience} year(s) of experience`
      );
    }
  }

  // Skills — every required skill must be present (strict match)
  if (requiredSkills.length > 0) {
    const candidateSkills = (profile.skills || []).map((s) =>
      s.trim().toLowerCase()
    );

    const missingSkills = requiredSkills.filter(
      (skill) => !candidateSkills.includes(skill)
    );

    if (missingSkills.length > 0) {
      failedCriteria.push(`Missing required skill(s): ${missingSkills.join(", ")}`);
    }
  }

  return {
    isEligible: failedCriteria.length === 0,
    failedCriteria,
  };
}
