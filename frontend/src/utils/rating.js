/**
 * Mirrors backend/src/utils/ratingScale.js — converts a 0-100 score
 * into a plain-language rating label instead of showing raw
 * percentages in the AI performance report.
 *
 * Scale (ascending): Worst -> Good -> Better -> Best -> Excellent
 */
export function scoreToRating(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return "Not Rated";
  }

  const clamped = Math.max(0, Math.min(100, Number(score)));

  if (clamped <= 20) return "Worst";
  if (clamped <= 40) return "Good";
  if (clamped <= 60) return "Better";
  if (clamped <= 80) return "Best";
  return "Excellent";
}

export const RATING_COLORS = {
  Excellent: { text: "#059669", bg: "#ECFDF5", border: "rgba(5,150,105,0.18)" },
  Best: { text: "#16A34A", bg: "#F0FDF4", border: "rgba(22,163,74,0.18)" },
  Better: { text: "#D97706", bg: "#FFFBEB", border: "rgba(217,119,6,0.18)" },
  Good: { text: "#EA580C", bg: "#FFF7ED", border: "rgba(234,88,12,0.18)" },
  Worst: { text: "#DC2626", bg: "#FEF2F2", border: "rgba(220,38,38,0.18)" },
  "Not Rated": { text: "#6B6B76", bg: "#F5F4F1", border: "#E5E2DC" },
};

export function ratingTokens(rating) {
  return RATING_COLORS[rating] || RATING_COLORS["Not Rated"];
}
