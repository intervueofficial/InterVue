import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const roles = [
  {
    id: "admin",
    title: "Administrator",
    description:
      "Manage users, interview schedules, coding problems, quizzes and platform analytics.",
    initials: "AD",
  },
  {
    id: "interviewer",
    title: "Interviewer",
    description:
      "Conduct interviews, evaluate candidates, trigger coding rounds and quizzes.",
    initials: "IN",
  },
  {
    id: "candidate",
    title: "Candidate",
    description:
      "Attend interviews, solve coding problems, complete quizzes and track your performance.",
    initials: "CA",
  },
];

const RoleSelectionModal = ({
  open,
  selectedRole,
  setSelectedRole,
  onClose,
  onContinue,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ivp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose?.();
          }}
        >
          <motion.div
            className="ivp-modal"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ivp-modal-title"
          >
            <div className="ivp-topbar" />

            <header className="ivp-header">
              <h2 id="ivp-modal-title" className="ivp-title">
                Choose your role
              </h2>
              <p className="ivp-subtitle">
                Select how you would like to continue to InterVuePro
              </p>
            </header>

            <div className="ivp-role-list" role="radiogroup" aria-label="Available roles">
              {roles.map((role) => {
                const active = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedRole(role.id)}
                    className={`ivp-role-card${active ? " ivp-role-card--active" : ""}`}
                  >
                    <span className="ivp-role-badge">{role.initials}</span>
                    <span className="ivp-role-copy">
                      <span className="ivp-role-title">{role.title}</span>
                      <span className="ivp-role-desc">{role.description}</span>
                    </span>
                    <span className="ivp-role-indicator" aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            <footer className="ivp-footer">
              <button type="button" className="ivp-btn ivp-btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="ivp-btn ivp-btn--primary"
                disabled={!selectedRole}
                onClick={() => onContinue(selectedRole)}
              >
                Continue
              </button>
            </footer>
          </motion.div>

          <style>{`
            .ivp-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: rgba(15, 23, 42, 0.55);
              backdrop-filter: blur(6px);
            }

            .ivp-modal {
              width: 100%;
              max-width: 560px;
              max-height: calc(100vh - 48px);
              overflow-y: auto;
              border-radius: 20px;
              background: #ffffff;
              box-shadow: 0 24px 60px -12px rgba(15, 23, 42, 0.35);
              font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }

            .ivp-topbar {
              height: 4px;
              width: 100%;
              background: #2563eb;
            }

            .ivp-header {
              padding: 32px 36px 20px;
              text-align: center;
              background: #eff6ff;
              border-bottom: 1px solid #dbeafe;
            }

            .ivp-title {
              margin: 0;
              font-size: 26px;
              font-weight: 700;
              color: #2563eb;
              letter-spacing: -0.01em;
            }

            .ivp-subtitle {
              margin: 8px 0 0;
              font-size: 14px;
              color: #64748b;
            }

            .ivp-role-list {
              padding: 24px 28px;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .ivp-role-card {
              display: flex;
              align-items: flex-start;
              gap: 16px;
              width: 100%;
              text-align: left;
              padding: 16px 18px;
              border-radius: 14px;
              border: 1px solid #e2e8f0;
              background: #ffffff;
              cursor: pointer;
              transition: border-color 0.18s ease, background-color 0.18s ease,
                box-shadow 0.18s ease, transform 0.18s ease;
              font-family: inherit;
            }

            .ivp-role-card:hover {
              border-color: #93c5fd;
              box-shadow: 0 6px 16px -8px rgba(37, 99, 235, 0.25);
              transform: translateY(-1px);
            }

            .ivp-role-card:focus-visible {
              outline: 2px solid #2563eb;
              outline-offset: 2px;
            }

            .ivp-role-card--active {
              border-color: #2563eb;
              background: #eff6ff;
              box-shadow: 0 6px 16px -8px rgba(37, 99, 235, 0.3);
            }

            .ivp-role-badge {
              flex-shrink: 0;
              width: 42px;
              height: 42px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #eff6ff;
              color: #2563eb;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.02em;
              border: 1px solid #dbeafe;
            }

            .ivp-role-card--active .ivp-role-badge {
              background: #2563eb;
              color: #ffffff;
              border-color: #2563eb;
            }

            .ivp-role-copy {
              display: flex;
              flex-direction: column;
              gap: 4px;
              flex: 1;
            }

            .ivp-role-title {
              font-size: 16px;
              font-weight: 600;
              color: #0f172a;
            }

            .ivp-role-desc {
              font-size: 13.5px;
              line-height: 1.5;
              color: #64748b;
            }

            .ivp-role-indicator {
              flex-shrink: 0;
              width: 18px;
              height: 18px;
              margin-top: 2px;
              border-radius: 50%;
              border: 2px solid #cbd5e1;
              background: #ffffff;
              transition: border-color 0.18s ease, background-color 0.18s ease;
            }

            .ivp-role-card--active .ivp-role-indicator {
              border-color: #2563eb;
              background: #2563eb;
              box-shadow: inset 0 0 0 3px #ffffff;
            }

            .ivp-footer {
              display: flex;
              gap: 12px;
              padding: 20px 28px 28px;
              border-top: 1px solid #eef2f7;
            }

            .ivp-btn {
              flex: 1;
              height: 46px;
              border-radius: 10px;
              font-size: 14.5px;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.18s ease, border-color 0.18s ease,
                color 0.18s ease, opacity 0.18s ease;
              font-family: inherit;
            }

            .ivp-btn--ghost {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              color: #334155;
            }

            .ivp-btn--ghost:hover {
              background: #f8fafc;
              border-color: #94a3b8;
            }

            .ivp-btn--primary {
              background: #2563eb;
              border: 1px solid #2563eb;
              color: #ffffff;
            }

            .ivp-btn--primary:hover:not(:disabled) {
              background: #1d4ed8;
              border-color: #1d4ed8;
            }

            .ivp-btn--primary:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            @media (max-width: 480px) {
              .ivp-header {
                padding: 26px 22px 18px;
              }

              .ivp-title {
                font-size: 22px;
              }

              .ivp-role-list {
                padding: 20px 18px;
              }

              .ivp-footer {
                padding: 16px 18px 22px;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoleSelectionModal;