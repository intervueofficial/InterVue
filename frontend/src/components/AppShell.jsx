import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  LayoutDashboardIcon,
  UsersIcon,
  Code2Icon,
  ClipboardListIcon,
  VideoIcon,
  BarChart3Icon,
  SettingsIcon,
  CalendarCheckIcon,
  TrophyIcon,
  MenuIcon,
  XIcon,
  SearchIcon,
  BotIcon,
  BriefcaseIcon,
  UserCheckIcon,
  ClockIcon,
  UserCogIcon,
  UserCircleIcon,
  CreditCardIcon,
  GitBranchIcon,
  MailIcon,
  HistoryIcon,
  HeartPulseIcon,
  ArchiveIcon,
} from "lucide-react";

import { THEME } from "../constants/theme";

/* ─── Nav config — real routes only, grouped like the sidebar's sections ── */
const NAV_BY_SCOPE = {
  admin: [
    {
      label: "Workspace",
      items: [
        { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
        { to: "/admin/sessions", label: "Sessions", icon: VideoIcon },
        { to: "/admin/history", label: "History", icon: ArchiveIcon },
        { to: "/admin/users", label: "People", icon: UsersIcon },
        { to: "/admin/interviewer-requests", label: "Approvals", icon: UserCogIcon },
        { to: "/admin/billing", label: "Billing", icon: CreditCardIcon },
        { to: "/admin/pipeline", label: "Pipeline", icon: GitBranchIcon },
      ],
    },
    {
      label: "Library",
      items: [
        { to: "/admin/problems", label: "Problems", icon: Code2Icon },
        { to: "/admin/quiz", label: "Quizzes", icon: ClipboardListIcon },
        { to: "/admin/jobs", label: "Jobs", icon: BriefcaseIcon },
        { to: "/admin/email-templates", label: "Email Templates", icon: MailIcon },
      ],
    },
    {
      label: "Insights",
      items: [
        { to: "/admin/analytics", label: "Analytics", icon: BarChart3Icon },
        { to: "/admin/audit-log", label: "Audit Log", icon: HistoryIcon },
        { to: "/admin/system-health", label: "System Health", icon: HeartPulseIcon },
        { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
      ],
    },
  ],
  interviewer: [
    {
      label: "Interviewer",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
        { to: "/sessions", label: "Sessions", icon: VideoIcon },
        { to: "/history", label: "History", icon: ArchiveIcon },
        { to: "/problems", label: "Problems", icon: Code2Icon },
        { to: "/quiz", label: "Quiz", icon: ClipboardListIcon },
        { to: "/applicants", label: "Applicants", icon: UserCheckIcon },
        { to: "/waitlist", label: "Waitlist", icon: ClockIcon },
      ],
    },
  ],
  candidate: [
    {
      label: "Candidate",
      items: [
        { to: "/candidate/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
        { to: "/candidate/jobs", label: "Jobs Board", icon: BriefcaseIcon },
        { to: "/candidate/profile", label: "My Profile", icon: UserCircleIcon },
        { to: "/bot", label: "Mock Interview", icon: BotIcon, external: true },
        { to: "/candidate/interviews", label: "My Interviews", icon: CalendarCheckIcon },
        { to: "/candidate/sessions", label: "Sessions", icon: VideoIcon },
        { to: "/candidate/results", label: "Results", icon: TrophyIcon },
      ],
    },
  ],
};

const ROLE_LABEL = {
  admin: "Admin",
  interviewer: "Interviewer",
  candidate: "Candidate",
};

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 min-w-0">
      <img
        src="/logo.png"
        alt="InterVue"
        style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }}
      />
      <span
        style={{ fontFamily: THEME.fontDisplay, fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}
      >
        InterVue<span style={{ color: THEME.inkMuted }}>Pro</span>
      </span>
    </Link>
  );
}

