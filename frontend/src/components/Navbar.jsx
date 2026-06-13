import { Link, useLocation } from "react-router";
import { BookOpenIcon, LayoutDashboardIcon, SparklesIcon } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');

        .navbar-shell {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: calc(100% - 48px);
          max-width: 860px;
          font-family: 'Sora', sans-serif;
        }

        .navbar-inner {
  background: rgba(255, 255, 255, 0.06);

  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);

  border: 1px solid rgba(255, 255, 255, 0.18);

  border-radius: 20px;

  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);

  padding: 10px 16px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  transition: all 0.3s ease;
}

       .navbar-inner:hover {
  box-shadow:
    0 12px 40px rgba(56, 67, 215, 0.18),
    inset 0 1px 0 rgba(72, 151, 215, 0.35);
}

        /* LOGO */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: transform 0.2s ease;
        }

        .nav-logo:hover {
          transform: scale(1.03);
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6e88f0 0%, #5a84f0 50%, #6f7eed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(80, 130, 237, 0.35);
          flex-shrink: 0;
        }

        .logo-icon svg {
          width: 18px;
          height: 18px;
          color: white;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .logo-name {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 16px;
          background: linear-gradient(135deg, #6366f1, #5c80f6, #7285e6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 0.04em;
        }

        .logo-tagline {
          font-size: 10px;
          color: #4a8deb;
          font-weight: 500;
          margin-top: 2px;
          letter-spacing: 0.02em;
        }

        /* NAV LINKS */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 12px;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.18s ease;
          white-space: nowrap;
          position: relative;
          letter-spacing: 0.01em;
        }

        .nav-link:hover {
          color: #5c76ea;
          background: rgba(99, 102, 241, 0.07);
        }

        .nav-link svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          transition: transform 0.18s ease;
        }

        .nav-link:hover svg {
          transform: scale(1.1);
        }

        .nav-link.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08));
          color: #4b6de7ee;
          font-weight: 600;
          box-shadow: 0 1px 6px rgba(99, 102, 241, 0.12);
        }

        .active-dot {
          position: absolute;
          bottom: 5px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #5b7feb;
          opacity: 0;
          transition: opacity 0.18s ease;
        }

        .nav-link.active .active-dot {
          opacity: 1;
        }

        /* DIVIDER */
        .nav-divider {
          width: 1px;
          height: 22px;
          background: linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.15), transparent);
          margin: 0 6px;
          flex-shrink: 0;
        }

        /* USER BUTTON WRAPPER */
        .nav-user {
          display: flex;
          align-items: center;
        }

        /* BODY OFFSET */
        .navbar-spacer {
          height: 80px;
        }

        @media (max-width: 540px) {
          .navbar-shell {
            width: calc(100% - 24px);
            top: 10px;
          }
          .nav-link span {
            display: none;
          }
          .nav-link {
            padding: 8px 10px;
          }
          .logo-tagline {
            display: none;
          }
        }
      `}</style>

      <div className="navbar-shell">
        <div className="navbar-inner">

          {/* LOGO */}
          <Link
  to="/"
  style={{
    display: "flex",
    alignItems: "center",
    gap: "4px",
    textDecoration: "none",
  }}

>
  <img
  src="/logo.png"
  alt="InterVue"
  style={{
    width: "68px",
    height: "68px",
    objectFit: "contain",
    transform: "scale(1.35)",
    marginRight: "-10px",
    display: "block",
  }}
/>

  <div
    style={{
      display: "flex",
      flexDirection: "column",
      lineHeight: 1,
    }}
  >
    <span
      style={{
        fontSize: "18px",
        fontWeight: 800,
        color: "#3a82ed",
        letterSpacing: "-0.5px",
      }}
    >
      InterVue
    </span>

    <span
      style={{
        fontSize: "10px",
        color: "#94A3B8",
        marginTop: "2px",
      }}
    >
      Code Together
    </span>
  </div>
</Link>

          {/* NAV LINKS + USER */}
          <div className="nav-links">

<Link
  to="/QuizePage"
  className={`nav-link ${isActive("/QuizePage") ? "active" : ""}`}
>
  <BookOpenIcon />
  <span>Quiz</span>
  <span className="active-dot" />
</Link>  
            
          <Link
              to="/problems"
              className={`nav-link ${isActive("/problems") ? "active" : ""}`}
            >
              <BookOpenIcon />
              <span>Problems</span>
              <span className="active-dot" />
            </Link>

            <Link
              to="/dashboard"
              className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
            >
              <LayoutDashboardIcon />
              <span>Dashboard</span>
              <span className="active-dot" />
            </Link>

            <div className="nav-divider" />

            <div className="nav-user">
              <UserButton />
            </div>

          </div>
        </div>
      </div>

      {/* Spacer so page content doesn't hide under the floating bar */}
      <div className="navbar-spacer" />
    </>
  );
}

export default Navbar;