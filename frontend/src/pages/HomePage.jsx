import { Link } from "react-router";
import { useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  Code2Icon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  BarChart3Icon,
  BellIcon,
  SearchIcon,
  PlusIcon,
  CircleIcon,
  ClockIcon,
  UserCircleIcon,
  TagIcon,
  GitBranchIcon,
  TerminalIcon,
  PlayIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  GlobeIcon,
  LockIcon,
  SlackIcon,
  GithubIcon,
  ChromeIcon,
} from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const TABS = [
  { id: "board", label: "Board View", icon: LayoutDashboardIcon },
  { id: "code", label: "Code Editor", icon: Code2Icon },
  { id: "video", label: "Video Panel", icon: VideoIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3Icon },
];

const KANBAN_COLS = [
  {
    label: "Backlog",
    color: "#6b7280",
    tasks: [
      { title: "Implement OAuth2 flow", tag: "Auth", priority: "low", assignee: "AL" },
      { title: "Rate limiting strategy", tag: "Infra", priority: "med", assignee: "SR" },
    ],
  },
  {
    label: "In Progress",
    color: "#2563eb",
    tasks: [
      { title: "WebSocket reconnect logic", tag: "Backend", priority: "high", assignee: "MK" },
      { title: "Collaborative cursor sync", tag: "Frontend", priority: "high", assignee: "JP" },
    ],
  },
  {
    label: "In Review",
    color: "#7c3aed",
    tasks: [
      { title: "Language runtime sandbox", tag: "Infra", priority: "high", assignee: "AL" },
    ],
  },
  {
    label: "Done",
    color: "#059669",
    tasks: [
      { title: "Session recording API", tag: "Backend", priority: "low", assignee: "MK" },
      { title: "Editor theme switcher", tag: "Frontend", priority: "low", assignee: "JP" },
    ],
  },
];

const priorityColors = {
  high: "#ef4444",
  med: "#f59e0b",
  low: "#6b7280",
};

