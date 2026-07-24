/**
 * SessionUI.jsx
 * -----------------------------------------------------------------------
 * NOTE: This file was not in the originally requested file list, but is
 * required by the refactor. Several small presentational helpers
 * (Badge, PanelHeader, SpinnerIcon, PageSwitcher, Section, EmptyPane, etc.)
 * are used by MORE THAN ONE of the requested target components
 * (e.g. Badge is used by CandidateTopBar, InterviewerTopBar, ProblemPanel
 * and QuizPanel). Extracting them here avoids duplicating identical code
 * in multiple files -- duplicating them would technically "preserve
 * behavior" too, but would violate the spirit of "reusable components"
 * and create drift risk (a future style tweak would need to be applied
 * in 4 places instead of 1). No logic, markup, or styling was changed --
 * this is a byte-for-byte relocation of the original inline helpers.
 * -----------------------------------------------------------------------
 */
import { useState, useRef, useEffect } from "react";
import { PanelResizeHandle } from "react-resizable-panels";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  FileTextIcon,
  HelpCircleIcon,
  PenLineIcon,
} from "lucide-react";
import { T } from "../../constants/sessionTheme";

/* ─── Micro helpers ─────────────────────────────────────────────────────────── */
function Badge({ children, color, bg, border, style = {} }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 3,
        background: bg,
        color,
        border: `1px solid ${border}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function TabPill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 12px",
        borderRadius: 4,
        border: "none",
        fontSize: 11,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        color: active ? T.blue : T.muted,
        background: active ? T.blueTint : "transparent",
        outline: active
          ? `1px solid rgba(24,104,219,0.2)`
          : "1px solid transparent",
        transition: "all 0.15s",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {children}
    </button>
  );
}

function PanelHeader({ children, style = {} }) {
  return (
    <div
      style={{
        padding: "10px 18px",
        borderBottom: `1px solid ${T.border2}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: T.surface,
        flexShrink: 0,
        gap: 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SkeletonBlock({ w = "100%", h = 14, radius = 4, style = {} }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: T.surface2,
        animation: "sp-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function TriangleIcon({ size = 10, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill={color}>
      <polygon points="2,1 9,5 2,9" />
    </svg>
  );
}

function SpinnerIcon({ size = 13, color = T.muted }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      style={{ animation: "sp-spin 0.75s linear infinite", flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.22" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function CodeFileIcon({ lang }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      style={{ marginRight: 2 }}
    >
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="2"
        stroke={T.blue}
        strokeWidth="1.4"
      />
      <path
        d="M4 5l2-2 2 2M4 7h4"
        stroke={T.blue}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HHandle() {
  const [hov, setHov] = useState(false);
  return (
    <PanelResizeHandle>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: 5,
          height: "100%",
          cursor: "col-resize",
          background: hov ? T.blueMid : T.border2,
          transition: "background 0.15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 2,
            height: 28,
            borderRadius: 2,
            background: "rgba(255,255,255,0.5)",
          }}
        />
      </div>
    </PanelResizeHandle>
  );
}

function VHandle() {
  const [hov, setHov] = useState(false);
  return (
    <PanelResizeHandle>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          height: 5,
          width: "100%",
          cursor: "row-resize",
          background: hov ? T.blueMid : T.border2,
          transition: "background 0.15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            height: 2,
            width: 28,
            borderRadius: 2,
            background: "rgba(255,255,255,0.5)",
          }}
        />
      </div>
    </PanelResizeHandle>
  );
}

