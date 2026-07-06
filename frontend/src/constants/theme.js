/**
 * InterVue — "Ashby Light" design tokens
 * Warm off-white canvas, ink-black text, restrained indigo accent.
 * Space Grotesk (display/headings) + DM Sans (body) + JetBrains Mono (labels/code).
 *
 * These are plain hex values (not the exact oklch() from the original design
 * reference) chosen to be visually equivalent while staying consistent with
 * the inline-style + Tailwind hybrid pattern used across the rest of the app.
 */

export const THEME = {
  // Canvas
  background: "#FAFAF8",   // warm off-white page background
  surface: "#FFFFFF",      // card / panel background
  surface2: "#F5F4F1",     // subtle secondary surface (table headers, hover)

  // Text
  ink: "#17171F",          // primary text (near-black, cool undertone)
  inkMuted: "#6B6B76",     // secondary/muted text
  inkFaint: "#9B9BA3",     // placeholder / faint text

  // Borders
  border: "#E5E2DC",
  borderStrong: "#D6D2C9",

  // Primary accent — indigo
  primary: "#4F46E5",
  primaryHover: "#4338CA",
  primaryTint: "#EEF0FC",
  primaryTintBorder: "rgba(79,70,229,0.18)",

  // Semantic
  success: "#059669",
  successTint: "#ECFDF5",
  successBorder: "rgba(5,150,105,0.18)",

  warning: "#D97706",
  warningTint: "#FFFBEB",
  warningBorder: "rgba(217,119,6,0.18)",

  danger: "#DC2626",
  dangerTint: "#FEF2F2",
  dangerBorder: "rgba(220,38,38,0.18)",

  info: "#3B82F6",
  infoTint: "#EFF6FF",
  infoBorder: "rgba(59,130,246,0.18)",

  // Fonts
  fontDisplay: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  fontSans: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",

  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

// Difficulty badge tokens (Easy/Medium/Hard) shared across problem/quiz UI
export const DIFFICULTY = {
  easy: { text: "#059669", bg: "#ECFDF5", border: "rgba(5,150,105,0.18)" },
  medium: { text: "#D97706", bg: "#FFFBEB", border: "rgba(217,119,6,0.18)" },
  hard: { text: "#DC2626", bg: "#FEF2F2", border: "rgba(220,38,38,0.18)" },
};

// Session status badge tokens
export const SESSION_STATUS = {
  scheduled: { text: "#3B82F6", bg: "#EFF6FF", border: "rgba(59,130,246,0.18)", dot: "#3B82F6" },
  waiting: { text: "#D97706", bg: "#FFFBEB", border: "rgba(217,119,6,0.18)", dot: "#D97706" },
  live: { text: "#059669", bg: "#ECFDF5", border: "rgba(5,150,105,0.18)", dot: "#059669" },
  completed: { text: "#6B6B76", bg: "#F5F4F1", border: "#E5E2DC", dot: "#9B9BA3" },
  cancelled: { text: "#DC2626", bg: "#FEF2F2", border: "rgba(220,38,38,0.18)", dot: "#DC2626" },
};