function QuickSearch({ groups, onNavigate }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const allItems = groups.flatMap((g) => g.items);

  const matches =
    query.trim().length > 0
      ? allItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
      : [];

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && matches.length > 0) {
      const match = matches[0];
      if (match.external) {
        window.location.href = match.to;
      } else {
        navigate(match.to);
        setQuery("");
        onNavigate?.();
      }
    }
    if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div className="px-3 mb-3 relative">
      <div className="relative">
        <SearchIcon
          size={13}
          color={THEME.inkFaint}
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search pages…"
          className="w-full text-[12.5px] outline-none"
          style={{
            padding: "7px 10px 7px 28px",
            borderRadius: 8,
            border: `1px solid ${THEME.border}`,
            background: THEME.surface,
            color: THEME.ink,
          }}
        />
      </div>

      {matches.length > 0 && (
        <div
          className="absolute left-3 right-3 mt-1.5 rounded-lg overflow-hidden z-10"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, boxShadow: "0 8px 24px rgba(23,23,31,0.08)" }}
        >
          {matches.map((item) => (
            <button
              key={item.to}
              onClick={() => {
                if (item.external) {
                  window.location.href = item.to;
                  return;
                }
                navigate(item.to);
                setQuery("");
                onNavigate?.();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors"
              style={{ color: THEME.ink }}
              onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <item.icon size={14} color={THEME.inkMuted} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavGroups({ groups, isActive, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p
            className="px-2 mb-1.5"
            style={{
              fontFamily: THEME.fontMono,
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: THEME.inkFaint,
            }}
          >
            {group.label}
          </p>

          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;

              const linkStyle = {
                background: active ? THEME.ink : "transparent",
                color: active ? THEME.surface : "rgba(23,23,31,0.72)",
              };

              const hoverHandlers = {
                onMouseEnter: (e) => {
                  if (!active) e.currentTarget.style.background = THEME.surface2;
                },
                onMouseLeave: (e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                },
              };

              // Items marked `external` (e.g. Mock Interview → /bot) need a
              // real full-page navigation, not client-side routing. /bot is
              // proxied at the hosting layer (see vercel.json) to a
              // separately-deployed app — that rewrite only ever fires on
              // an actual browser request, never on React Router's
              // client-side <Link> navigation, which doesn't hit the
              // network at all.
              if (item.external) {
                return (
                  <li key={item.to}>
                    <a
                      href={item.to}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors"
                      style={linkStyle}
                      {...hoverHandlers}
                    >
                      <Icon size={16} style={{ flexShrink: 0 }} />
                      <span className="truncate">{item.label}</span>
                    </a>
                  </li>
                );
              }

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors"
                    style={linkStyle}
                    {...hoverHandlers}
                  >
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarContent({ scope, groups, isActive, onNavigate }) {
  const { user } = useUser();

  return (
    <>
      <div
        className="flex items-center gap-2 h-14 px-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${THEME.border}` }}
      >
        <Logo />
        <span
          className="ml-auto px-1.5 py-0.5 rounded-md"
          style={{
            fontFamily: THEME.fontMono,
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: THEME.inkMuted,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {ROLE_LABEL[scope]}
        </span>
      </div>

      <div style={{ marginTop: 14 }}>
        <QuickSearch groups={groups} onNavigate={onNavigate} />
        <NavGroups groups={groups} isActive={isActive} onNavigate={onNavigate} />
      </div>

      <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${THEME.border}` }}>
        <div
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
          onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <UserButton
            appearance={{
              elements: { userButtonAvatarBox: { width: 32, height: 32 } },
            }}
          />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium" style={{ color: THEME.ink }}>
              {user?.fullName || "Account"}
            </p>
            <p className="truncate text-[11px]" style={{ color: THEME.inkMuted }}>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Unified sidebar shell shared by admin, interviewer, and candidate pages.
 * Usage: <AppShell scope="admin">{page content}</AppShell>
 */
function AppShell({ scope, children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = NAV_BY_SCOPE[scope] || [];

  const isActive = (to) => location.pathname === to;

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ background: THEME.background, color: THEME.ink, fontFamily: THEME.fontSans }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0"
        style={{ borderRight: `1px solid ${THEME.border}`, background: "rgba(245,244,241,0.5)" }}
      >
        <SidebarContent scope={scope} groups={groups} isActive={isActive} onNavigate={() => {}} />
      </aside>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4"
        style={{ background: THEME.surface, borderBottom: `1px solid ${THEME.border}` }}
      >
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-md"
          style={{ border: `1px solid ${THEME.border}` }}
        >
          <MenuIcon size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: "rgba(23,23,31,0.4)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col"
            style={{ background: THEME.surface, borderRight: `1px solid ${THEME.border}` }}
          >
            <div className="flex items-center justify-between h-14 px-4" style={{ borderBottom: `1px solid ${THEME.border}` }}>
              <Logo />
              <button onClick={() => setMobileOpen(false)}>
                <XIcon size={18} />
              </button>
            </div>
            <div style={{ marginTop: 14 }} className="flex-1 flex flex-col overflow-y-auto">
              <QuickSearch groups={groups} onNavigate={() => setMobileOpen(false)} />
              <NavGroups groups={groups} isActive={isActive} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 pt-14 lg:pt-0">
        <main className="px-4 py-6 sm:px-8 sm:py-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
