/**
 * Converts a 0-100 numeric score into a plain-language rating label.
 *
 * The AI performance report used to show raw percentages for coding,
 * quiz, and confidence/engagement scores. Those are now replaced
 * end-to-end (PDF, History table, candidate results view) with a
 * simple 5-tier letteric rating so the report reads like human
 * feedback instead of a bare number.
 *
 * Scale (ascending): Worst -> Good -> Better -> Best -> Excellent
 */
export const RATING_SCALE = [
  { max: 20, label: "Worst" },
  { max: 40, label: "Good" },
  { max: 60, label: "Better" },
  { max: 80, label: "Best" },
  { max: Infinity, label: "Excellent" },
];

export function scoreToRating(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return "Not Rated";
  }

  const clamped = Math.max(0, Math.min(100, Number(score)));
  const tier = RATING_SCALE.find((t) => clamped <= t.max);
  return tier ? tier.label : "Not Rated";
}
