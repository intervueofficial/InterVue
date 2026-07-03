import { useState } from "react";
import { motion } from "framer-motion";
import { Code2Icon, BookOpenIcon, ListIcon } from "lucide-react";
import { T, DIFF } from "../../constants/sessionTheme";
import {
  Badge,
  TabPill,
  PanelHeader,
  SkeletonBlock,
  Section,
  EmptyPane,
} from "./SessionUI";

/* ─── Problem Panel ─────────────────────────────────────────────────────────── */
function ProblemPanel({ problemData, session, loading }) {
  const [tab, setTab] = useState("problem");
  const diff = DIFF[session?.difficulty] || DIFF.medium;

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
            active={tab === "constraints"}
            onClick={() => setTab("constraints")}
          >
            <ListIcon size={10} /> Constraints
          </TabPill>
        </div>
        {session?.host?.firstName && (
          <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>
            Host:{" "}
            <span style={{ color: T.dark, fontWeight: 600 }}>
              {session.host.firstName}
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
            <div style={{ height: 8 }} />
            <SkeletonBlock h={80} radius={8} />
          </div>
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
                  {problemData?.title || session?.problem || "Loading…"}
                </h2>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                  marginLeft: 42,
                }}
              >
                {session?.difficulty && (
                  <Badge color={diff.text} bg={diff.bg} border={diff.border}>
                    {diff.label}
                  </Badge>
                )}
                {problemData?.category && (
                  <span
                    style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}
                  >
                    {problemData.category}
                  </span>
                )}
              </div>
            </motion.div>

            {problemData?.description && (
              <Section title="Description">
                <p
                  style={{
                    fontSize: 13,
                    color: T.body,
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {problemData.description.text}
                </p>
                {problemData.description.notes?.map((note, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 13,
                      color: T.body,
                      lineHeight: 1.75,
                      margin: "10px 0 0",
                    }}
                  >
                    {note}
                  </p>
                ))}
              </Section>
            )}

            {problemData?.examples?.length > 0 && (
              <Section title="Examples">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {problemData.examples.map((ex, i) => (
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
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
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
                          Example {i + 1}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "12px 14px",
                          fontFamily:
                            "'JetBrains Mono', 'Fira Code', monospace",
                          fontSize: 12,
                        }}
                      >
                        <div
                          style={{ display: "flex", gap: 8, marginBottom: 6 }}
                        >
                          <span
                            style={{
                              color: T.blue,
                              fontWeight: 700,
                              minWidth: 58,
                            }}
                          >
                            Input:
                          </span>
                          <span style={{ color: T.dark }}>{ex.input}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: ex.explanation ? 10 : 0,
                          }}
                        >
                          <span
                            style={{
                              color: T.green,
                              fontWeight: 700,
                              minWidth: 58,
                            }}
                          >
                            Output:
                          </span>
                          <span style={{ color: T.dark }}>{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div
                            style={{
                              paddingTop: 10,
                              borderTop: `1px solid ${T.border2}`,
                              fontSize: 11,
                              color: T.muted,
                              lineHeight: 1.65,
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            <span style={{ fontWeight: 700, color: T.body }}>
                              Explanation:{" "}
                            </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        ) : (
          <div style={{ padding: "22px 22px 32px" }}>
            {problemData?.constraints?.length > 0 ? (
              <Section title="Constraints">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {problemData.constraints.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 6,
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          flexShrink: 0,
                          background: T.blueTint,
                          border: `1px solid rgba(24,104,219,0.2)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 800,
                          color: T.blue,
                          marginTop: 1,
                        }}
                      >
                        {i + 1}
                      </div>
                      <code
                        style={{
                          fontSize: 12,
                          color: T.dark,
                          fontFamily:
                            "'JetBrains Mono', 'Fira Code', monospace",
                          lineHeight: 1.6,
                        }}
                      >
                        {c}
                      </code>
                    </div>
                  ))}
                </div>
              </Section>
            ) : (
              <EmptyPane
                icon={ListIcon}
                title="No constraints listed"
                subtitle="This problem has no explicit constraints."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemPanel;
