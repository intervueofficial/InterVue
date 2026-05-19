import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { useActiveSessions, useCreateSession, useMyRecentSessions } from "../hooks/useSessions";
import Navbar from "../components/Navbar";
import CreateSessionModal from "../components/CreateSessionModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  PlayIcon,
  ClockIcon,
  UsersIcon,
  BarChart3Icon,
  Code2Icon,
  VideoIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  ZapIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CalendarIcon,
  SparklesIcon,
  ActivityIcon,
  XIcon,
} from "lucide-react";

const T = {
  blue:       "#1868DB",
  blueHover:  "#1558BC",
  blueTint:   "#cfe1fd",
  blueMid:    "#4A9EE8",
  amber:      "#ffab00",
  amberHover: "#ff991f",
  dark:       "#1C2B42",
  body:       "#44526C",
  muted:      "#6B778C",
  border:     "#DFE1E6",
  border2:    "#DDDEE1",
  bg:         "#FFFFFF",
  surface:    "#F8F8F8",
  surface2:   "#F4F5F7",
  green:      "#00875A",
  greenTint:  "rgba(0,135,90,0.08)",
  greenBorder:"rgba(0,135,90,0.2)",
  red:        "#DE350B",
  redTint:    "rgba(222,53,11,0.08)",
  yellow:     "#FF8B00",
  yellowTint: "rgba(255,139,0,0.08)",
};

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.42, delay: i * 0.055, ease: [0.22, 1, 0.36, 1] },
  }),
};

const DIFF = {
  easy:   { bg: T.greenTint,  text: T.green,  border: T.greenBorder,  label: "Easy"   },
  medium: { bg: T.yellowTint, text: T.yellow, border: "rgba(255,139,0,0.2)", label: "Medium" },
  hard:   { bg: T.redTint,    text: T.red,    border: "rgba(222,53,11,0.2)", label: "Hard"   },
};

function Badge({ children, color, bg, border, style = {} }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 3,
      background: bg, color, border: `1px solid ${border}`,
      ...style,
    }}>
      {children}
    </span>
  );
}

function Card({ children, style = {}, hover = true, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.bg,
        border: `1px solid ${hovered ? "#B3CCFF" : T.border}`,
        borderRadius: 8,
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
        boxShadow: hovered ? "0 4px 16px rgba(24,104,219,0.10)" : "0 1px 4px rgba(0,0,0,0.04)",
        transform: hovered && onClick ? "translateY(-1px)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta, deltaUp, accentColor, index }) {
  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={fadeUp}>
      <Card style={{ padding: "20px 22px", position: "relative", overflow: "hidden" }}>

        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: accentColor, borderRadius: "8px 8px 0 0",
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 6,
            background: `${accentColor}14`,
            border: `1px solid ${accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={16} color={accentColor} />
          </div>
          {delta && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: deltaUp ? T.green : T.red,
              background: deltaUp ? T.greenTint : T.redTint,
              border: `1px solid ${deltaUp ? T.greenBorder : "rgba(222,53,11,0.2)"}`,
              padding: "2px 7px", borderRadius: 3,
            }}>
              {deltaUp ? "↑" : "↓"} {delta}
            </span>
          )}
        </div>

        <div style={{
          fontSize: 28, fontWeight: 800, color: T.dark,
          letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 4,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{label}</div>
      </Card>
    </motion.div>
  );
}

function SessionCard({ session, isUserIn, onJoin, index }) {
  const diff = DIFF[session.difficulty] || DIFF.medium;
  const isLive = session.status === "active";

  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={fadeUp}>
      <Card
        onClick={() => onJoin(session._id)}
        style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: T.blueTint,
          border: `1px solid rgba(24,104,219,0.2)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Code2Icon size={17} color={T.blue} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: T.dark,
            marginBottom: 5, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {session.problem || "Untitled Problem"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge color={diff.text} bg={diff.bg} border={diff.border}>{diff.label}</Badge>
            <span style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
              <UsersIcon size={11} />
              {session.host?.firstName || "Host"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {isLive && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: T.greenTint, padding: "4px 9px", borderRadius: 3,
              border: `1px solid ${T.greenBorder}`,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: T.green,
                animation: "iv-pulse 2s infinite",
              }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: "0.05em" }}>LIVE</span>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(session._id); }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 14px", borderRadius: 4, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              background: isUserIn ? T.surface2 : T.blue,
              color: isUserIn ? T.dark : "#fff",
              border: isUserIn ? `1px solid ${T.border}` : "none",
              transition: "background 0.15s",
            }}
          >
            <PlayIcon size={10} fill={isUserIn ? T.dark : "#fff"} />
            {isUserIn ? "Resume" : "Join"}
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