function KanbanBoard() {
  return (
    <div
      style={{
        background: "#f8f9fa",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        padding: "14px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            background: "#2563eb",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>IV</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
          InterVue / Q3 Sprint 4
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["#60a5fa", "#a78bfa", "#34d399"].map((c, i) => (
            <div
              key={i}
              style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: "2px solid #fff" }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {KANBAN_COLS.map((col) => (
          <div key={col.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {col.label}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                {col.tasks.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {col.tasks.map((task) => (
                <div
                  key={task.title}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "10px 10px 8px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#1e293b", marginBottom: 8, lineHeight: 1.4 }}>
                    {task.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: "#f1f5f9",
                        color: "#64748b",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {task.tag}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: priorityColors[task.priority],
                        }}
                      />
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#dbeafe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#1d4ed8",
                        }}
                      >
                        {task.assignee}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div
                style={{
                  border: "1px dashed #cbd5e1",
                  borderRadius: 8,
                  padding: "7px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                }}
              >
                <PlusIcon style={{ width: 12, height: 12, color: "#94a3b8" }} />
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Add task</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeEditorMock() {
  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 10,
        border: "1px solid #1e293b",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#64748b" }}>solution.py</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#22c55e", fontWeight: 600 }}>● Python 3.11</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ padding: "14px 16px", borderRight: "1px solid #1e293b" }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Problem
            </span>
          </div>
          {[
            { c: "#94a3b8", t: "# Two Sum — LeetCode 1" },
            { c: "#94a3b8", t: "# Given an array of integers..." },
            { c: "#7c3aed", t: "" },
            { c: "#60a5fa", t: "def", extra: " twoSum(nums, target):" },
            { c: "#e2e8f0", t: "  seen = {}" },
            { c: "#e2e8f0", t: "  for i, num in enumerate(nums):" },
            { c: "#e2e8f0", t: "    comp = target - num" },
            { c: "#34d399", t: "    if comp in seen:" },
            { c: "#e2e8f0", t: "      return [seen[comp], i]" },
            { c: "#e2e8f0", t: "    seen[num] = i" },
          ].map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: "#334155", minWidth: 16, textAlign: "right" }}>{i + 1}</span>
              <span style={{ fontSize: 11, color: line.c }}>
                {line.t}
                {line.extra && <span style={{ color: "#e2e8f0" }}>{line.extra}</span>}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 2, height: 14, background: "#60a5fa", animation: "blink 1s infinite" }} />
          </div>
        </div>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Test Results
            </span>
          </div>
          {[
            { label: "Test case 1", status: "pass", detail: "[0,1] ✓" },
            { label: "Test case 2", status: "pass", detail: "[1,2] ✓" },
            { label: "Test case 3", status: "pass", detail: "[0,4] ✓" },
            { label: "Test case 4", status: "fail", detail: "Expected [2,3]" },
          ].map((tc) => (
            <div
              key={tc.label}
              style={{
                background: tc.status === "pass" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${tc.status === "pass" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                borderRadius: 6,
                padding: "6px 10px",
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{tc.label}</span>
              <span style={{ fontSize: 11, color: tc.status === "pass" ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                {tc.detail}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(96,165,250,0.08)", borderRadius: 6, border: "1px solid rgba(96,165,250,0.2)" }}>
            <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 600, marginBottom: 4 }}>RUNTIME</div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Time: <span style={{ color: "#e2e8f0" }}>48ms</span></span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Memory: <span style={{ color: "#e2e8f0" }}>17.2 MB</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoMock() {
  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 10,
        border: "1px solid #1e293b",
        overflow: "hidden",
        padding: 14,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {[
          { name: "Sarah Chen", role: "Interviewer", initials: "SC", bg: "#1e3a5f", ring: "#2563eb" },
          { name: "Alex Rivera", role: "Candidate", initials: "AR", bg: "#1a2e1a", ring: "#059669" },
        ].map((p) => (
          <div
            key={p.name}
            style={{
              background: p.bg,
              borderRadius: 8,
              padding: "20px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              position: "relative",
              border: `1px solid ${p.ring}33`,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: p.ring,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                border: `2px solid ${p.ring}`,
              }}
            >
              {p.initials}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{p.role}</div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: 6 + Math.sin(i * 0.8) * 8,
                    background: p.ring,
                    borderRadius: 2,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          background: "#1e293b",
          borderRadius: 8,
          padding: "10px 12px",
          display: "flex",
          gap: 8,
          flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          AI Feedback — Real-time
        </div>
        {[
          { icon: "✓", text: "Clear problem breakdown", c: "#22c55e" },
          { icon: "✓", text: "Optimal time complexity O(n)", c: "#22c55e" },
          { icon: "!", text: "Edge case: empty array", c: "#f59e0b" },
        ].map((fb) => (
          <div key={fb.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: fb.c, fontWeight: 700 }}>{fb.icon}</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{fb.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsMock() {
  const bars = [72, 85, 61, 90, 78, 95, 82, 70, 88, 76, 91, 84];
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        padding: 14,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Sessions Completed", value: "1,284", delta: "+12%", up: true },
          { label: "Avg. Score", value: "78.4", delta: "+4.2", up: true },
          { label: "Hire Rate", value: "34%", delta: "-2%", up: false },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: s.up ? "#059669" : "#dc2626", fontWeight: 600, marginTop: 2 }}>
              {s.delta} vs last period
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 10 }}>
          Interview Performance — Last 12 Weeks
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                background: i === 5 ? "#2563eb" : "#dbeafe",
                borderRadius: "3px 3px 0 0",
                position: "relative",
              }}
            >
              {i === 5 && (
                <div
                  style={{
                    position: "absolute",
                    top: -22,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1e40af",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 4px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  95
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {["W1", "W4", "W8", "W12"].map((w) => (
            <span key={w} style={{ fontSize: 10, color: "#94a3b8" }}>{w}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const tabContent = {
  board: <KanbanBoard />,
  code: <CodeEditorMock />,
  video: <VideoMock />,
  analytics: <AnalyticsMock />,
};

const FEATURES = [
  {
    tag: "LIVE COLLABORATION",
    title: "Code together, hire faster",
    body: "A shared environment that mirrors the real engineering experience. Candidates and interviewers work in the same editor, with real-time execution, cursors, and voice — no context switching.",
    bullets: [
      "Shared cursor awareness across participants",
      "Run code in 12+ languages with instant output",
      "Persistent session history for async review",
    ],
    visual: "code",
  },
  {
    tag: "INTERVIEW INTELLIGENCE",
    title: "AI coaching, in every session",
    body: "InterVue's inference layer watches the session and provides structured scoring rubrics, live suggestions, and post-session reports that reduce interviewer bias and improve signal.",
    bullets: [
      "Automated rubric scoring per competency",
      "Bias detection flags on subjective language",
      "Candidate report exportable to ATS",
    ],
    visual: "video",
  },
  {
    tag: "HIRING ANALYTICS",
    title: "Turn pipeline data into decisions",
    body: "Aggregate interview data across your entire organization. Identify patterns in hiring velocity, score distributions, and funnel health — before the headcount misses.",
    bullets: [
      "Cohort comparison by role, team, level",
      "Funnel conversion with time-to-hire metrics",
      "HRIS integrations via REST and webhooks",
    ],
    visual: "analytics",
  },
];

const LOGOS = [
  "Stripe", "Figma", "Vercel", "Notion", "Linear", "Supabase",
];

const INTEGRATIONS = [
  { name: "GitHub", icon: GithubIcon, color: "#24292e" },
  { name: "Slack", icon: SlackIcon, color: "#4A154B" },
  { name: "Google", icon: ChromeIcon, color: "#1a73e8" },
  { name: "Linear", icon: GitBranchIcon, color: "#5E6AD2" },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("board");

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", background: "#ffffff", color: "#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ffffff; }
      `}</style>

      {/* NAVBAR */}
      <nav
        style={{
          borderBottom: "1px solid #e2e8f0",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
            height: 60,
            display: "flex",
            alignItems: "center",
            gap: 40,
          }}
        >
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                background: "#2563eb",
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: "-0.5px" }}>IV</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" }}>InterVue</span>
          </Link>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <SignInButton mode="modal">
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#475569",
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: 7,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
                onMouseLeave={(e) => (e.target.style.background = "transparent")}
              >
                Sign in
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button
                style={{
                  background: "#2563eb",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  padding: "8px 18px",
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#1d4ed8")}
                onMouseLeave={(e) => (e.target.style.background = "#2563eb")}
              >
                Get Started
                <ArrowRightIcon style={{ width: 14, height: 14 }} />
              </button>
            </SignInButton>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 64, alignItems: "start" }}>
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
            <motion.div variants={fadeUp}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  borderRadius: 20,
                  padding: "4px 12px 4px 6px",
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 12,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  New
                </span>
                <span style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 500 }}>
                  AI-powered scoring rubrics now in GA
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              style={{
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-1.5px",
                color: "#0f172a",
                marginBottom: 24,
              }}
            >
              Technical interviews
              <br />
              that actually{" "}
              <span style={{ color: "#2563eb" }}>work.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              style={{
                fontSize: 18,
                lineHeight: 1.65,
                color: "#475569",
                marginBottom: 36,
                maxWidth: 460,
                fontWeight: 400,
              }}
            >
              InterVue gives engineering teams a collaborative code editor, live video, and AI-driven scoring in one platform — so every hire decision is backed by signal, not gut feeling.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
              <SignInButton mode="modal">
                <button
                  style={{
                    background: "#2563eb",
                    border: "none",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    padding: "13px 26px",
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1d4ed8";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#2563eb";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Start for free
                  <ArrowRightIcon style={{ width: 16, height: 16 }} />
                </button>
              </SignInButton>

              <button
                style={{
                  background: "transparent",
                  border: "1px solid #e2e8f0",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#0f172a",
                  cursor: "pointer",
                  padding: "13px 22px",
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#94a3b8";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <PlayIcon style={{ width: 15, height: 15, color: "#2563eb", fill: "#2563eb" }} />
                Watch demo
              </button>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: 32 }}>
              {[
                { value: "4,200+", label: "Engineering teams" },
                { value: "98k", label: "Interviews run" },
                { value: "2.1×", label: "Faster hiring cycle" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 400, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* HERO PRODUCT PREVIEW */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", gap: 5 }}>
                  {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                  ))}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 12,
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <LockIcon style={{ width: 10, height: 10 }} />
                  app.intervue.io/session/acme-q3-2024
                </div>
              </div>
              <div style={{ padding: 14 }}>
                <KanbanBoard />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SOCIAL PROOF LOGOS */}
      <section style={{ borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            gap: 48,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            Trusted by teams at
          </span>
          <div style={{ display: "flex", gap: 40, alignItems: "center", flex: 1 }}>
            {LOGOS.map((logo) => (
              <motion.span
                key={logo}
                whileHover={{ scale: 1.05 }}
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "-0.3px",
                  cursor: "default",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#475569")}
                onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
              >
                {logo}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* TABBED FEATURE SHOWCASE */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ marginBottom: 48 }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            PLATFORM OVERVIEW
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <h2
              style={{
                fontSize: 38,
                fontWeight: 800,
                letterSpacing: "-1px",
                color: "#0f172a",
                lineHeight: 1.1,
                maxWidth: 480,
              }}
            >
              Every tool your team needs, in one session.
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 360, lineHeight: 1.65, fontWeight: 400 }}>
              No more tab-switching between a video call, a shared doc, and your IDE. InterVue unifies the interview experience.
            </p>
          </div>
        </motion.div>

        <div style={{ display: "flex", gap: 2, marginBottom: 28, borderBottom: "1px solid #e2e8f0" }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 18px",
                  border: "none",
                  borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                  background: "transparent",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#2563eb" : "#64748b",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  marginBottom: -1,
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ALTERNATING FEATURE SECTIONS */}
      {FEATURES.map((feat, idx) => {
        const isEven = idx % 2 === 0;
        const visual = tabContent[feat.visual];
        return (
          <section
            key={feat.tag}
            style={{ background: idx % 2 === 1 ? "#f8fafc" : "#fff", borderTop: "1px solid #f1f5f9" }}
          >
            <div
              style={{
                maxWidth: 1280,
                margin: "0 auto",
                padding: "80px 32px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 80,
                alignItems: "center",
              }}
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                style={{ order: isEven ? 0 : 1 }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                  {feat.tag}
                </div>
                <h2
                  style={{
                    fontSize: 34,
                    fontWeight: 800,
                    letterSpacing: "-0.8px",
                    color: "#0f172a",
                    lineHeight: 1.15,
                    marginBottom: 16,
                  }}
                >
                  {feat.title}
                </h2>
                <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.7, marginBottom: 28, fontWeight: 400 }}>
                  {feat.body}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {feat.bullets.map((b) => (
                    <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          background: "#eff6ff",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <CheckIcon style={{ width: 11, height: 11, color: "#2563eb" }} />
                      </div>
                      <span style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, fontWeight: 400 }}>{b}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 32 }}>
                  <a
                    href="#"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#2563eb",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Learn more <ChevronRightIcon style={{ width: 14, height: 14 }} />
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: isEven ? 32 : -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.02, boxShadow: "0 12px 28px rgba(0,0,0,0.1)" }}
                style={{ order: isEven ? 1 : 0, borderRadius: 12, overflow: "visible" }}
              >
                {visual}
              </motion.div>
            </div>
          </section>
        );
      })}

      {/* INTEGRATIONS */}
      <section style={{ borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              INTEGRATIONS
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", color: "#0f172a", marginBottom: 14 }}>
              Plugs into your existing stack
            </h2>
            <p style={{ fontSize: 16, color: "#475569", maxWidth: 520, margin: "0 auto", lineHeight: 1.65, fontWeight: 400 }}>
              Connect InterVue with the tools your team already uses. Setup takes minutes, not weeks.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { name: "GitHub", sub: "Sync repos & PRs to sessions", color: "#24292e", letter: "GH" },
              { name: "Slack", sub: "Send interview summaries to channels", color: "#4A154B", letter: "SL" },
              { name: "Google Meet", sub: "Fallback video for external candidates", color: "#1a73e8", letter: "GM" },
              { name: "Greenhouse", sub: "Auto-push scorecards to ATS", color: "#24a148", letter: "GR" },
              { name: "Lever", sub: "Bidirectional candidate sync", color: "#795ef0", letter: "LV" },
              { name: "Notion", sub: "Export session notes as pages", color: "#000", letter: "NO" },
              { name: "Linear", sub: "Create follow-up tasks from feedback", color: "#5E6AD2", letter: "LI" },
              { name: "Zapier", sub: "Custom automations via 5,000+ apps", color: "#FF4A00", letter: "ZP" },
            ].map((intg) => (
              <motion.div
                key={intg.name}
                whileHover={{ scale: 1.02, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "18px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: intg.color,
                    borderRadius: 8,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {intg.letter}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>{intg.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, fontWeight: 400 }}>{intg.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            style={{ marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.8px", color: "#0f172a", marginBottom: 6 }}>
              What engineering leaders say
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              {
                quote: "We cut our time-to-hire by 40% in the first quarter. The AI rubrics alone have eliminated 80% of the post-interview debrief time.",
                name: "Priya Mehta",
                title: "VP Engineering, Stripe",
                initials: "PM",
                color: "#2563eb",
              },
              {
                quote: "InterVue is the first tool that actually mirrors what writing code is like on the job. Candidates tell us it's the most comfortable interview they've had.",
                name: "Marcus Johansson",
                title: "Head of Talent, Figma",
                initials: "MJ",
                color: "#7c3aed",
              },
              {
                quote: "The analytics surfaced bias patterns in our interview panel we didn't even know existed. That's the kind of insight that changes hiring culture.",
                name: "Anita Rowe",
                title: "Director of Engineering, Notion",
                initials: "AR",
                color: "#059669",
              },
            ].map((t) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "28px 24px",
                  transition: "box-shadow 0.15s",
                }}
              >
                <div style={{ fontSize: 32, color: "#e2e8f0", fontWeight: 800, lineHeight: 1, marginBottom: 16 }}>"</div>
                <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.7, marginBottom: 24, fontWeight: 400 }}>{t.quote}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: t.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>{t.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER / CTA */}
      <section style={{ borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
          <div
            style={{
              background: "#0f172a",
              borderRadius: 16,
              padding: "64px 56px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 64,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                PRICING
              </div>
              <h2
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  color: "#f8fafc",
                  lineHeight: 1.1,
                  marginBottom: 20,
                }}
              >
                Start free.
                <br />
                Scale with confidence.
              </h2>
              <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.7, fontWeight: 400, maxWidth: 380 }}>
                No per-seat minimums. No setup fees. InterVue grows with your hiring volume — from one engineer to an entire org.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  plan: "Free",
                  price: "$0",
                  sub: "5 sessions / month",
                  features: ["Full editor + video", "2 participants max", "7-day history"],
                  cta: "Start free",
                  highlight: false,
                },
                {
                  plan: "Team",
                  price: "$49",
                  sub: "per month, up to 10 seats",
                  features: ["Unlimited sessions", "AI scoring rubrics", "ATS integrations", "Analytics dashboard"],
                  cta: "Start trial",
                  highlight: true,
                },
              ].map((plan) => (
                <div
                  key={plan.plan}
                  style={{
                    background: plan.highlight ? "#fff" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${plan.highlight ? "#fff" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 10,
                    padding: "20px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: plan.highlight ? "#2563eb" : "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                      {plan.plan}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: plan.highlight ? "#0f172a" : "#e2e8f0", letterSpacing: "-0.5px" }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 12, color: plan.highlight ? "#64748b" : "#475569" }}>{plan.sub}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {plan.features.map((f) => (
                        <span
                          key={f}
                          style={{
                            fontSize: 11,
                            color: plan.highlight ? "#334155" : "#64748b",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <CheckIcon style={{ width: 10, height: 10, color: plan.highlight ? "#2563eb" : "#475569" }} />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <SignInButton mode="modal">
                    <button
                      style={{
                        background: plan.highlight ? "#2563eb" : "rgba(255,255,255,0.1)",
                        border: "none",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#fff",
                        cursor: "pointer",
                        padding: "10px 18px",
                        borderRadius: 7,
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      {plan.cta}
                    </button>
                  </SignInButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 32px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: "#2563eb",
                    borderRadius: 7,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>IV</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>InterVue</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, maxWidth: 260, fontWeight: 400 }}>
                The collaborative technical interview platform for high-growth engineering teams.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                {["TW", "LI", "GH"].map((s) => (
                  <div
                    key={s}
                    style={{
                      width: 32,
                      height: 32,
                      border: "1px solid #e2e8f0",
                      borderRadius: 7,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
            {[
              { heading: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap", "Status"] },
              { heading: "Solutions", links: ["Startups", "Enterprise", "Agencies", "Open Source", "Educators"] },
              { heading: "Resources", links: ["Documentation", "API Reference", "Blog", "Community", "Support"] },
              { heading: "Company", links: ["About", "Careers", "Press Kit", "Legal", "Privacy"] },
            ].map((col) => (
              <div key={col.heading}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                  {col.heading}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map((link) => (
                    <a
                      key={link}
                      href="#"
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        textDecoration: "none",
                        fontWeight: 400,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.target.style.color = "#0f172a")}
                      onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              paddingTop: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, color: "#94a3b8" }}>© 2024 InterVue, Inc. All rights reserved.</span>
            <div style={{ display: "flex", gap: 24 }}>
              {["Terms", "Privacy", "Cookies", "Security"].map((item) => (
                <a key={item} href="#" style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none" }}>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}