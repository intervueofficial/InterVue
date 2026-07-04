import { Link, useLocation } from "react-router";
import {
  BookOpenIcon,
  LayoutDashboardIcon,
  CalendarDaysIcon,
  HelpCircleIcon,
  ClipboardListIcon,
  BarChart3Icon,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

import useAuthUser from "../hooks/useAuthUser";

const INTERVIEWER_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/problems", label: "Problems", icon: BookOpenIcon },
  { to: "/quiz", label: "Quiz", icon: HelpCircleIcon },
  { to: "/sessions", label: "Sessions", icon: CalendarDaysIcon },
];

const CANDIDATE_LINKS = [
  { to: "/candidate/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/candidate/interviews", label: "My Interviews", icon: ClipboardListIcon },
  { to: "/candidate/sessions", label: "Sessions", icon: CalendarDaysIcon },
  { to: "/candidate/results", label: "Results", icon: BarChart3Icon },
];

function Navbar() {
  const location = useLocation();
  const { data: authUser } = useAuthUser();

  const isActive = (path) => location.pathname === path;

  const links =
    authUser?.role === "candidate" ? CANDIDATE_LINKS : INTERVIEWER_LINKS;

  return (
    <>
      <style>{`
        .ivnav-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #fff;
          border-bottom: 1px solid #E5E9F0;
        }

        .ivnav-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ivnav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .ivnav-logo-name {
          font-size: 16px;
          font-weight: 700;
          color: #2563EB;
          letter-spacing: -0.3px;
        }

        .ivnav-links {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .ivnav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          color: #64748B;
          transition: background-color 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }

        .ivnav-link:hover {
          background: #F8FAFC;
          color: #334155;
        }

        .ivnav-link.active {
          background: rgba(37,99,235,0.08);
          color: #2563EB;
          font-weight: 600;
        }

        .ivnav-link svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }

        .ivnav-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .ivnav-divider {
          width: 1px;
          height: 22px;
          background: #E5E9F0;
        }

        @media (max-width: 720px) {
          .ivnav-link span { display: none; }
          .ivnav-link { padding: 8px; }
          .ivnav-inner { padding: 0 16px; }
        }
      `}</style>

      <div className="ivnav-bar">
        <div className="ivnav-inner">
          <Link to="/" className="ivnav-logo">
            <img
              src="/logo.png"
              alt="InterVue"
              style={{ width: 30, height: 30, objectFit: "contain" }}
            />
            <span className="ivnav-logo-name">InterVue</span>
          </Link>

          <div className="ivnav-links">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`ivnav-link ${isActive(to) ? "active" : ""}`}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="ivnav-right">
            <div className="ivnav-divider" />
            <UserButton />
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