function RecentRow({ session, index }) {
  const diff = DIFF[session.difficulty] || DIFF.medium;
  const date = session.createdAt
    ? new Date(session.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

  return (
    <motion.tr custom={index} initial="hidden" animate="visible" variants={fadeUp}>
      <td style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border2}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, flexShrink: 0,
            background: T.blueTint, border: `1px solid rgba(24,104,219,0.15)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Code2Icon size={12} color={T.blue} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.dark }}>{session.problem || "Untitled"}</span>
        </div>
      </td>
      <td style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border2}` }}>
        <Badge color={diff.text} bg={diff.bg} border={diff.border}>{diff.label}</Badge>
      </td>
      <td style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border2}`, fontSize: 13, color: T.muted }}>
        {session.host?.firstName || "—"}
      </td>
      <td style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border2}` }}>
        <span style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center", gap: 5 }}>
          <CalendarIcon size={11} /> {date}
        </span>
      </td>
      <td style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border2}` }}>
        <Badge color={T.green} bg={T.greenTint} border={T.greenBorder}>Completed</Badge>
      </td>
    </motion.tr>
  );
}

function SkeletonRow() {
  return (
    <div style={{
      background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
      padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: T.surface2 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 13, width: "52%", borderRadius: 4, background: T.surface2 }} />
        <div style={{ height: 10, width: "28%", borderRadius: 4, background: T.surface2 }} />
      </div>
      <div style={{ width: 68, height: 30, borderRadius: 4, background: T.surface2 }} />
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, action, onAction }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "44px 24px", gap: 10, textAlign: "center",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: T.surface2, border: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2,
      }}>
        <Icon size={20} color={T.muted} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.dark }}>{title}</div>
      <div style={{ fontSize: 13, color: T.muted, maxWidth: 240, lineHeight: 1.6 }}>{subtitle}</div>
      {action && (
        <button
          onClick={onAction}
          style={{
            marginTop: 6, display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 4, border: "none",
            background: T.blue, color: "#fff", fontSize: 13,
            fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
          }}
        >
          <PlusIcon size={13} /> {action}
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ problem: "", difficulty: "" });

  const createSessionMutation = useCreateSession();
  const { data: activeSessionsData,  isLoading: loadingActive  } = useActiveSessions();
  const { data: recentSessionsData,  isLoading: loadingRecent  } = useMyRecentSessions();

  const handleCreateRoom = () => {
    if (!roomConfig.problem || !roomConfig.difficulty) return;
    createSessionMutation.mutate(
      { problem: roomConfig.problem, difficulty: roomConfig.difficulty.toLowerCase() },
      {
        onSuccess: (data) => {
          setShowCreateModal(false);
          navigate(`/session/${data.session._id}`);
        },
      }
    );
  };

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const isUserIn = (s) =>
    user?.id && (s.host?.clerkId === user.id || s.participant?.clerkId === user.id);

  const firstName = user?.firstName || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .iv-dash { font-family: 'DM Sans', system-ui, sans-serif; }
        @keyframes iv-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.5; transform:scale(.82); }
        }
        .iv-table { width:100%; border-collapse:collapse; }
        .iv-table th {
          text-align:left; padding:10px 18px;
          font-size:10px; font-weight:700; color:${T.muted};
          text-transform:uppercase; letter-spacing:.08em;
          border-bottom:1px solid ${T.border2};
          background:${T.surface};
        }
        .iv-table tr:last-child td { border-bottom:none !important; }
        .iv-sidebar-cta {
          background: linear-gradient(135deg, #EBF2FF 0%, #F0F7FF 60%, #FAFCFF 100%);
          border: 1px solid rgba(24,104,219,0.18);
          border-radius: 8px;
          padding: 22px;
          position: relative;
          overflow: hidden;
        }
        .iv-sidebar-cta::before {
          content:'';
          position:absolute; top:-60px; right:-60px;
          width:140px; height:140px; border-radius:50%;
          background:rgba(24,104,219,0.07);
          pointer-events:none;
        }
        .iv-progress-track {
          height: 4px; background:${T.surface2}; border-radius:99px; overflow:hidden;
        }
      `}</style>

      <div className="iv-dash" style={{ minHeight: "100vh", background: T.surface, color: T.dark }}>
        <Navbar />

        <div style={{ background: T.bg, borderBottom: `1px solid ${T.border2}` }}>
          <div style={{
            maxWidth: 1280, margin: "0 auto",
            padding: "28px 32px 24px",
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between", gap: 20,
          }}>
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              {/* Greeting eyebrow */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: T.blueTint, border: `1px solid rgba(24,104,219,0.2)`,
                padding: "3px 10px", borderRadius: 3, marginBottom: 10,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: T.blue, animation: "iv-pulse 2s infinite",
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, color: T.blue,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  {greeting}
                </span>
              </div>

              <h1 style={{
                fontSize: 26, fontWeight: 800, color: T.dark,
                letterSpacing: "-0.4px", lineHeight: 1.1, marginBottom: 5,
              }}>
                {firstName}'s Dashboard
              </h1>
              <p style={{ fontSize: 13, color: T.muted, fontWeight: 400 }}>
                Manage sessions, track candidates, and hire with confidence.
              </p>
            </motion.div>

            <motion.div
              custom={1} initial="hidden" animate="visible" variants={fadeUp}
              style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}
            >
              <button style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 4,
                border: `1px solid ${T.border}`, background: T.bg,
                fontSize: 13, fontWeight: 500, color: T.muted,
                fontFamily: "inherit", cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}>
                <BarChart3Icon size={14} />
                Analytics
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 18px", borderRadius: 4,
                  border: "none", background: T.blue,
                  fontSize: 13, fontWeight: 600, color: "#fff",
                  fontFamily: "inherit", cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(24,104,219,0.28)",
                  transition: "background 0.15s",
                }}
              >
                <PlusIcon size={14} />
                New Session
              </button>
            </motion.div>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px 72px" }}>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14, marginBottom: 24,
          }}>
            {[
              { icon: ZapIcon,          label: "Active Sessions",     value: activeSessions.length, deltaUp: true,  accentColor: T.blue   },
              { icon: CheckCircle2Icon, label: "Sessions Completed",  value: recentSessions.length, deltaUp: true,  accentColor: T.green  },
              { icon: UsersIcon,        label: "Candidates Reviewed", value: recentSessions.length, accentColor: "#6554C0" },
              { icon: TrendingUpIcon,   label: "Avg. Score", value: "78.4",deltaUp: true,  accentColor: T.yellow },
            ].map((s, i) => (
              <StatCard key={s.label} {...s} index={i} />
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
                <Card style={{ overflow: "hidden" }} hover={false}>
                  <div style={{
                    padding: "16px 20px", borderBottom: `1px solid ${T.border2}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: T.bg,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: T.green, animation: "iv-pulse 2s infinite",
                      }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.dark }}>Active Sessions</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: T.blue,
                        background: T.blueTint, border: `1px solid rgba(24,104,219,0.2)`,
                        padding: "2px 7px", borderRadius: 3,
                      }}>
                        {activeSessions.length}
                      </span>
                    </div>
                    <button style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 3,
                    }}>
                      View all <ChevronRightIcon size={13} />
                    </button>
                  </div>

                  <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, background: T.surface }}>
                    {loadingActive ? (
                      <><SkeletonRow /><SkeletonRow /></>
                    ) : activeSessions.length === 0 ? (
                      <EmptyState
                        icon={VideoIcon}
                        title="No active sessions"
                        subtitle="Start a new interview session to get going."
                        action="Create Session"
                        onAction={() => setShowCreateModal(true)}
                      />
                    ) : (
                      activeSessions.map((s, i) => (
                        <SessionCard
                          key={s._id} session={s}
                          isUserIn={isUserIn(s)}
                          onJoin={(id) => navigate(`/session/${id}`)}
                          index={i}
                        />
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>

              <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
                <Card style={{ overflow: "hidden" }} hover={false}>
                  <div style={{
                    padding: "16px 20px", borderBottom: `1px solid ${T.border2}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: T.bg,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ClockIcon size={14} color={T.muted} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.dark }}>Recent Sessions</span>
                    </div>
                    <button style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 600, color: T.blue, fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 3,
                    }}>
                      View all <ChevronRightIcon size={13} />
                    </button>
                  </div>

                  {loadingRecent ? (
                    <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, background: T.surface }}>
                      <SkeletonRow /><SkeletonRow /><SkeletonRow />
                    </div>
                  ) : recentSessions.length === 0 ? (
                    <div style={{ background: T.surface }}>
                      <EmptyState
                        icon={ClockIcon}
                        title="No sessions yet"
                        subtitle="Your completed sessions will appear here."
                      />
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto", background: T.bg }}>
                      <table className="iv-table">
                        <thead>
                          <tr>
                            {["Problem", "Difficulty", "Host", "Date", "Status"].map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {recentSessions.map((s, i) => (
                            <RecentRow key={s._id} session={s} index={i} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
                <div className="iv-sidebar-cta">
                  <div style={{ position: "relative" }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: T.blueTint, border: `1px solid rgba(24,104,219,0.22)`,
                      padding: "3px 9px", borderRadius: 3, marginBottom: 12,
                    }}>
                      <ZapIcon size={10} color={T.blue} />
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: T.blue,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                      }}>Quick Start</span>
                    </div>

                    <div style={{
                      fontSize: 17, fontWeight: 700, color: T.dark,
                      lineHeight: 1.35, marginBottom: 8,
                    }}>
                      Launch a session in under 60 seconds
                    </div>
                    <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 18 }}>
                      Pick a problem, invite a candidate, and let AI handle the scoring.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 7,
                        padding: "10px 18px", borderRadius: 4, border: "none",
                        background: T.blue, color: "#fff",
                        fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(24,104,219,0.28)",
                        transition: "background 0.15s",
                      }}
                    >
                      <PlusIcon size={13} />
                      Create New Session
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
                <Card style={{ padding: "18px 20px" }} hover={false}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 18,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.dark }}>Performance Snapshot</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      This month
                    </span>
                  </div>

                  {[
                    { label: "Problem Solving", score: 82, color: T.blue     },
                    { label: "Code Quality",    score: 74, color: "#6554C0"  },
                    { label: "Communication",   score: 91, color: T.green    },
                  ].map((m, i) => (
                    <div key={m.label} style={{ marginBottom: i < 2 ? 16 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                        <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{m.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.dark }}>{m.score}%</span>
                      </div>
                      <div className="iv-progress-track">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.score}%` }}
                          transition={{ duration: 0.85, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          style={{
                            height: "100%",
                            background: m.color,
                            borderRadius: 99,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div style={{
                    marginTop: 18, paddingTop: 14,
                    borderTop: `1px solid ${T.border2}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: 12, color: T.muted }}>Overall average</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: T.dark, letterSpacing: "-0.5px" }}>
                      82.3%
                    </span>
                  </div>
                </Card>
              </motion.div>

              <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}>
                <Card style={{ padding: "18px 20px" }} hover={false}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.dark, marginBottom: 16 }}>
                    Recent Activity
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                      {
                        icon: CheckCircle2Icon, color: T.green, bg: T.greenTint,
                        text: "Session with Alex R. completed", time: "2h ago",
                      },
                      {
                        icon: ZapIcon, color: T.blue, bg: T.blueTint,
                        text: "AI rubric generated for JS session", time: "5h ago",
                      },
                      {
                        icon: UsersIcon, color: "#6554C0", bg: "rgba(101,84,192,0.08)",
                        text: "New candidate joined your session", time: "Yesterday",
                      },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                            background: item.bg,
                            border: `1px solid ${item.color}25`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Icon size={13} color={item.color} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: T.dark, fontWeight: 500, lineHeight: 1.5 }}>
                              {item.text}
                            </div>
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 2, fontWeight: 400 }}>
                              {item.time}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
                <div style={{
                  padding: "14px 16px",
                  background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    Trusted by teams at
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    {["Airbnb", "eBay", "Spotify", "Cisco"].map((co) => (
                      <span key={co} style={{ fontSize: 11, fontWeight: 800, color: T.border, letterSpacing: "0.04em" }}>
                        {co}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomConfig={roomConfig}
        setRoomConfig={setRoomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
      />
    </>
  );
}
//Increment 1 UI Changes