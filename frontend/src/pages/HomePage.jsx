import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SignInButton } from "@clerk/clerk-react";

/* ─── INLINE SVG ICONS ─── */
const Icon = {
  ArrowRight: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  ),
  CheckCircle: () => (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#2563eb"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  ),
  Lock: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  Plus: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
  ),
  Board: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  ),
  Code: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  ),
  Video: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
  ),
  Bar: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  ),
  Google: () => (
    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  ),
  Microsoft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
  ),
  Github: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
  ),
};

/* ─── BRAND LOGOS for marquee ─── */
const BRAND_LOGOS = [
  { name: "Stripe", svg: <svg height="20" viewBox="0 0 60 25" fill="none"><path d="M27.16 10.07c0-1.1.9-1.52 2.39-1.52 2.14 0 4.84.65 6.98 1.8V4.28C34.28 3.4 32.1 3 29.55 3c-5.37 0-8.95 2.8-8.95 7.47 0 7.28 10.04 6.12 10.04 9.26 0 1.3-1.13 1.72-2.71 1.72-2.35 0-5.35-.97-7.72-2.28v6.18C22.73 26.24 25.2 27 27.84 27c5.51 0 9.3-2.72 9.3-7.47-.02-7.87-10.08-6.46-9.98-9.46zM0 27.58l6.97-1.5V3.95L0 5.45v22.13zM47.64 3.93l-4.42 1-.02 17.67c0 3.27 2.45 5.4 5.72 5.4 1.81 0 3.13-.33 3.86-.72v-5.18c-.7.28-4.16.65-4.16-1.97V10.4h4.16V4.95h-4.16l.02-1.02zM56 9.43v18.15H63V3.95L56 5.63V9.43z" fill="#635BFF"/></svg> },
  { name: "Figma", svg: <svg height="20" viewBox="0 0 38 56" fill="none"><path d="M19 28a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" fill="#1ABCFE"/><path d="M1 46a9 9 0 0 1 9-9h9v9a9 9 0 0 1-18 0z" fill="#0ACF83"/><path d="M19 1v18h9a9 9 0 0 0 0-18h-9z" fill="#FF7262"/><path d="M1 10a9 9 0 0 0 9 9h9V1H10A9 9 0 0 0 1 10z" fill="#F24E1E"/><path d="M1 28a9 9 0 0 0 9 9h9V19H10a9 9 0 0 0-9 9z" fill="#A259FF"/></svg> },
  { name: "Vercel", svg: <svg height="18" viewBox="0 0 1155 1000" fill="none"><path d="M577.344 0L1154.69 1000H0L577.344 0Z" fill="#000"/></svg> },
  { name: "Notion", svg: <svg height="20" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="18" fill="#fff"/><path d="M23 22c3.2 2.5 4.4 2.3 10.4 1.9l56.5-3.4c1.2 0 .1-1.2-.4-1.4l-9.4-6.8c-1.8-1.3-4.2-2.8-8.8-2.4L17 13.7c-2 .2-2.4 1.2-1.6 2L23 22z" fill="#000"/><path d="M25.9 33.2V87c0 3 1.5 4.1 4.9 3.9l62.3-3.6c3.4-.2 4.2-2.3 4.2-4.8V28.8c0-2.5-1-3.8-3.2-3.6L30 28.7c-2.4.2-4.1 1.5-4.1 4.5z" fill="#000"/><path d="M76 35.4L56.6 36.7V31L76 29.7v5.7z" fill="#fff"/><rect x="40" y="45" width="20" height="3" rx="1.5" fill="#fff"/><rect x="40" y="55" width="30" height="3" rx="1.5" fill="#fff"/><rect x="40" y="65" width="25" height="3" rx="1.5" fill="#fff"/></svg> },
  { name: "Linear", svg: <svg height="20" viewBox="0 0 100 100" fill="none"><defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#5E6AD2"/><stop offset="1" stopColor="#7C83F7"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#lg1)"/><path d="M16 71.3L28.7 84l56.3-56.3L72.3 16 16 71.3z" fill="white"/><path d="M16 56.8L43.2 84l-27.2-.1V56.8z" fill="white"/><path d="M43.2 16L16 43.2V16h27.2z" fill="white"/></svg> },
  { name: "Supabase", svg: <svg height="20" viewBox="0 0 109 113" fill="none"><path d="M63.708 110.284c-2.86 3.601-8.655 1.628-8.755-2.97l-1.358-57.897h38.887c7.061 0 10.989 8.06 6.578 13.537L63.708 110.284z" fill="url(#sb_a)"/><path d="M63.708 110.284c-2.86 3.601-8.655 1.628-8.755-2.97l-1.358-57.897h38.887c7.061 0 10.989 8.06 6.578 13.537L63.708 110.284z" fill="url(#sb_b)" fillOpacity=".2"/><path d="M45.317 2.071C48.177-1.53 53.972.443 54.072 5.041l.922 57.897H16.107c-7.061 0-10.989-8.06-6.578-13.537L45.317 2.071z" fill="#3ECF8E"/><defs><linearGradient id="sb_a" x1="53.974" y1="54.974" x2="94.163" y2="71.829" gradientUnits="userSpaceOnUse"><stop stopColor="#249361"/><stop offset="1" stopColor="#3ECF8E"/></linearGradient><linearGradient id="sb_b" x1="36.156" y1="30.578" x2="54.484" y2="65.081" gradientUnits="userSpaceOnUse"><stop/><stop offset="1" stopOpacity="0"/></linearGradient></defs></svg> },
  { name: "GitHub", svg: <svg height="20" viewBox="0 0 24 24" fill="#24292e"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg> },
  { name: "Shopify", svg: <svg height="20" viewBox="0 0 256 292"><path d="M223.773 55.2c-.22-1.626-1.626-2.494-2.713-2.604-1.087-.11-23.745-1.737-23.745-1.737s-15.819-15.6-17.556-17.337c-1.737-1.737-5.1-1.196-6.407-.768-.11 0-3.473 1.087-9.1 2.823-5.427-15.71-14.97-30.14-31.878-30.14-.437 0-.987 0-1.426.11C126.167 1.737 121.507 0 117.497 0 85.84 0 70.67 40.12 65.903 60.518c-12.924 3.912-22.138 6.846-23.225 7.166-7.274 2.274-7.494 2.494-8.471 9.33C33.55 82.23 8 280.592 8 280.592L190.407 292l69.916-14.97S223.993 56.826 223.773 55.2z" fill="#95BF47"/><path d="M221.06 52.597c-1.087-.11-23.745-1.737-23.745-1.737s-15.819-15.6-17.556-17.337c-.66-.66-1.537-.987-2.494-.987l-13.004 265.464 69.916-14.97S223.993 56.826 223.773 55.2c-.22-1.626-1.626-2.494-2.713-2.604z" fill="#5E8E3E"/><path d="M128.78 105.015l-8.581 25.59s-7.494-3.912-16.677-3.912c-13.443 0-14.09 8.471-14.09 10.567 0 11.614 30.25 16.017 30.25 43.145 0 21.34-13.553 35.1-31.878 35.1-21.9 0-33.074-13.663-33.074-13.663l5.866-19.496s11.504 9.88 21.23 9.88c6.297 0 8.9-4.999 8.9-8.58 0-15.052-24.823-15.71-24.823-40.643 0-20.923 14.97-41.187 45.11-41.187 11.614-.11 17.777 3.2 17.777 3.2z" fill="#FFF"/></svg> },
];

/* ─── KANBAN DATA ─── */
const KANBAN_COLS = [
  { label: "Backlog", color: "#6b7280", tasks: [
    { title: "Implement OAuth2 flow", tag: "Auth", priority: "low", assignee: "AL" },
    { title: "Rate limiting strategy", tag: "Infra", priority: "med", assignee: "SR" },
  ]},
  { label: "In Progress", color: "#2563eb", tasks: [
    { title: "WebSocket reconnect logic", tag: "Backend", priority: "high", assignee: "MK" },
    { title: "Collaborative cursor sync", tag: "Frontend", priority: "high", assignee: "JP" },
  ]},
  { label: "In Review", color: "#7c3aed", tasks: [
    { title: "Language runtime sandbox", tag: "Infra", priority: "high", assignee: "AL" },
  ]},
  { label: "Done", color: "#059669", tasks: [
    { title: "Session recording API", tag: "Backend", priority: "low", assignee: "MK" },
    { title: "Editor theme switcher", tag: "Frontend", priority: "low", assignee: "JP" },
  ]},
];
const priorityColors = { high: "#ef4444", med: "#f59e0b", low: "#6b7280" };

const FEATURES = [
  {
    tag: "LIVE COLLABORATION",
    title: "Code together, hire faster",
    body: "A shared environment that mirrors the real engineering experience. Candidates and interviewers work in the same editor, with real-time execution, cursors, and voice — no context switching.",
    bullets: ["Shared cursor awareness across participants", "Run code in 12+ languages with instant output", "Persistent session history for async review"],
    visual: "code",
  },
  {
    tag: "INTERVIEW INTELLIGENCE",
    title: "AI Face detection, in every session",
    body: "InterVue's inference layer watches the session and provides structured scoring rubrics, live suggestions, and post-session reports that reduce interviewer bias and improve signal.",
    bullets: ["Automated rubric scoring per competency", "Bias detection flags on subjective language", "Candidate report exportable to ATS"],
    visual: "video",
  },
  {
    tag: "HIRING ANALYTICS",
    title: "Turn pipeline data into decisions",
    body: "Aggregate interview data across your entire organization. Identify patterns in hiring velocity, score distributions, and funnel health — before the headcount misses.",
    bullets: ["Cohort comparison by role, team, level", "Funnel conversion with time-to-hire metrics", "HRIS integrations via REST and webhooks"],
    visual: "analytics",
  },
];

const COMPARISON = [
  { label: "Setup time", old: "2–3 days", next: "5 minutes" },
  { label: "AI scoring", old: "Manual", next: "Automated" },
  { label: "Proctoring", old: "None", next: "Built-in AI" },
  { label: "Candidate report", old: "Hours later", next: "Instant" },
  { label: "Bias detection", old: "No", next: "Yes" },
  { label: "Code execution", old: "Screen share only", next: "Real-time sandbox" },
];

const INTEGRATIONS = [
  { name: "GitHub", sub: "Sync repos & PRs to sessions", color: "#24292e", letter: "GH" },
  { name: "Slack", sub: "Send interview summaries to channels", color: "#4A154B", letter: "SL" },
  { name: "Google Meet", sub: "Fallback video for external candidates", color: "#1a73e8", letter: "GM" },
  { name: "Greenhouse", sub: "Auto-push scorecards to ATS", color: "#24a148", letter: "GR" },
  { name: "Lever", sub: "Bidirectional candidate sync", color: "#795ef0", letter: "LV" },
  { name: "Notion", sub: "Export session notes as pages", color: "#000", letter: "NO" },
  { name: "Linear", sub: "Create follow-up tasks from feedback", color: "#5E6AD2", letter: "LI" },
  { name: "Zapier", sub: "Custom automations via 5,000+ apps", color: "#FF4A00", letter: "ZP" },
];

const TABS = [
  { id: "board", label: "Board View", Icon: Icon.Board },
  { id: "code", label: "Code Editor", Icon: Icon.Code },
  { id: "video", label: "Video Panel", Icon: Icon.Video },
  { id: "analytics", label: "Analytics", Icon: Icon.Bar },
];

const FOOTER_COLS = [
  { heading: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap", "Status"] },
  { heading: "Solutions", links: ["Startups", "Enterprise", "Agencies", "Open Source", "Educators"] },
  { heading: "Resources", links: ["Documentation", "API Reference", "Blog", "Community", "Support"] },
  { heading: "Company", links: ["About", "Careers", "Press Kit", "Legal", "Privacy"] },
];

/* ─── SUB-COMPONENTS ─── */
function KanbanBoard() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <div className="glow"></div>

      <div className="browser-frame">
        <div className="browser-header">
          <div className="dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="url-bar">
            app.intervue.io/dashboard
          </div>
        </div>

        <img
          src="/dashboard-preview.png"
          alt="Dashboard"
          style={{
            width: "100%",
            display: "block",
            borderBottomLeftRadius: "24px",
            borderBottomRightRadius: "24px",
          }}
        />
      </div>
    </div>
  );
}

