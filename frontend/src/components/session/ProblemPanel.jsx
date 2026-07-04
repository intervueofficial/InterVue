import { useState } from "react";
import { motion } from "framer-motion";
import { Code2Icon, BookOpenIcon, FlaskConicalIcon, InboxIcon } from "lucide-react";
import { T, DIFF } from "../../constants/sessionTheme";
import {
  Badge,
  TabPill,
  PanelHeader,
  SkeletonBlock,
  Section,
  EmptyPane,
} from "./SessionUI";

/* ─── Problem Panel ─────────────────────────────────────────────────────────── *
 * `problemData` here is the real Problem document pushed by the interviewer
 * (session.activeProblem), populated by the backend:
 *   { title, description, difficulty, tags[], starterCode, testCases[] }
 * ────────────────────────────────────────────────────────────────────────── */
function ProblemPanel({ problemData, session, loading }) {
  const [tab, setTab] = useState("problem");
  const diff = DIFF[problemData?.difficulty?.toLowerCase()] || DIFF.medium;
  const testCases = problemData?.testCases || [];

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
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default ProblemPanel;
