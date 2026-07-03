import { useState } from "react";
import { motion } from "framer-motion";
import {
  HelpCircleIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
} from "lucide-react";
import { T } from "../../constants/sessionTheme";
import { Badge, PanelHeader, SkeletonBlock, Section, EmptyPane } from "./SessionUI";

/* ─── Quiz Panel ─────────────────────────────────────────────────────────────── */
function QuizPanel({ problemData, session, loading }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const questions = problemData?.quiz || [];

  const handleSelect = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.answer).length
    : 0;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: T.bg,
        overflow: "hidden",
      }}
    >
      <PanelHeader>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              color: T.purple,
              background: T.purpleTint,
              outline: `1px solid rgba(101,84,192,0.2)`,
            }}
          >
            <HelpCircleIcon size={10} />
            Quiz
          </div>
          {questions.length > 0 && (
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {submitted && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge
              color={
                score === questions.length
                  ? T.green
                  : score >= questions.length / 2
                    ? T.yellow
                    : T.red
              }
              bg={
                score === questions.length
                  ? T.greenTint
                  : score >= questions.length / 2
                    ? T.yellowTint
                    : T.redTint
              }
              border={
                score === questions.length
                  ? T.greenBorder
                  : score >= questions.length / 2
                    ? T.yellowBorder
                    : T.redBorder
              }
            >
              {score}/{questions.length} Correct
            </Badge>
            <button
              onClick={handleReset}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: T.muted,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                padding: "2px 6px",
                borderRadius: 4,
                transition: "color 0.15s",
              }}
            >
              Retry
            </button>
          </div>
        )}
      </PanelHeader>

      <div style={{ flex: 1, overflowY: "auto" }} className="sp-scroll">
        {loading ? (
          <div
            style={{
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <SkeletonBlock h={16} w="80%" />
                <SkeletonBlock h={36} radius={6} />
                <SkeletonBlock h={36} radius={6} />
                <SkeletonBlock h={36} radius={6} w="70%" />
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <EmptyPane
            icon={HelpCircleIcon}
            title="No quiz questions"
            subtitle="No quiz questions are available for this problem yet."
          />
        ) : (
          <div
            style={{
              padding: "22px 22px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            {questions.map((q, qIdx) => {
              const selected = answers[qIdx];
              const isCorrect = submitted && selected === q.answer;
              const isWrong =
                submitted && selected !== undefined && selected !== q.answer;

              return (
                <div key={qIdx}>
                  <Section title={`Question ${qIdx + 1}`}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: T.dark,
                        lineHeight: 1.65,
                        margin: "0 0 12px",
                      }}
                    >
                      {q.question}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selected === oIdx;
                        const isAnswerKey = submitted && oIdx === q.answer;
                        const isSelectedWrong =
                          submitted && isSelected && oIdx !== q.answer;

                        let bg = T.surface;
                        let border = T.border;
                        let labelColor = T.body;
                        let iconEl = null;

                        if (isAnswerKey) {
                          bg = T.greenTint;
                          border = T.greenBorder;
                          labelColor = T.green;
                          iconEl = (
                            <CheckCircle2Icon size={13} color={T.green} />
                          );
                        } else if (isSelectedWrong) {
                          bg = T.redTint;
                          border = T.redBorder;
                          labelColor = T.red;
                          iconEl = (
                            <AlertTriangleIcon size={13} color={T.red} />
                          );
                        } else if (!submitted && isSelected) {
                          bg = T.blueTint;
                          border = `rgba(24,104,219,0.4)`;
                          labelColor = T.blue;
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelect(qIdx, oIdx)}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "10px 14px",
                              borderRadius: 6,
                              background: bg,
                              border: `1px solid ${border}`,
                              cursor: submitted ? "default" : "pointer",
                              textAlign: "left",
                              fontFamily: "'DM Sans', sans-serif",
                              transition: "all 0.15s",
                            }}
                          >
                            {/* Option letter */}
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 5,
                                flexShrink: 0,
                                background:
                                  !submitted && isSelected
                                    ? T.blue
                                    : isAnswerKey
                                      ? T.green
                                      : isSelectedWrong
                                        ? T.red
                                        : T.surface2,
                                border: `1px solid ${
                                  !submitted && isSelected
                                    ? "rgba(24,104,219,0.3)"
                                    : isAnswerKey
                                      ? T.greenBorder
                                      : isSelectedWrong
                                        ? T.redBorder
                                        : T.border
                                }`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                fontWeight: 800,
                                color:
                                  (!submitted && isSelected) ||
                                  isAnswerKey ||
                                  isSelectedWrong
                                    ? "#fff"
                                    : T.muted,
                                letterSpacing: "0.05em",
                              }}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight:
                                  isSelected || isAnswerKey ? 600 : 500,
                                color: labelColor,
                                flex: 1,
                                lineHeight: 1.5,
                              }}
                            >
                              {opt}
                            </span>
                            {iconEl && (
                              <div style={{ flexShrink: 0 }}>{iconEl}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation shown after submit */}
                    {submitted && q.explanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          marginTop: 10,
                          padding: "10px 14px",
                          borderRadius: 6,
                          background: T.surface2,
                          border: `1px solid ${T.border}`,
                          fontSize: 12,
                          color: T.body,
                          lineHeight: 1.65,
                        }}
                      >
                        <span style={{ fontWeight: 700, color: T.dark }}>
                          Explanation:{" "}
                        </span>
                        {q.explanation}
                      </motion.div>
                    )}
                  </Section>
                </div>
              );
            })}

            {/* Submit button */}
            {!submitted && (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < questions.length}
                style={{
                  alignSelf: "flex-start",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 20px",
                  borderRadius: 5,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  background:
                    Object.keys(answers).length < questions.length
                      ? T.surface2
                      : T.purple,
                  color:
                    Object.keys(answers).length < questions.length
                      ? T.muted
                      : "#fff",
                  cursor:
                    Object.keys(answers).length < questions.length
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    Object.keys(answers).length < questions.length ? 0.7 : 1,
                  boxShadow:
                    Object.keys(answers).length < questions.length
                      ? "none"
                      : "0 2px 8px rgba(101,84,192,0.28)",
                  transition: "all 0.15s",
                }}
              >
                <HelpCircleIcon size={11} />
                Submit Answers
                {Object.keys(answers).length < questions.length && (
                  <span
                    style={{ fontSize: 10, fontWeight: 500, color: T.muted }}
                  >
                    ({Object.keys(answers).length}/{questions.length})
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizPanel;