function CodeEditorMock() {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.4)",
        boxShadow:
          "0 30px 80px rgba(37,99,235,0.15), 0 8px 32px rgba(15,23,42,0.08)",
      }}
    >
      {/* Browser Header */}
      <div
        style={{
          height: 58,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 20px",
          background: "rgba(255,255,255,0.45)",
          borderBottom: "1px solid rgba(255,255,255,0.4)",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff5f57",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ffbd2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#28c840",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            height: 38,
            borderRadius: 10,
            border: "1px solid #dbe4f0",
            background: "rgba(255,255,255,0.75)",
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            color: "#94a3b8",
            fontSize: 14,
          }}
        >
          app.intervue.io/session/IV-12345
        </div>
      </div>

      {/* Dashboard Screenshot */}
      <img
        src="/code-editor.png"
        alt="Code Editor Preview"
        style={{
          width: "100%",
          display: "block",
        }}
      />
    </div>
  );
}

function VideoMock() {
  return (
    <div
      style={{
        borderRadius: 24,
        overflow: "hidden",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
      }}
    >
      {/* Browser Header */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 18px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff5f57",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ffbd2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#28c840",
            }}
          />
        </div>

        <span
          style={{
            color: "#64748b",
            fontSize: 14,
          }}
        >
          AI Face Detection System
        </span>
      </div>

 <video
  autoPlay
  loop
  muted
  playsInline
  style={{
    width: "100%",
    aspectRatio: "16/9",
    objectFit: "cover",
    display: "block",
  }}
>
        <source src="/face-detection-demo.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

function AnalyticsMock() {
  const bars = [72, 85, 61, 90, 78, 95, 82, 70, 88, 76, 91, 84];
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden", padding: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Sessions Completed", value: "1,284", delta: "+12%", up: true },
          { label: "Avg. Score", value: "78.4", delta: "+4.2", up: true },
          { label: "Hire Rate", value: "34%", delta: "-2%", up: false },
        ].map((s) => (
          <div key={s.label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.up ? "#059669" : "#dc2626", fontWeight: 600, marginTop: 2 }}>{s.delta} vs last period</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 10 }}>Interview Performance — Last 12 Weeks</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
          {bars.map((h, i) => (
            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
              style={{ flex: 1, background: i === 5 ? "#2563eb" : "#dbeafe", borderRadius: "3px 3px 0 0", position: "relative" }}>
              {i === 5 && (
                <div style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", background: "#1e40af", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 4px", borderRadius: 3, whiteSpace: "nowrap" }}>95</div>
              )}
            </motion.div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {["W1", "W4", "W8", "W12"].map((w) => <span key={w} style={{ fontSize: 10, color: "#94a3b8" }}>{w}</span>)}
        </div>
      </div>
    </div>
  );
}

const tabContent = { board: <KanbanBoard />, code: <CodeEditorMock />, video: <VideoMock />, analytics: <AnalyticsMock /> };

function Marquee() {
  return (
    <div style={{ overflow: "hidden", padding: "24px 0" }}>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .marquee-track { display:flex; gap:56px; animation: marquee 36s linear infinite; width:max-content; align-items:center; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="marquee-track">
        {[...BRAND_LOGOS, ...BRAND_LOGOS].map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.7, transition: "opacity 0.2s", cursor: "default" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}>
            {b.svg}
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

/* ─── MAIN LANDING PAGE ─── */
export default function InterVueLanding() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("board");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", background: "#DEEBFF", color: "#0f172a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f9fbfb; }
        a { text-decoration: none; color: inherit; }
        .nav-link { font-size:14px; font-weight:500; color:#475569; padding:6px 10px; border-radius:6px; transition:background 0.15s,color 0.15s; cursor:pointer; }
        .nav-link:hover { background:#f1f5f9; color:#0f172a; }
        .btn-primary { background:#2563eb; color:#fff; border:none; font-size:15px; font-weight:600; padding:13px 26px; border-radius:9px; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; gap:8px; transition:background 0.15s,transform 0.12s; }
        .btn-primary:hover { background:#1d4ed8; transform:translateY(-1px); }
        .btn-secondary { background:transparent; color:#0f172a; border:1px solid #e2e8f0; font-size:15px; font-weight:500; padding:13px 22px; border-radius:9px; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; gap:8px; transition:all 0.15s; }
        .btn-secondary:hover { border-color:#94a3b8; transform:translateY(-1px); }
        .social-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 0; border:1.5px solid #e2e8f0; border-radius:7px; background:#fff; font-family:inherit; font-size:14px; font-weight:500; color:#0f172a; cursor:pointer; width:100%; transition:border-color 0.15s,background 0.15s; }
        .social-btn:hover { border-color:#2563eb; background:#f0f6ff; }
        .integration-card { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:18px 16px; display:flex; align-items:center; gap:12px; transition:box-shadow 0.2s,transform 0.15s; cursor:pointer; }
        .integration-card:hover { box-shadow:0 4px 16px rgba(37,99,235,0.1); transform:translateY(-2px); }
        .comparison-row { display:grid; grid-template-columns:1fr 1fr 1fr; padding:14px 24px; border-bottom:1px solid #f1f5f9; transition:background 0.15s; }
        .comparison-row:hover { background:#f8fafc; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        borderBottom: scrollY > 20 ? "1px solid #e2e8f0" : "1px solid transparent",
        background: scrollY > 20 ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.8)",
        backdropFilter: "blur(14px)",
        position: "sticky", top: 0, zIndex: 100,
        transition: "border-color 0.2s, background 0.2s",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", gap: 40 }}>
         <a
  href="/"
  style={{
    display: "flex",
    alignItems: "center",
    gap: 7,
    textDecoration: "none",
  }}
>
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: 8,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <img
      src="/logo.png"
      alt="InterVue"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  </div>

  <span
    style={{
      fontSize: 20,
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: "-0.5px",
      lineHeight: 1,
    }}
  >
    InterVue
  </span>
</a>
    
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => window.location.href = "/bot"}
              style={{
                background: "transparent", border: "none", fontSize: 14, fontWeight: 500,
                color: "#475569", cursor: "pointer", padding: "6px 10px", borderRadius: 6,
                transition: "background 0.15s", fontFamily: "inherit",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              Mock Interview Bot
            </button>
            {/* Clerk Sign In */}
            <SignInButton mode="modal">
              <button style={{ background: "transparent", border: "none", fontSize: 14, fontWeight: 500, color: "#475569", cursor: "pointer", padding: "6px 10px", borderRadius: 6, transition: "background 0.15s", fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                Sign in
              </button>
            </SignInButton>
            {/* Clerk Get Started */}
            <SignInButton mode="modal">
              <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 14, borderRadius: 7 }}>
                Get started free <Icon.ArrowRight />
              </button>
            </SignInButton>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.25fr", gap: 64, alignItems: "start" }}>

          {/* LEFT */}
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
            <motion.div variants={fadeUp}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 20, padding: "4px 12px 4px 6px", marginBottom: 24 }}>
                <span style={{ background: "#2563eb", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>New</span>
                <span style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 500 }}>AI-powered Transparent Interviewing</span>
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1.5px", color: "#0f172a", marginBottom: 24 }}>
              Technical interviews<br />that actually <span style={{ color: "#2563eb" }}>work.</span>
            </motion.h1>

            <motion.p variants={fadeUp} style={{ fontSize: 17, lineHeight: 1.65, color: "#475569", marginBottom: 28, maxWidth: 460, fontWeight: 400 }}>
              InterVue gives engineering teams a collaborative code editor, live video, and AI-driven scoring in one platform — so every hire decision is backed by signal, not gut feeling.
            </motion.p>

            {/* Auth form area */}
            <motion.div variants={fadeUp} style={{ maxWidth: 420, marginBottom: 32 }}>
              
              {/* Primary CTA — Clerk modal */}
              <SignInButton mode="modal">
                
                <button className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 15, marginBottom: 10 }}>
                  Start Interviewing <Icon.ArrowRight />
                </button>
              </SignInButton>

              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Or continue with</span>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              </div>

              {/* Social sign-in via Clerk modal */}
              <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.25fr", gap: 10 }}>
                <SignInButton mode="modal">
                  <button className="social-btn"><Icon.Google /> Google</button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="social-btn"><Icon.Microsoft /> Microsoft</button>
                </SignInButton>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: "flex", gap: 32, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
              {[{ value: "4,200+", label: "Engineering teams" }, { value: "98k", label: "Interviews run" }, { value: "2.1×", label: "Faster hiring cycle" }].map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 400, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT — product preview */}
          <motion.div
  initial={{ opacity: 0, y: 32 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.6,
    delay: 0.2,
  }}
>
<div className="hero-preview">
  <div className="browser-frame">
      <div className="glow"></div>
    <div className="browser-header">
      <div className="dots">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="url-bar">
        app.intervue.io/dashboard
      </div>
    </div>

   <img
  src="/dashboard-preview.png"
  alt="Dashboard Preview"
  style={{
    width: "100%",
    height: "auto",
    display: "block",
    borderBottomLeftRadius: "24px",
    borderBottomRightRadius: "24px",
  }}
/>
  </div>
</div>
</motion.div>
        </div>
      </section>

      {/* ── TRUSTED BY MARQUEE ── */}
      <div style={{ borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, paddingTop: 20, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Trusted by teams at</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>
        </div>
        <Marquee />
      </div>

      {/* ── TABBED FEATURE SHOWCASE ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>PLATFORM OVERVIEW</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1px", color: "#0f172a", lineHeight: 1.1, maxWidth: 480 }}>
              Every tool your team needs, in one session.
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 360, lineHeight: 1.65, fontWeight: 400 }}>
              No more tab-switching between a video call, a shared doc, and your IDE. InterVue unifies the interview experience.
            </p>
          </div>
        </motion.div>

        <div style={{ display: "flex", gap: 2, marginBottom: 28, borderBottom: "1px solid #e2e8f0" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: "none", borderBottom: active ? "2px solid #2563eb" : "2px solid transparent", background: "transparent", fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "#2563eb" : "#64748b", cursor: "pointer", transition: "all 0.15s", marginBottom: -1, fontFamily: "inherit" }}>
                <tab.Icon />{tab.label}
              </button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── ALTERNATING FEATURE SECTIONS ── */}
      {FEATURES.map((feat, idx) => {
        const isEven = idx % 2 === 0;
        return (
          <section key={feat.tag} style={{ background: idx % 2 === 1 ? "#f8fafc" : "#fff", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px", display: "grid", gridTemplateColumns: "0.95fr 1.25fr", gap: 80, alignItems: "center" }}>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} style={{ order: isEven ? 0 : 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>{feat.tag}</div>
                <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.8px", color: "#0f172a", lineHeight: 1.15, marginBottom: 16 }}>{feat.title}</h2>
                <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.7, marginBottom: 28, fontWeight: 400 }}>{feat.body}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {feat.bullets.map((b) => (
                    <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 20, height: 20, background: "#eff6ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <Icon.CheckCircle />
                      </div>
                      <span style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, fontWeight: 400 }}>{b}</span>
                    </div>
                  ))}
                </div>
                <a href="#" style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 28 }}>
                  Learn more <Icon.ChevronRight />
                </a>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: isEven ? 32 : -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.02, boxShadow: "0 12px 32px rgba(0,0,0,0.09)" }}
                style={{ order: isEven ? 1 : 0, borderRadius: 12, overflow: "visible", transition: "box-shadow 0.2s" }}>
                {tabContent[feat.visual]}
              </motion.div>
            </div>
          </section>
        );
      })}

      {/* ── COMPARISON TABLE ── */}
      <section style={{ borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>WHY INTERVUE</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.8px", color: "#0f172a", marginBottom: 14 }}>Traditional process vs InterVue</h2>
            <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>See why engineering teams are moving their hiring to InterVue.</p>
          </motion.div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.25fr 1.25fr", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "14px 24px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>Feature</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Traditional</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" }}>InterVue</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.label} className="comparison-row" style={{ borderBottom: i < COMPARISON.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{row.label}</span>
                <span style={{ fontSize: 14, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#ef4444", fontSize: 12 }}>✕</span> {row.old}
                </span>
                <span style={{ fontSize: 14, color: "#059669", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12 }}>✓</span> {row.next}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>INTEGRATIONS</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", color: "#0f172a", marginBottom: 14 }}>Plugs into your existing stack</h2>
            <p style={{ fontSize: 16, color: "#475569", maxWidth: 520, margin: "0 auto", lineHeight: 1.65, fontWeight: 400 }}>Connect InterVue with the tools your team already uses. Setup takes minutes, not weeks.</p>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {INTEGRATIONS.map((intg) => (
              <motion.div key={intg.name} whileHover={{ scale: 1.02, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }} className="integration-card">
                <div style={{ width: 36, height: 36, background: intg.color, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "-0.2px" }}>{intg.letter}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>{intg.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, fontWeight: 400 }}>{intg.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.8px", color: "#0f172a", marginBottom: 6 }}>What engineering leaders say</h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { quote: "We cut our time-to-hire by 40% in the first quarter. The AI rubrics alone eliminated 80% of the post-interview debrief time.", name: "Priya Mehta", title: "VP Engineering, Stripe", initials: "PM", color: "#2563eb" },
              { quote: "InterVue is the first tool that actually mirrors what writing code is like on the job. Candidates tell us it's the most comfortable interview they've had.", name: "Marcus Johansson", title: "Head of Talent, Figma", initials: "MJ", color: "#7c3aed" },
              { quote: "The analytics surfaced bias patterns in our interview panel we didn't even know existed. That's the kind of insight that changes hiring culture.", name: "Anita Rowe", title: "Director of Engineering, Notion", initials: "AR", color: "#059669" },
            ].map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={i} variants={fadeUp}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}
                style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "28px 24px", transition: "box-shadow 0.15s" }}>
                <div style={{ fontSize: 32, color: "#e2e8f0", fontWeight: 800, lineHeight: 1, marginBottom: 16 }}>"</div>
                <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.7, marginBottom: 24, fontWeight: 400 }}>{t.quote}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{t.initials}</div>
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

      {/* ── PRICING CTA ── */}
      <section style={{ borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ background: "#0f172a", borderRadius: 16, padding: "64px 56px", display: "grid", gridTemplateColumns: "0.95fr 1.25fr", gap: 64, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>PRICING</div>
              <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1px", color: "#f8fafc", lineHeight: 1.1, marginBottom: 20 }}>Start free.<br />Scale with confidence.</h2>
              <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.7, fontWeight: 400, maxWidth: 380 }}>No per-seat minimums. No setup fees. InterVue grows with your hiring volume — from one engineer to an entire org.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { plan: "Free", price: "$0", sub: "5 sessions / month", features: ["Full editor + video", "2 participants max", "7-day history"], cta: "Start free", highlight: false },
                { plan: "Team", price: "$49", sub: "per month, up to 10 seats", features: ["Unlimited sessions", "AI scoring rubrics", "ATS integrations", "Analytics dashboard"], cta: "Start trial", highlight: true },
              ].map((plan) => (
                <motion.div key={plan.plan} whileHover={{ scale: 1.01 }}
                  style={{ background: plan.highlight ? "#fff" : "rgba(255,255,255,0.06)", border: `1px solid ${plan.highlight ? "#fff" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "20px 22px", display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: plan.highlight ? "#2563eb" : "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{plan.plan}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: plan.highlight ? "#0f172a" : "#e2e8f0", letterSpacing: "-0.5px" }}>{plan.price}</span>
                      <span style={{ fontSize: 12, color: plan.highlight ? "#64748b" : "#475569" }}>{plan.sub}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {plan.features.map((f) => (
                        <span key={f} style={{ fontSize: 11, color: plan.highlight ? "#334155" : "#64748b", display: "flex", alignItems: "center", gap: 3 }}>
                          <Icon.CheckCircle /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Clerk-powered plan CTA */}
                  <SignInButton mode="modal">
                    <button style={{ background: plan.highlight ? "#2563eb" : "rgba(255,255,255,0.1)", border: "none", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", padding: "10px 18px", borderRadius: 7, whiteSpace: "nowrap", transition: "opacity 0.15s", fontFamily: "inherit" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                      {plan.cta}
                    </button>
                  </SignInButton>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ── */}
      <section style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1px", color: "#0f172a", marginBottom: 16, lineHeight: 1.1 }}>Transform Your Technical Hiring</h2>
            <p style={{ fontSize: 16, color: "#475569", marginBottom: 32, maxWidth: 460, margin: "0 auto 32px" }}>Join 4,200+ engineering teams using InterVue to hire better, faster, and fairer.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <SignInButton mode="modal">
                <button className="btn-primary">Get Started Today <Icon.ArrowRight /></button>
              </SignInButton>
              <button className="btn-secondary"><Icon.Play /> Watch Demo</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #e2e8f0", background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 32px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, background: "#2563eb", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>IV</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>InterVue</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, maxWidth: 260, fontWeight: 400 }}>The collaborative technical interview platform for high-growth engineering teams.</p>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                {[
                  { label: "TW", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg> },
                  { label: "LI", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg> },
                  { label: "GH", icon: <Icon.Github /> },
                ].map((s) => (
                  <div key={s.label} style={{ width: 32, height: 32, border: "1px solid #e2e8f0", borderRadius: 7, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", cursor: "pointer" }}>
                    {s.icon}
                  </div>
                ))}
              </div>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.heading}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>{col.heading}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map((link) => (
                    <a key={link} href="#" style={{ fontSize: 13, color: "#64748b", fontWeight: 400, transition: "color 0.15s" }}
                      onMouseEnter={e => e.target.style.color = "#0f172a"}
                      onMouseLeave={e => e.target.style.color = "#64748b"}>{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>© 2025 InterVue, Inc. All rights reserved.</span>
            <div style={{ display: "flex", gap: 24 }}>
              {["Terms", "Privacy", "Cookies", "Security"].map((item) => (
                <a key={item} href="#" style={{ fontSize: 12, color: "#94a3b8" }}>{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}