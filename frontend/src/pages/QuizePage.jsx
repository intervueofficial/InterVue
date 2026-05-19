import { useState, useEffect, useRef } from "react";

import Navbar from "../components/Navbar";
import CreateSessionModal from "../components/CreateSessionModal";
import { motion, AnimatePresence } from "framer-motion";
// ─── Question Bank ────────────────────────────────────────────────────────────
const QUESTION_BANK = {
  frontend: [
    {
      id: 1,
      question: "Which CSS property is used to create a flex container?",
      options: ["display: flex", "position: flex", "float: flex", "layout: flex"],
      answer: 0,
    },
    {
      id: 2,
      question: "What does the 'useEffect' hook do in React?",
      options: [
        "Manages component state",
        "Handles side effects in functional components",
        "Creates reusable logic across components",
        "Optimizes re-rendering performance",
      ],
      answer: 1,
    },
    {
      id: 3,
      question: "What is the output of `typeof null` in JavaScript?",
      options: ["'null'", "'undefined'", "'object'", "'boolean'"],
      answer: 2,
    },
    {
      id: 4,
      question: "Which hook replaces componentDidMount in React functional components?",
      options: ["useState", "useCallback", "useEffect with empty deps []", "useMemo"],
      answer: 2,
    },
    {
      id: 5,
      question: "What is CSS specificity order from lowest to highest?",
      options: [
        "Element → Class → ID → Inline",
        "Inline → ID → Class → Element",
        "ID → Class → Element → Inline",
        "Class → Element → ID → Inline",
      ],
      answer: 0,
    },
    {
      id: 6,
      question: "Which JavaScript method returns a new array with elements that pass a test?",
      options: [".map()", ".find()", ".filter()", ".reduce()"],
      answer: 2,
    },
    {
      id: 7,
      question: "What does 'event.preventDefault()' do?",
      options: [
        "Stops event propagation",
        "Prevents the default browser behavior",
        "Removes the event listener",
        "Delays the event execution",
      ],
      answer: 1,
    },
    {
      id: 8,
      question: "In React, keys in lists should be:",
      options: [
        "Random numbers",
        "Array indexes always",
        "Stable, unique identifiers",
        "Component names",
      ],
      answer: 2,
    },
    {
      id: 9,
      question: "Which CSS unit is relative to the viewport width?",
      options: ["em", "rem", "vw", "px"],
      answer: 2,
    },
    {
      id: 10,
      question: "What is the purpose of the 'key' prop in React?",
      options: [
        "Encrypts component data",
        "Helps React identify which items changed in a list",
        "Sets component priority",
        "Links components together",
      ],
      answer: 1,
    },
    {
      id: 11,
      question: "Which of these is NOT a JavaScript promise state?",
      options: ["Pending", "Resolved", "Fulfilled", "Rejected"],
      answer: 1,
    },
    {
      id: 12,
      question: "What does CSS 'z-index' control?",
      options: ["Element zoom level", "Stacking order of elements", "Element opacity", "Font size"],
      answer: 1,
    },
  ],
  backend: [
    {
      id: 1,
      question: "What does REST stand for in REST API?",
      options: [
        "Remote Execution State Transfer",
        "Representational State Transfer",
        "Resource Endpoint State Transfer",
        "Remote Service Transfer",
      ],
      answer: 1,
    },
    {
      id: 2,
      question: "Which HTTP status code means 'Resource Not Found'?",
      options: ["400", "401", "403", "404"],
      answer: 3,
    },
    {
      id: 3,
      question: "What is the primary purpose of database indexing?",
      options: [
        "Encrypt stored data",
        "Speed up query performance",
        "Reduce storage size",
        "Enforce data integrity",
      ],
      answer: 1,
    },
    {
      id: 4,
      question: "Which SQL clause is used to filter aggregated results?",
      options: ["WHERE", "FILTER", "HAVING", "GROUP BY"],
      answer: 2,
    },
    {
      id: 5,
      question: "What is a microservice architecture?",
      options: [
        "A single large application",
        "Small services that communicate over APIs",
        "Compressed server code",
        "A lightweight server framework",
      ],
      answer: 1,
    },
    {
      id: 6,
      question: "What does JWT stand for?",
      options: [
        "JSON Web Token",
        "JavaScript Web Transfer",
        "Java Web Technology",
        "JSON Workflow Transfer",
      ],
      answer: 0,
    },
    {
      id: 7,
      question: "Which of these is a NoSQL database?",
      options: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"],
      answer: 2,
    },
    {
      id: 8,
      question: "What is the purpose of middleware in Express.js?",
      options: [
        "Render HTML templates",
        "Connect to databases",
        "Process requests before reaching route handlers",
        "Manage environment variables",
      ],
      answer: 2,
    },
    {
      id: 9,
      question: "What does ACID stand for in databases?",
      options: [
        "Atomicity, Consistency, Isolation, Durability",
        "Accuracy, Consistency, Integrity, Durability",
        "Atomicity, Concurrency, Isolation, Dependency",
        "Access, Control, Integrity, Durability",
      ],
      answer: 0,
    },
    {
      id: 10,
      question: "Which HTTP method is idempotent and used to update a resource?",
      options: ["POST", "PATCH", "PUT", "DELETE"],
      answer: 2,
    },
    {
      id: 11,
      question: "What is the purpose of a load balancer?",
      options: [
        "Store session data",
        "Distribute traffic across multiple servers",
        "Encrypt network traffic",
        "Cache database queries",
      ],
      answer: 1,
    },
    {
      id: 12,
      question: "What does ORM stand for?",
      options: [
        "Object Relational Mapping",
        "Open Resource Model",
        "Optimized Request Manager",
        "Object Response Method",
      ],
      answer: 0,
    },
  ],
  tester: [
    {
      id: 1,
      question: "What is the difference between black-box and white-box testing?",
      options: [
        "Black-box tests UI only; white-box tests APIs only",
        "Black-box tests without code knowledge; white-box tests with code knowledge",
        "Black-box is manual; white-box is automated",
        "Black-box is for backend; white-box is for frontend",
      ],
      answer: 1,
    },
    {
      id: 2,
      question: "What does TDD stand for?",
      options: [
        "Test Driven Development",
        "Technical Design Document",
        "Test Data Definition",
        "Total Defect Detection",
      ],
      answer: 0,
    },
    {
      id: 3,
      question: "Which Selenium locator is generally most preferred?",
      options: ["XPath", "CSS Selector", "ID", "Class Name"],
      answer: 2,
    },
    {
      id: 4,
      question: "What is regression testing?",
      options: [
        "Testing new features only",
        "Verifying old features still work after changes",
        "Testing performance under load",
        "Testing security vulnerabilities",
      ],
      answer: 1,
    },
    {
      id: 5,
      question: "What does a test case 'expected result' represent?",
      options: [
        "What the system currently does",
        "The predicted correct system output",
        "The input data provided",
        "The environment configuration",
      ],
      answer: 1,
    },
    {
      id: 6,
      question: "Which testing type validates the system against business requirements?",
      options: ["Unit Testing", "Integration Testing", "UAT (User Acceptance Testing)", "Smoke Testing"],
      answer: 2,
    },
    {
      id: 7,
      question: "What is a 'smoke test'?",
      options: [
        "A performance test under load",
        "A shallow test to verify basic functionality works",
        "A test that checks memory leaks",
        "A test run in production",
      ],
      answer: 1,
    },
    {
      id: 8,
      question: "In agile testing, when should testing ideally begin?",
      options: [
        "After all development is complete",
        "During the design phase only",
        "From the very beginning of the sprint",
        "Only before release",
      ],
      answer: 2,
    },
    {
      id: 9,
      question: "What is boundary value analysis?",
      options: [
        "Testing only invalid inputs",
        "Testing at the edges of valid input ranges",
        "Testing database boundaries",
        "Testing UI component sizes",
      ],
      answer: 1,
    },
    {
      id: 10,
      question: "What is the purpose of a defect severity rating?",
      options: [
        "Measure developer performance",
        "Indicate the impact of a bug on the system",
        "Track how long a bug has been open",
        "Assign bugs to team members",
      ],
      answer: 1,
    },
    {
      id: 11,
      question: "Which tool is commonly used for API testing?",
      options: ["Selenium", "Postman", "Jest", "Cypress"],
      answer: 1,
    },
    {
      id: 12,
      question: "What does 'test coverage' measure?",
      options: [
        "Number of test cases written",
        "Time spent testing",
        "Percentage of code exercised by tests",
        "Number of bugs found",
      ],
      answer: 2,
    },
  ],
};

