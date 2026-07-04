import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  XIcon,
  Code2Icon,
  HelpCircleIcon,
  SendIcon,
  CheckCircle2Icon,
  SearchIcon,
} from "lucide-react";

import { T, DIFF } from "../../constants/sessionTheme";
import { Badge, SpinnerIcon } from "./SessionUI";
import { problemApi } from "../../api/problemApi";
import { quizApi } from "../../api/quizApi";
import {
  usePushProblem,
  usePushQuiz,
  useClearActiveContent,
} from "../../hooks/useSessions";

/* ─── Interviewer Library Panel ──────────────────────────────────────────────
 * Slide-in drawer that lets the interviewer browse everything the admin has
 * created (problems + quizzes) and push one to the candidate. The candidate
 * side polls the session (see useSessionById) and shows a popup as soon as
 * `activeProblem` / `activeQuiz` changes.
 * ────────────────────────────────────────────────────────────────────────── */
function InterviewerLibraryPanel({ session, onClose }) {
  const [tab, setTab] = useState("problems");
  const [search, setSearch] = useState("");
  const [pushingId, setPushingId] = useState(null);

  const sessionId = session?._id;

  const pushProblemMutation = usePushProblem(sessionId);
  const pushQuizMutation = usePushQuiz(sessionId);
  const clearContentMutation = useClearActiveContent(sessionId);

  const { data: problemsData, isLoading: loadingProblems } = useQuery({
    queryKey: ["library-problems"],
    queryFn: () => problemApi.getProblems(),
    staleTime: 30000,
  });

  const { data: quizzesData, isLoading: loadingQuizzes } = useQuery({
    queryKey: ["library-quizzes"],
    queryFn: () => quizApi.getQuizzes(),
    staleTime: 30000,
  });

  const problems = problemsData?.problems || problemsData || [];
  const quizzes = quizzesData?.quizzes || quizzesData || [];

  const activeProblemId = session?.activeProblem?._id;
  const activeQuizId = session?.activeQuiz?._id;

  const filteredProblems = problems.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuizzes = quizzes.filter((q) =>
    q.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePushProblem = async (problem) => {
    if (problem._id === activeProblemId) return;
    setPushingId(problem._id);
    try {
      await pushProblemMutation.mutateAsync(problem._id);
    } finally {
      setPushingId(null);
    }
  };

  const handlePushQuiz = async (quiz) => {
    if (quiz._id === activeQuizId) return;
    setPushingId(quiz._id);
    try {
      await pushQuizMutation.mutateAsync(quiz._id);
    } finally {
      setPushingId(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(6,13,24,0.55)",
          zIndex: 500,
        }}
      />

      <motion.div
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          maxWidth: "92vw",
          background: T.bg,
          zIndex: 501,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-16px 0 48px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${T.border2}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.dark }}>
              Send to Candidate
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              Push a coding problem or quiz created by the admin
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: T.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <XIcon size={16} color={T.muted} />
          </button>
        </div>

        {/* Currently active */}
        {(session?.activeProblem || session?.activeQuiz) && (
          <div
            style={{
              margin: "14px 20px 0",
              padding: "10px 14px",
              borderRadius: 10,
              background: T.greenTint,
              border: `1px solid ${T.greenBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <CheckCircle2Icon size={14} color={T.green} style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.dark,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Live now:{" "}
                {session?.activeProblem?.title || session?.activeQuiz?.title}
              </span>
            </div>

            <button
              onClick={() => clearContentMutation.mutate()}
              disabled={clearContentMutation.isPending}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.red,
                background: "none",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "14px 20px 0",
          }}
        >
          <button
            onClick={() => setTab("problems")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${tab === "problems" ? "rgba(24,104,219,0.3)" : T.border}`,
              background: tab === "problems" ? T.blueTint : T.surface,
              color: tab === "problems" ? T.blue : T.body,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Code2Icon size={13} />
            Problems ({problems.length})
          </button>

          <button
            onClick={() => setTab("quizzes")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${tab === "quizzes" ? "rgba(101,84,192,0.3)" : T.border}`,
              background: tab === "quizzes" ? T.purpleTint : T.surface,
              color: tab === "quizzes" ? T.purple : T.body,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <HelpCircleIcon size={13} />
            Quizzes ({quizzes.length})
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ position: "relative" }}>
            <SearchIcon
              size={14}
              color={T.muted}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "problems" ? "Search problems…" : "Search quizzes…"}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.surface,
                fontSize: 12.5,
                color: T.dark,
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 24px" }}>
          {tab === "problems" ? (
            loadingProblems ? (
              <ListSkeleton />
            ) : filteredProblems.length === 0 ? (
              <EmptyLibrary text="No coding problems yet. Ask the admin to add some from the Admin dashboard." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredProblems.map((p) => {
                  const diff = DIFF[p.difficulty?.toLowerCase()] || DIFF.medium;
                  const isActive = p._id === activeProblemId;
                  const isPushing = pushingId === p._id;

                  return (
                    <div
                      key={p._id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: `1px solid ${isActive ? T.greenBorder : T.border}`,
                        background: isActive ? T.greenTint : T.surface,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.dark, marginBottom: 5 }}>
                            {p.title}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <Badge color={diff.text} bg={diff.bg} border={diff.border}>
                              {p.difficulty}
                            </Badge>
                            {p.tags?.slice(0, 2).map((tagname) => (
                              <span
                                key={tagname}
                                style={{ fontSize: 10, color: T.muted, fontWeight: 500 }}
                              >
                                #{tagname}
                              </span>
                            ))}
                          </div>
                        </div>

                        <PushButton
                          isActive={isActive}
                          isPushing={isPushing}
                          onClick={() => handlePushProblem(p)}
                          color={T.blue}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : loadingQuizzes ? (
            <ListSkeleton />
          ) : filteredQuizzes.length === 0 ? (
            <EmptyLibrary text="No quizzes yet. Ask the admin to add some from the Admin dashboard." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredQuizzes.map((q) => {
                const diff = DIFF[q.difficulty?.toLowerCase()] || DIFF.medium;
                const isActive = q._id === activeQuizId;
                const isPushing = pushingId === q._id;

                return (
                  <div
                    key={q._id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${isActive ? T.greenBorder : T.border}`,
                      background: isActive ? T.greenTint : T.surface,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.dark, marginBottom: 5 }}>
                          {q.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Badge color={diff.text} bg={diff.bg} border={diff.border}>
                            {q.difficulty}
                          </Badge>
                          <span style={{ fontSize: 10, color: T.muted, fontWeight: 500 }}>
                            {q.questions?.length || 0} question{q.questions?.length !== 1 ? "s" : ""}
                          </span>
                          <span style={{ fontSize: 10, color: T.muted, fontWeight: 500 }}>
                            · {q.duration || 30}m
                          </span>
                        </div>
                      </div>

                      <PushButton
                        isActive={isActive}
                        isPushing={isPushing}
                        onClick={() => handlePushQuiz(q)}
                        color={T.purple}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

function PushButton({ isActive, isPushing, onClick, color }) {
  if (isActive) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "6px 10px",
          borderRadius: 6,
          background: T.greenTint,
          border: `1px solid ${T.greenBorder}`,
          fontSize: 10.5,
          fontWeight: 700,
          color: T.green,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        <CheckCircle2Icon size={11} />
        Sent
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isPushing}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        borderRadius: 6,
        border: "none",
        background: color,
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        cursor: isPushing ? "not-allowed" : "pointer",
        opacity: isPushing ? 0.7 : 1,
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      {isPushing ? <SpinnerIcon size={11} color="#fff" /> : <SendIcon size={11} />}
      {isPushing ? "Sending…" : "Push"}
    </button>
  );
}

function ListSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 62,
            borderRadius: 10,
            background: T.surface2,
            animation: "sp-shimmer 1.4s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

function EmptyLibrary({ text }) {
  return (
    <div
      style={{
        padding: "40px 16px",
        textAlign: "center",
        color: T.muted,
        fontSize: 12.5,
        lineHeight: 1.6,
      }}
    >
      {text}
    </div>
  );
}

export default InterviewerLibraryPanel;
