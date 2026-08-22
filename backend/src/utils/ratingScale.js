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