const ROLES = [
  {
    id: "frontend",
    title: "Frontend Developer",
    icon: "⬡",
    description: "HTML, CSS, JavaScript, React & browser APIs",
    color: "#2563EB",
    light: "#EFF6FF",
    border: "#BFDBFE",
    tag: "UI / UX Engineering",
  },
  {
    id: "backend",
    title: "Backend Developer",
    icon: "⬢",
    description: "APIs, databases, server architecture & security",
    color: "#0EA5E9",
    light: "#F0F9FF",
    border: "#BAE6FD",
    tag: "Server / Data Engineering",
  },
  {
    id: "tester",
    title: "QA Engineer",
    icon: "◈",
    description: "Testing strategies, automation & QA processes",
    color: "#6366F1",
    light: "#EEF2FF",
    border: "#C7D2FE",
    tag: "Quality Assurance",
  },
];

// Pick 10 questions randomly from the 12 available
function pickQuestions(role) {
  const pool = [...QUESTION_BANK[role]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 10);
}

// ─── Timer hook ───────────────────────────────────────────────────────────────
function useTimer(active, onExpire) {
  const [seconds, setSeconds] = useState(600); // 10 min
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    ref.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(ref.current); onExpire(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [active]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const pct = (seconds / 600) * 100;
  return { mm, ss, pct, seconds };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuizPage() {
  // PAGES: "landing" | "role" | "quiz" | "result"
  const [page, setPage] = useState("landing");
  const [selectedRole, setSelectedRole] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [flagged, setFlagged] = useState({});
  const [score, setScore] = useState(null);
  const [animDir, setAnimDir] = useState("right");

  const timerActive = page === "quiz" && !submitted;
  const { mm, ss, pct: timerPct } = useTimer(timerActive, handleSubmit);

  function startQuiz(roleId) {
    setSelectedRole(roleId);
    setPage("quiz");
    const qs = pickQuestions(roleId);
    setQuestions(qs);
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setFlagged({});
    setScore(null);
  }

  function handleAnswer(optIdx) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [current]: optIdx }));
  }

  function navigate(dir) {
    setAnimDir(dir);
    if (dir === "right" && current < questions.length - 1) setCurrent((c) => c + 1);
    if (dir === "left" && current > 0) setCurrent((c) => c - 1);
  }

  function toggleFlag() {
    setFlagged((f) => ({ ...f, [current]: !f[current] }));
  }

  function handleSubmit() {
    if (submitted) return;
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    setPage("result");
  }

  const answeredCount = Object.keys(answers).length;
  const roleData = ROLES.find((r) => r.id === selectedRole);

  // ── LANDING PAGE ─────────────────────────────────────────────────────────────
  if (page === "landing") {
    return (
      <div style={S.root}>
        <GlobalStyles />
 <Navbar />
        <div style={S.landingWrap}>
          <div style={{ ...S.badge, animationDelay: "0s" }}>
            <span style={S.badgeDot} />
            ASSESSMENT CENTER
          </div>
          <h1 style={S.landingH1} className="fade-up-1">
            Evaluate Technical<br />
            <span style={S.landingAccent}>Excellence</span>
          </h1>
          <p style={S.landingSubtitle} className="fade-up-2">
            Role-specific quizzes with instant scoring. Pick your discipline and prove your depth.
          </p>
          <div style={S.landingCards} className="fade-up-3">
            {ROLES.map((r) => (
              <button key={r.id} style={S.landingCard} className="role-card" onClick={() => startQuiz(r.id)}>
                <div style={{ ...S.landingCardIcon, background: r.light, color: r.color }}>{r.icon}</div>
                <div>
                  <p style={S.landingCardTag}>{r.tag}</p>
                  <p style={S.landingCardTitle}>{r.title}</p>
                  <p style={S.landingCardDesc}>{r.description}</p>
                </div>
                <div style={{ ...S.landingCardArrow, color: r.color }}>→</div>
              </button>
            ))}
          </div>
          <div style={S.landingMeta} className="fade-up-4">
            <div style={S.metaPill}><span style={S.metaNum}>10</span> Questions</div>
            <div style={S.metaDivider} />
            <div style={S.metaPill}><span style={S.metaNum}>10</span> Minutes</div>
            <div style={S.metaDivider} />
            <div style={S.metaPill}><span style={S.metaNum}>3</span> Roles</div>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ PAGE ─────────────────────────────────────────────────────────────────
  if (page === "quiz") {
    const q = questions[current];
    const timerDanger = timerPct < 25;
    return (
      <div style={S.root}>
        <GlobalStyles />
<Navbar></Navbar>

        <div style={S.quizLayout}>
          {/* Sidebar */}
          <aside style={S.sidebar}>
            <div style={S.sideRole}>
              <div style={{ ...S.sideRoleIcon, background: roleData.light, color: roleData.color }}>{roleData.icon}</div>
              <div>
                <p style={S.sideRoleTag}>{roleData.tag}</p>
                <p style={S.sideRoleTitle}>{roleData.title}</p>
              </div>
            </div>

            <div style={S.sideProgress}>
              <div style={S.sideProgressRow}>
                <span style={S.sideProgressLabel}>Progress</span>
                <span style={S.sideProgressVal}>{answeredCount}/{questions.length}</span>
              </div>
              <div style={S.sideProgressTrack}>
                <div style={{ ...S.sideProgressFill, width: `${(answeredCount / questions.length) * 100}%`, background: roleData.color }} />
              </div>
            </div>

            <div style={S.sideGrid}>
              {questions.map((_, i) => {
                const isAnswered = answers[i] !== undefined;
                const isCurrent = i === current;
                const isFlagged = flagged[i];
                return (
                  <button
                    key={i}
                    style={{
                      ...S.sideGridBtn,
                      background: isCurrent ? roleData.color : isAnswered ? roleData.light : "#F8FAFC",
                      color: isCurrent ? "#fff" : isAnswered ? roleData.color : "#94A3B8",
                      borderColor: isCurrent ? roleData.color : isAnswered ? roleData.border : "#E2E8F0",
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                    onClick={() => setCurrent(i)}
                  >
                    {isFlagged ? "⚑" : i + 1}
                  </button>
                );
              })}
            </div>

            <div style={S.sideLegend}>
              <div style={S.legendItem}><div style={{ ...S.legendDot, background: roleData.color }} /> Current</div>
              <div style={S.legendItem}><div style={{ ...S.legendDot, background: roleData.light, border: `1px solid ${roleData.border}` }} /> Answered</div>
              <div style={S.legendItem}><div style={{ ...S.legendDot, background: "#F8FAFC", border: "1px solid #E2E8F0" }} /> Unanswered</div>
            </div>
            <div style={{ ...S.timerPill, background: timerDanger ? "#FEF2F2" : "#EFF6FF", borderColor: timerDanger ? "#FECACA" : "#BFDBFE", color: timerDanger ? "#DC2626" : "#2563EB" }}>
              <span style={{ fontSize: 11 }}>⏱</span> {mm}:{ss}
            </div>
            <button
              style={{ ...S.submitBtn, background: answeredCount === questions.length ? roleData.color : "#94A3B8", cursor: answeredCount === questions.length ? "pointer" : "not-allowed" }}
              onClick={handleSubmit}
            >
              Submit Quiz
            </button>
            {answeredCount < questions.length && (
              <p style={S.submitNote}>{questions.length - answeredCount} question{questions.length - answeredCount > 1 ? "s" : ""} remaining</p>
            )}
          </aside>

          {/* Question area */}
          <main style={S.questionArea} key={current} className="q-enter">
            <div style={S.questionHeader}>
              <span style={S.qNumber}>Question {current + 1} <span style={{ color: "#CBD5E1" }}>/ {questions.length}</span></span>
              <button style={{ ...S.flagBtn, color: flagged[current] ? "#F59E0B" : "#CBD5E1" }} onClick={toggleFlag}>
                {flagged[current] ? "⚑ Flagged" : "⚐ Flag"}
              </button>
            </div>

            <div style={S.qTimerBar}>
              <div style={{ ...S.qTimerFill, width: `${timerPct}%`, background: timerDanger ? "#EF4444" : "#2563EB" }} />
            </div>

            <h2 style={S.questionText}>{q.question}</h2>

            <div style={S.optionsList}>
              {q.options.map((opt, i) => {
                const isSelected = answers[current] === i;
                return (
                  <button
                    key={i}
                    style={{
                      ...S.optionBtn,
                      borderColor: isSelected ? roleData.color : "#E2E8F0",
                      background: isSelected ? roleData.light : "#FAFCFF",
                      boxShadow: isSelected ? `0 0 0 1px ${roleData.color}` : "none",
                    }}
                    className="option-btn"
                    onClick={() => handleAnswer(i)}
                  >
                    <span style={{ ...S.optionLetter, background: isSelected ? roleData.color : "#F1F5F9", color: isSelected ? "#fff" : "#64748B" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ ...S.optionText, color: isSelected ? "#1E3A5F" : "#374151", fontWeight: isSelected ? 500 : 400 }}>{opt}</span>
                    {isSelected && <span style={{ ...S.optionCheck, color: roleData.color }}>✓</span>}
                  </button>
                );
              })}
            </div>

            <div style={S.questionNav}>
              <button style={{ ...S.navArrow, opacity: current === 0 ? 0.3 : 1 }} onClick={() => navigate("left")} disabled={current === 0}>
                ← Previous
              </button>
              <span style={S.navDots}>
                {questions.map((_, i) => (
                  <span key={i} style={{ ...S.navDot, background: i === current ? roleData.color : answers[i] !== undefined ? roleData.border : "#E2E8F0" }} />
                ))}
              </span>
              {current < questions.length - 1 ? (
                <button style={S.navArrow} onClick={() => navigate("right")}>Next →</button>
              ) : (
                <button style={{ ...S.navArrow, color: "#2563EB", fontWeight: 600 }} onClick={handleSubmit}>
                  Finish ✓
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── RESULT PAGE ───────────────────────────────────────────────────────────────
  if (page === "result") {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 90 ? "Exceptional" : pct >= 70 ? "Proficient" : pct >= 50 ? "Developing" : "Needs Work";
    const gradeColor = pct >= 90 ? "#059669" : pct >= 70 ? "#2563EB" : pct >= 50 ? "#D97706" : "#DC2626";
    const gradeBg = pct >= 90 ? "#ECFDF5" : pct >= 70 ? "#EFF6FF" : pct >= 50 ? "#FFFBEB" : "#FEF2F2";

    return (
      <div style={S.root}>
        <GlobalStyles />
        <div style={S.topbar}>
          <div style={S.logo}>
            <div style={S.logoIcon}>⬡</div>
            <span style={S.logoText}>InterVue</span>
            <span style={S.logoCap}>Code Together</span>
          </div>
          <nav style={S.nav}>
            <button style={S.navBtn} onClick={() => setPage("landing")}>Dashboard</button>
            <div style={S.avatar}>I</div>
          </nav>
        </div>

        <div style={S.resultWrap}>
          <div style={S.resultCard} className="fade-up-1">
            {/* Score header */}
            <div style={S.resultTop}>
              <div style={{ ...S.gradeBadge, background: gradeBg, color: gradeColor, borderColor: gradeColor + "33" }}>
                {grade}
              </div>
              <h2 style={S.resultTitle}>Quiz Complete</h2>
              <p style={S.resultSubtitle}>{roleData.title} Assessment</p>

              <div style={S.scoreCircleWrap}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="68" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                  <circle
                    cx="80" cy="80" r="68"
                    fill="none"
                    stroke={gradeColor}
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 68}`}
                    strokeDashoffset={`${2 * Math.PI * 68 * (1 - pct / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,.68,0,1.2)" }}
                  />
                </svg>
                <div style={S.scoreCenter}>
                  <span style={{ ...S.scorePct, color: gradeColor }}>{pct}%</span>
                  <span style={S.scoreRaw}>{score}/{questions.length}</span>
                </div>
              </div>

              <div style={S.resultStats}>
                <div style={S.statItem}>
                  <span style={{ ...S.statNum, color: "#059669" }}>{score}</span>
                  <span style={S.statLabel}>Correct</span>
                </div>
                <div style={S.statDivider} />
                <div style={S.statItem}>
                  <span style={{ ...S.statNum, color: "#DC2626" }}>{questions.length - score}</span>
                  <span style={S.statLabel}>Incorrect</span>
                </div>
                <div style={S.statDivider} />
                <div style={S.statItem}>
                  <span style={{ ...S.statNum, color: "#2563EB" }}>{questions.length}</span>
                  <span style={S.statLabel}>Total</span>
                </div>
              </div>
            </div>

            {/* Answer review */}
            <div style={S.reviewSection}>
              <h3 style={S.reviewTitle}>Answer Review</h3>
              <div style={S.reviewList}>
                {questions.map((q, i) => {
                  const userAns = answers[i];
                  const correct = q.answer;
                  const isRight = userAns === correct;
                  const isSkipped = userAns === undefined;
                  return (
                    <div key={i} style={{ ...S.reviewItem, borderColor: isRight ? "#BBF7D0" : isSkipped ? "#E2E8F0" : "#FECACA", background: isRight ? "#F0FDF4" : isSkipped ? "#F8FAFC" : "#FFF5F5" }}>
                      <div style={S.reviewItemHeader}>
                        <span style={{ ...S.reviewBadge, background: isRight ? "#059669" : isSkipped ? "#94A3B8" : "#DC2626", }}>
                          {isRight ? "✓" : isSkipped ? "–" : "✗"} Q{i + 1}
                        </span>
                        <span style={{ ...S.reviewStatus, color: isRight ? "#059669" : isSkipped ? "#94A3B8" : "#DC2626" }}>
                          {isRight ? "Correct" : isSkipped ? "Skipped" : "Incorrect"}
                        </span>
                      </div>
                      <p style={S.reviewQ}>{q.question}</p>
                      {!isRight && (
                        <div style={S.reviewAnswers}>
                          {!isSkipped && (
                            <p style={S.reviewWrong}>Your answer: <strong>{q.options[userAns]}</strong></p>
                          )}
                          <p style={S.reviewCorrect}>Correct answer: <strong>{q.options[correct]}</strong></p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={S.resultActions}>
              <button style={S.retakeBtn} onClick={() => startQuiz(selectedRole)}>Retake Quiz</button>
              <button style={S.changeRoleBtn} onClick={() => setPage("landing")}>Try Another Role</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// ─── Global Styles ────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes qEnter{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
      .fade-up-1{animation:fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 0.05s both}
      .fade-up-2{animation:fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 0.15s both}
      .fade-up-3{animation:fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 0.25s both}
      .fade-up-4{animation:fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) 0.35s both}
      .q-enter{animation:qEnter 0.3s cubic-bezier(.22,.68,0,1.2) both}
      .role-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,99,235,0.10)!important}
      .option-btn:hover{border-color:#93C5FD!important;background:#F0F9FF!important}
      button{cursor:pointer;font-family:inherit}
      a{text-decoration:none}
    `}</style>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  root: {
    minHeight: "100vh",
    background: "#F8FAFF",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: "#0F172A",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    height: 64,
    background: "#fff",
    borderBottom: "1px solid #E8EFF8",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: {
    width: 34, height: 34, borderRadius: 10,
    background: "linear-gradient(135deg,#3B82F6,#6366F1)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, fontWeight: 700,
  },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#1E3A5F" },
  logoCap: { fontSize: 10, color: "#94A3B8", letterSpacing: "0.05em", marginTop: 1 },
  nav: { display: "flex", alignItems: "center", gap: 20 },
  navLink: { fontSize: 13, color: "#64748B", fontWeight: 500 },
  navActive: {
    background: "#2563EB", color: "#fff", padding: "6px 14px",
    borderRadius: 8, fontSize: 13, fontWeight: 500,
  },
  navBtn: {
    fontSize: 13, color: "#2563EB", fontWeight: 500,
    background: "none", border: "1px solid #BFDBFE",
    padding: "6px 14px", borderRadius: 8,
    transition: "background 0.15s",
  },
  timerPill: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "6px 14px", borderRadius: 20,
    border: "1px solid", fontSize: 13, fontWeight: 600,
    transition: "all 0.3s",
  },
  avatar: {
    width: 34, height: 34, borderRadius: "50%",
    background: "#2563EB", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 600, fontSize: 13,
  },

  // LANDING
  landingWrap: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "72px 24px 80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#EFF6FF", color: "#2563EB", borderRadius: 20,
    padding: "4px 14px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
    border: "1px solid #BFDBFE", marginBottom: 28,
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: "50%", background: "#2563EB",
  },
  landingH1: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(36px,5vw,56px)",
    fontWeight: 800,
    lineHeight: 1.1,
    color: "#0F172A",
    marginBottom: 16,
  },
  landingAccent: {
    background: "linear-gradient(90deg,#2563EB,#6366F1)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  landingSubtitle: {
    fontSize: 16, color: "#64748B", lineHeight: 1.7,
    maxWidth: 480, marginBottom: 48,
  },
  landingCards: {
    width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 40,
  },
  landingCard: {
    display: "flex", alignItems: "center", gap: 16,
    background: "#fff", border: "1px solid #E8EFF8",
    borderRadius: 14, padding: "20px 24px",
    textAlign: "left", transition: "all 0.2s",
    boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
  },
  landingCardIcon: {
    width: 48, height: 48, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, flexShrink: 0,
  },
  landingCardTag: { fontSize: 10, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 },
  landingCardTitle: { fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 3 },
  landingCardDesc: { fontSize: 12, color: "#64748B" },
  landingCardArrow: { marginLeft: "auto", fontSize: 20, flexShrink: 0, transition: "transform 0.2s" },
  landingMeta: {
    display: "flex", alignItems: "center", gap: 16,
    background: "#fff", border: "1px solid #E8EFF8",
    borderRadius: 40, padding: "12px 24px",
  },
  metaPill: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B" },
  metaNum: { fontWeight: 700, color: "#2563EB", fontSize: 14 },
  metaDivider: { width: 1, height: 16, background: "#E2E8F0" },

  // QUIZ LAYOUT
  quizLayout: {
    display: "flex", height: "calc(100vh - 64px)", overflow: "hidden",
  },
  sidebar: {
    width: 260, flexShrink: 0,
    background: "#fff", borderRight: "1px solid #E8EFF8",
    padding: "24px 16px", display: "flex", flexDirection: "column", gap: 20,
    overflowY: "auto",
  },
  sideRole: { display: "flex", alignItems: "center", gap: 10 },
  sideRoleIcon: {
    width: 36, height: 36, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
  },
  sideRoleTag: { fontSize: 9, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" },
  sideRoleTitle: { fontSize: 13, fontWeight: 600, color: "#0F172A" },
  sideProgress: {},
  sideProgressRow: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  sideProgressLabel: { fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" },
  sideProgressVal: { fontSize: 11, fontWeight: 600, color: "#2563EB" },
  sideProgressTrack: { height: 4, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" },
  sideProgressFill: { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
  sideGrid: {
    display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6,
  },
  sideGridBtn: {
    height: 34, borderRadius: 8, border: "1px solid",
    fontSize: 12, fontWeight: 500, transition: "all 0.15s",
  },
  sideLegend: { display: "flex", flexDirection: "column", gap: 6 },
  legendItem: { display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#64748B" },
  legendDot: { width: 8, height: 8, borderRadius: 3, flexShrink: 0 },
  submitBtn: {
    width: "100%", padding: "12px",
    borderRadius: 10, border: "none",
    color: "#fff", fontSize: 13, fontWeight: 600,
    transition: "opacity 0.2s, transform 0.15s",
    marginTop: "auto",
  },
  submitNote: { fontSize: 10, color: "#94A3B8", textAlign: "center" },

  // QUESTION AREA
  questionArea: {
    flex: 1, overflowY: "auto",
    padding: "40px 48px",
    display: "flex", flexDirection: "column", gap: 0,
  },
  questionHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  qNumber: { fontSize: 12, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" },
  flagBtn: {
    background: "none", border: "none", fontSize: 12, fontWeight: 500,
    cursor: "pointer", transition: "color 0.15s", padding: 0,
  },
  qTimerBar: { height: 3, background: "#EFF6FF", borderRadius: 2, overflow: "hidden", marginBottom: 28 },
  qTimerFill: { height: "100%", borderRadius: 2, transition: "width 1s linear, background 0.3s" },
  questionText: {
    fontSize: 20, fontWeight: 600, color: "#0F172A", lineHeight: 1.5, marginBottom: 28,
    letterSpacing: "-0.01em",
  },
  optionsList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 },
  optionBtn: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 18px", borderRadius: 12, border: "1.5px solid",
    background: "#FAFCFF", transition: "all 0.15s",
    textAlign: "left",
  },
  optionLetter: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 600, transition: "all 0.15s",
  },
  optionText: { flex: 1, fontSize: 14, lineHeight: 1.5, transition: "color 0.15s" },
  optionCheck: { fontSize: 16, marginLeft: "auto", flexShrink: 0 },
  questionNav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    paddingTop: 20, borderTop: "1px solid #F1F5F9",
  },
  navArrow: {
    background: "none", border: "1px solid #E2E8F0",
    padding: "10px 20px", borderRadius: 10,
    fontSize: 13, color: "#374151",
    fontWeight: 500, transition: "all 0.15s",
  },
  navDots: { display: "flex", gap: 5 },
  navDot: { width: 6, height: 6, borderRadius: 3, transition: "all 0.2s" },

  // RESULT
  resultWrap: {
    maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px",
  },
  resultCard: {
    background: "#fff", borderRadius: 20,
    border: "1px solid #E8EFF8",
    boxShadow: "0 4px 24px rgba(15,23,42,0.06)",
    overflow: "hidden",
  },
  resultTop: {
    padding: "44px 40px 36px",
    borderBottom: "1px solid #F1F5F9",
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
  },
  gradeBadge: {
    padding: "4px 14px", borderRadius: 20, fontSize: 11,
    fontWeight: 700, letterSpacing: "0.08em",
    border: "1px solid", marginBottom: 14, textTransform: "uppercase",
  },
  resultTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 28, fontWeight: 800, color: "#0F172A", marginBottom: 4,
  },
  resultSubtitle: { fontSize: 13, color: "#94A3B8", marginBottom: 28 },
  scoreCircleWrap: { position: "relative", width: 160, height: 160, marginBottom: 28 },
  scoreCenter: {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  },
  scorePct: { fontFamily: "'Syne', sans-serif", fontSize: 34, fontWeight: 800, lineHeight: 1 },
  scoreRaw: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  resultStats: {
    display: "flex", alignItems: "center", gap: 0,
    background: "#F8FAFF", borderRadius: 12, overflow: "hidden",
    border: "1px solid #E8EFF8",
  },
  statItem: {
    flex: 1, padding: "14px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  },
  statNum: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700 },
  statLabel: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" },
  statDivider: { width: 1, height: 40, background: "#E8EFF8", flexShrink: 0 },
  reviewSection: { padding: "28px 40px" },
  reviewTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700,
    color: "#0F172A", marginBottom: 16,
  },
  reviewList: { display: "flex", flexDirection: "column", gap: 10 },
  reviewItem: {
    padding: "14px 16px", borderRadius: 10,
    border: "1px solid", transition: "all 0.15s",
  },
  reviewItemHeader: {
    display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
  },
  reviewBadge: {
    padding: "2px 8px", borderRadius: 6, fontSize: 10,
    fontWeight: 700, color: "#fff",
  },
  reviewStatus: { fontSize: 11, fontWeight: 600 },
  reviewQ: { fontSize: 13, color: "#374151", lineHeight: 1.5, marginBottom: 6 },
  reviewAnswers: { display: "flex", flexDirection: "column", gap: 2 },
  reviewWrong: { fontSize: 12, color: "#DC2626" },
  reviewCorrect: { fontSize: 12, color: "#059669" },
  resultActions: {
    padding: "20px 40px 28px",
    display: "flex", gap: 12, justifyContent: "center",
  },
  retakeBtn: {
    padding: "12px 28px", borderRadius: 10,
    background: "#2563EB", color: "#fff",
    border: "none", fontSize: 13, fontWeight: 600,
    transition: "opacity 0.15s",
  },
  changeRoleBtn: {
    padding: "12px 28px", borderRadius: 10,
    background: "#fff", color: "#374151",
    border: "1px solid #E2E8F0", fontSize: 13, fontWeight: 500,
    transition: "background 0.15s",
  },
};