/* ─── Page Switcher Dropdown ────────────────────────────────────────────────── */
function PageSwitcher({ activePage, onChange, darkMode = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pages = [
    {
      id: "problem",
      label: "Problem",
      Icon: FileTextIcon,
      color: T.blue,
      desc: "View problem statement, examples & constraints",
    },
    {
      id: "quiz",
      label: "Quiz",
      Icon: HelpCircleIcon,
      color: T.purple,
      desc: "Answer theory & concept questions",
    },
    {
      id: "whiteboard",
      label: "Whiteboard",
      Icon: PenLineIcon,
      color: T.amber,
      desc: "Collaborative drawing — system design, UML, diagrams",
    },
  ];

  const current = pages.find((p) => p.id === activePage) || pages[0];

  const accent =
    activePage === "quiz" ? T.purple : activePage === "whiteboard" ? T.amber : T.blue;
  const accentTint =
    activePage === "quiz" ? T.purpleTint : activePage === "whiteboard" ? T.amberTint : T.blueTint;
  const accentBorder =
    activePage === "quiz"
      ? "rgba(101,84,192,0.3)"
      : activePage === "whiteboard"
        ? T.amberBorder
        : T.border;

  const borderColor = darkMode
    ? activePage === "quiz"
      ? "rgba(101,84,192,0.4)"
      : activePage === "whiteboard"
        ? "rgba(255,171,0,0.4)"
        : "rgba(255,255,255,0.12)"
    : accentBorder;

  const bgColor = darkMode
    ? activePage === "quiz"
      ? "rgba(101,84,192,0.12)"
      : activePage === "whiteboard"
        ? "rgba(255,171,0,0.12)"
        : "rgba(255,255,255,0.06)"
    : accentTint;

  const textColor = darkMode
    ? activePage === "quiz"
      ? "#A78BFA"
      : activePage === "whiteboard"
        ? "#FFAB00"
        : "rgba(255,255,255,0.6)"
    : accent;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          borderRadius: 4,
          border: `1px solid ${borderColor}`,
          background: bgColor,
          fontSize: 11,
          fontWeight: 600,
          color: textColor,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.15s",
        }}
      >
        <current.Icon size={11} />
        {current.label}
        <ChevronDownIcon
          size={10}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              background: darkMode ? "#1A2435" : T.bg,
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : T.border}`,
              borderRadius: 6,
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              overflow: "hidden",
              zIndex: 200,
              minWidth: 200,
            }}
          >
            {pages.map((p) => {
              const isActive = activePage === p.id;
              const itemBg = darkMode
                ? isActive
                  ? p.id === "quiz"
                    ? "rgba(101,84,192,0.15)"
                    : p.id === "whiteboard"
                      ? "rgba(255,171,0,0.15)"
                      : "rgba(24,104,219,0.15)"
                  : "transparent"
                : isActive
                  ? p.id === "quiz"
                    ? T.purpleTint
                    : p.id === "whiteboard"
                      ? T.amberTint
                      : T.blueTint
                  : "transparent";
              const itemColor = isActive
                ? p.color
                : darkMode
                  ? "rgba(255,255,255,0.7)"
                  : T.body;

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    border: "none",
                    cursor: "pointer",
                    background: itemBg,
                    color: itemColor,
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    fontFamily: "'DM Sans', sans-serif",
                    textAlign: "left",
                    transition: "background 0.12s",
                  }}
                >
                  <p.Icon size={12} />
                  {p.label}
                  {isActive && (
                    <span
                      style={{
                        marginLeft: "auto",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: p.color,
                      }}
                    />
                  )}
                </button>
              );
            })}

            <div
              style={{
                padding: "8px 14px 10px",
                borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : T.border2}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  color: darkMode ? "rgba(255,255,255,0.3)" : T.muted,
                  lineHeight: 1.5,
                }}
              >
                {current.desc}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: T.muted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {title}
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
      {children}
    </div>
  );
}

function EmptyPane({ icon: Icon, title, subtitle }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: 10,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 10,
          background: T.surface2,
          border: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <Icon size={20} color={T.muted} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 12,
            color: T.muted,
            maxWidth: 220,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

export {
  Badge,
  TabPill,
  PanelHeader,
  SkeletonBlock,
  TriangleIcon,
  SpinnerIcon,
  CodeFileIcon,
  HHandle,
  VHandle,
  PageSwitcher,
  Section,
  EmptyPane,
};
