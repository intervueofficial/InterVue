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
        .ivnav-wrap {
          position: sticky;
          top: 16px;
          z-index: 100;
          display: flex;
          justify-content: center;
          padding: 0 16px;
        }

        .ivnav-bar {
          width: 100%;
          max-width: 1240px;
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 18px;
          box-shadow:
            0 8px 32px rgba(37, 99, 235, 0.08),
            0 2px 8px rgba(15, 23, 42, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .ivnav-inner {
          padding: 0 20px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ivnav-logo {
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .ivnav-logo-name {
          font-size: 19px;
          font-weight: 700;
          color: #2563EB;
          letter-spacing: -0.3px;
        }

        .ivnav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(241, 245, 249, 0.5);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.6);
        }

        .ivnav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9px;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          color: #64748B;
          white-space: nowrap;
          transition: color 0.2s ease, background-color 0.25s ease, transform 0.15s ease;
        }

        .ivnav-link:hover {
          background: rgba(37, 99, 235, 0.08);
          color: #2563EB;
          transform: translateY(-1px);
        }

        .ivnav-link.active {
          background: rgba(37, 99, 235, 0.12);
          color: #2563EB;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.15);
        }

        .ivnav-link svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .ivnav-link:hover svg {
          transform: scale(1.08);
        }

        .ivnav-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }

        .ivnav-divider {
          width: 1px;
          height: 22px;
          background: rgba(148, 163, 184, 0.35);
        }

        @media (max-width: 720px) {
          .ivnav-wrap { top: 8px; padding: 0 8px; }
          .ivnav-bar { border-radius: 14px; }
          .ivnav-link span { display: none; }
          .ivnav-link { padding: 8px; }
          .ivnav-inner { padding: 0 14px; }
          .ivnav-links { gap: 2px; padding: 3px; }
        }
      `}</style>

      <div className="ivnav-wrap">
        <div className="ivnav-bar">
          <div className="ivnav-inner">
            <Link to="/" className="ivnav-logo">
              <img
                src="/logo.png"
                alt="InterVue"
                style={{ width: 44, height: 44, objectFit: "contain" }}
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
      </div>
    </>
  );
}

export default Navbar;