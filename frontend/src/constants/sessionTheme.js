/* ─── Design Tokens ────────────────────────────────────────────────────────── */
const T = {
  blue: "#1868DB",
  blueHover: "#1558BC",
  blueTint: "#cfe1fd",
  blueMid: "#4A9EE8",
  amber: "#ffab00",
  dark: "#1C2B42",
  body: "#44526C",
  muted: "#6B778C",
  border: "#DFE1E6",
  border2: "#DDDEE1",
  bg: "#FFFFFF",
  surface: "#F8F8F8",
  surface2: "#F4F5F7",
  green: "#00875A",
  greenTint: "rgba(0,135,90,0.08)",
  greenBorder: "rgba(0,135,90,0.2)",
  red: "#DE350B",
  redTint: "rgba(222,53,11,0.08)",
  redBorder: "rgba(222,53,11,0.2)",
  yellow: "#FF8B00",
  yellowTint: "rgba(255,139,0,0.08)",
  yellowBorder: "rgba(255,139,0,0.2)",
  purple: "#6554C0",
  purpleTint: "rgba(101,84,192,0.08)",
};

const DIFF = {
  easy: {
    bg: T.greenTint,
    text: T.green,
    border: T.greenBorder,
    label: "Easy",
  },
  medium: {
    bg: T.yellowTint,
    text: T.yellow,
    border: T.yellowBorder,
    label: "Medium",
  },
  hard: { bg: T.redTint, text: T.red, border: T.redBorder, label: "Hard" },
};

export { T, DIFF };
