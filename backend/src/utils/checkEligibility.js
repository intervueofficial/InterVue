const skillAliases = {
  "react.js": "react",
  reactjs: "react",
  react: "react",

  "node.js": "node",
  nodejs: "node",
  node: "node",

  "express.js": "express",
  expressjs: "express",
  express: "express",

  mongodb: "mongo",
  "mongo db": "mongo",
  mongo: "mongo",

  "next.js": "next",
  nextjs: "next",
  next: "next",

  javascript: "javascript",
  js: "javascript",

  typescript: "typescript",
  ts: "typescript",

  html5: "html",
  css3: "css",

  "machine-learning": "machine learning",
  ml: "machine learning",

  ai: "artificial intelligence",
};

function normalizeSkill(skill = "") {
  let normalized = skill
    .trim()
    .toLowerCase()
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ");

  return skillAliases[normalized] || normalized;
}

function skillsMatch(requiredSkill, candidateSkill) {
  const required = normalizeSkill(requiredSkill);
  const candidate = normalizeSkill(candidateSkill);

  return (
    required === candidate ||
    required.includes(candidate) ||
    candidate.includes(required)
  );
}

export function checkEligibility(job, profile) {
  const failedCriteria = [];

  const criteria = job.criteria || {};

  const requiredDegrees = (criteria.requiredDegrees || []).map((degree) =>
    degree.trim().toLowerCase()
  );

  const requiredSkills = criteria.requiredSkills || [];

  const minExperience = Number(criteria.minExperience || 0);

  
  if (requiredDegrees.length > 0) {
    const candidateDegree = (profile.degree || "")
      .trim()
      .toLowerCase();

    const degreeMatched = requiredDegrees.some(
      (degree) => degree === candidateDegree
    );

    if (!degreeMatched) {
      failedCriteria.push(
        `Degree must be one of: ${criteria.requiredDegrees.join(", ")}`
      );
    }
  }

  
  const candidateExperience = Number(
    profile.experienceYears || 0
  );

  if (candidateExperience < minExperience) {
    failedCriteria.push(
      `Requires at least ${minExperience} year(s) of experience`
    );
  }

  
  const candidateSkills = profile.skills || [];

  const missingSkills = requiredSkills.filter((requiredSkill) => {
    return !candidateSkills.some((candidateSkill) =>
      skillsMatch(requiredSkill, candidateSkill)
    );
  });

  if (missingSkills.length > 0) {
    failedCriteria.push(
      `Missing required skill(s): ${missingSkills.join(", ")}`
    );
  }

  return {
    isEligible: failedCriteria.length === 0,
    failedCriteria,
  };
}