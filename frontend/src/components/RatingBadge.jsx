import { ratingTokens } from "../utils/rating";

/**
 * Pill badge for a letteric rating (Worst/Good/Better/Best/Excellent).
 * Used anywhere the AI report used to show a raw percentage.
 */
function RatingBadge({ rating, size = "md" }) {
  const tokens = ratingTokens(rating);
  const isSmall = size === "sm";

  return (
    <span
      className="inline-flex items-center rounded-full font-semibold whitespace-nowrap"
      style={{
        fontSize: isSmall ? 10.5 : 12,
        padding: isSmall ? "2px 8px" : "3px 10px",
        color: tokens.text,
        background: tokens.bg,
        boxShadow: `inset 0 0 0 1px ${tokens.border}`,
      }}
    >
      {rating || "Not Rated"}
    </span>
  );
}

export default RatingBadge;
