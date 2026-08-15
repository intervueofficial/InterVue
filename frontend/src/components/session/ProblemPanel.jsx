import { useState } from "react";
import { motion } from "framer-motion";
import { Code2Icon, BookOpenIcon, FlaskConicalIcon, InboxIcon, LightbulbIcon, LockIcon } from "lucide-react";
import { T, DIFF } from "../../constants/sessionTheme";
import {
  Badge,
  TabPill,
  PanelHeader,
  SkeletonBlock,
  Section,
  EmptyPane,
} from "./SessionUI";

/* ─── Hints tab — progressive, LeetCode-style reveal ─────────────────────
 * Sourced entirely from problemData.hints (AI-generated or authored by
 * whoever created the problem) — never hardcoded. Kept intentionally
 * "one at a time" so a candidate has to actively ask for help rather
 * than having every hint dumped on them.
 * ────────────────────────────────────────────────────────────────────── */
function HintsTab({ hints = [] }) {
  const [revealedCount, setRevealedCount] = useState(0);

  if (hints.length === 0) {
    return (
      <EmptyPane
        icon={LightbulbIcon}
        title="No hints available"
        subtitle="This problem doesn't have any hints attached."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {hints.slice(0, revealedCount).map((hint, i) => (
        <div
          key={i}
          style={{
            background: T.blueTint,
            border: `1px solid rgba(24,104,219,0.2)`,
            borderRadius: 8,
            padding: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <LightbulbIcon size={12} color={T.blue} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: T.blue,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Hint {i + 1}
            </span>
          </div>
          <p style={{ fontSize: 13, color: T.dark, lineHeight: 1.6, margin: 0 }}>
            {hint}
          </p>
        </div>
      ))}

      {revealedCount < hints.length && (
        <button
          onClick={() => setRevealedCount((c) => c + 1)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 12.5,
            fontWeight: 600,
            padding: "12px 0",
            borderRadius: 8,
            border: `1px dashed ${T.border}`,
            background: "transparent",
            color: T.muted,
            cursor: "pointer",
          }}
        >
          <LockIcon size={12} />
          Reveal Hint {revealedCount + 1} of {hints.length}
        </button>
      )}
    </div>
  );
}

/* ─── Problem Panel ─────────────────────────────────────────────────────────── *
 * `problemData` here is the real Problem document pushed by the interviewer
 * (session.activeProblem), populated by the backend:
 *   { title, description, difficulty, tags[], starterCode, testCases[], hints[] }
 * ────────────────────────────────────────────────────────────────────────── */
function ProblemPanel({ problemData, session, loading }) {
  const [tab, setTab] = useState("problem");
  const diff = DIFF[problemData?.difficulty?.toLowerCase()] || DIFF.medium;
  const testCases = problemData?.testCases || [];
  const hints = problemData?.hints || [];

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
          <TabPill active={tab === "problem"} onClick={() => setTab("problem")}>
            <BookOpenIcon size={10} /> Problem
          </TabPill>
          <TabPill
            active={tab === "testcases"}
            onClick={() => setTab("testcases")}
          >
            <FlaskConicalIcon size={10} /> Test Cases
          </TabPill>
          <TabPill active={tab === "hints"} onClick={() => setTab("hints")}>
            <LightbulbIcon size={10} /> Hints
          </TabPill>
        </div>
        {session?.interviewer?.name && (
          <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>
            Interviewer:{" "}
            <span style={{ color: T.dark, fontWeight: 600 }}>
              {session.interviewer.name}
            </span>
          </span>
        )}
      </PanelHeader>

      <div style={{ flex: 1, overflowY: "auto" }} className="sp-scroll">
        {loading ? (
          <div
            style={{
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <SkeletonBlock h={22} w="65%" />
            <SkeletonBlock h={13} w="40%" />
            <div style={{ height: 12 }} />
            <SkeletonBlock h={13} />
            <SkeletonBlock h={13} w="90%" />
            <SkeletonBlock h={13} w="75%" />
          </div>
        ) : !problemData ? (
          <EmptyPane
            icon={InboxIcon}
            title="No problem sent yet"
            subtitle="Your interviewer hasn't pushed a coding problem to this session yet. It will appear here as soon as they do."
          />
        ) : tab === "problem" ? (
          <div style={{ padding: "22px 22px 32px" }}>
            <motion.div
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 7,
                    flexShrink: 0,
                    background: T.blueTint,
                    border: `1px solid rgba(24,104,219,0.2)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Code2Icon size={14} color={T.blue} />
                </div>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: T.dark,
                    letterSpacing: "-0.3px",
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {problemData.title}
                </h2>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                  marginLeft: 42,
                  flexWrap: "wrap",
                }}
              >
                {problemData.difficulty && (
                  <Badge color={diff.text} bg={diff.bg} border={diff.border}>
                    {diff.label}
                  </Badge>
                )}
                {problemData.tags?.map((tagname) => (
                  <span
                    key={tagname}
                    style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}
                  >
                    #{tagname}
                  </span>
                ))}
              </div>
            </motion.div>

            {problemData.description && (
              <Section title="Description">
                <p
                  style={{
                    fontSize: 13,
                    color: T.body,
                    lineHeight: 1.75,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {problemData.description}
                </p>
              </Section>
            )}
          </div>
        ) : tab === "testcases" ? (
          <div style={{ padding: "22px 22px 32px" }}>
            {testCases.length > 0 ? (
              <Section title="Test Cases">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {testCases.map((tc, i) => (
                    <div
                      key={i}
                      style={{
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          padding: "7px 14px",
                          borderBottom: `1px solid ${T.border2}`,
                          background: T.surface2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: T.blue,
                            background: T.blueTint,
                            border: `1px solid rgba(24,104,219,0.2)`,
                            padding: "1px 6px",
                            borderRadius: 2,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          Case {i + 1}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "12px 14px",
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: T.blue, fontWeight: 700, minWidth: 58 }}>
                            Input:
                          </span>
                          <span style={{ color: T.dark }}>{tc.input}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ color: T.green, fontWeight: 700, minWidth: 58 }}>
                            Output:
                          </span>
                          <span style={{ color: T.dark }}>{tc.expectedOutput}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            ) : (
              <EmptyPane
                icon={FlaskConicalIcon}
                title="No test cases listed"
                subtitle="This problem has no sample test cases attached."
              />
            )}
          </div>
        ) : (
          <div style={{ padding: "22px 22px 32px" }}>
            <Section title="Hints">
              <HintsTab hints={hints} />
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemPanel;
