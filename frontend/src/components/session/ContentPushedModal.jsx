import { motion, AnimatePresence } from "framer-motion";
import { Code2Icon, HelpCircleIcon, ArrowRightIcon } from "lucide-react";
import { T, DIFF } from "../../constants/sessionTheme";
import { Badge } from "./SessionUI";

/* ─── Content Pushed Modal ────────────────────────────────────────────────────
 * Shown to the candidate the moment the interviewer sends a problem or quiz.
 * `kind` is "problem" | "quiz", `item` is the populated Problem/Quiz doc.
 * ────────────────────────────────────────────────────────────────────────── */
function ContentPushedModal({ kind, item, onDismiss }) {
  if (!kind || !item) return null;

  const isProblem = kind === "problem";
  const diff = DIFF[item.difficulty?.toLowerCase()] || DIFF.medium;
  const accent = isProblem ? T.blue : T.purple;
  const accentTint = isProblem ? T.blueTint : T.purpleTint;
  const Icon = isProblem ? Code2Icon : HelpCircleIcon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(6,13,24,0.6)",
          zIndex: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: 420,
            maxWidth: "90vw",
            background: T.bg,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ padding: "28px 28px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: accentTint,
                border: `1px solid ${accent}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Icon size={24} color={accent} />
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: accent,
                marginBottom: 8,
              }}
            >
              {isProblem ? "New Coding Problem" : "New Quiz"}
            </div>

            <h2
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: T.dark,
                margin: "0 0 10px",
                lineHeight: 1.3,
              }}
            >
              {item.title}
            </h2>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {item.difficulty && (
                <Badge color={diff.text} bg={diff.bg} border={diff.border}>
                  {item.difficulty}
                </Badge>
              )}
              {!isProblem && (
                <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>
                  {item.questions?.length || 0} question{item.questions?.length !== 1 ? "s" : ""} ·{" "}
                  {item.duration || 30} min
                </span>
              )}
            </div>

            <p
              style={{
                fontSize: 13,
                color: T.body,
                lineHeight: 1.6,
                margin: "16px 0 0",
              }}
            >
              Your interviewer just sent you {isProblem ? "a coding problem" : "a quiz"}.
              {isProblem ? " Open it to see the description and start coding." : " Open it to start answering."}
            </p>
          </div>

          <div style={{ padding: "0 28px 28px" }}>
            <button
              onClick={onDismiss}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                background: accent,
                color: "#fff",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isProblem ? "Open Problem" : "Start Quiz"}
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ContentPushedModal;
