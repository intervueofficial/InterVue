import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const roles = [
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
            /*
              Apple-style frosted glass: the overlay carries NO dark tint —
              it's blur only, so the page behind (and its actual colors)
              stays clearly visible, like macOS/iOS Control Center. All the
              "glass" comes from blur + saturation, not from darkening or
              whitening what's underneath. Text stays pure black throughout
              for contrast against whatever bleeds through.
            */
            .ivp-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(3px);
              -webkit-backdrop-filter: blur(3px);
            }

            .ivp-modal {
              position: relative;
              width: 100%;
              max-width: 560px;
              max-height: calc(100vh - 48px);
              overflow-y: auto;
              border-radius: 22px;
              border: 1px solid rgba(255, 255, 255, 0.55);
              background: rgba(255, 255, 255, 0.22);
              backdrop-filter: blur(42px) saturate(190%);
              -webkit-backdrop-filter: blur(42px) saturate(190%);
              box-shadow:
                0 24px 70px -12px rgba(0, 0, 0, 0.3),
                0 1px 0 0 rgba(255, 255, 255, 0.6) inset,
                0 0 0 1px rgba(255, 255, 255, 0.15) inset;
              font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }

            .ivp-topbar {
              height: 3px;
              width: 100%;
              background: linear-gradient(90deg, rgba(10,10,10,0.5), rgba(10,10,10,0.15));
            }

            .ivp-header {
              padding: 32px 36px 20px;
              text-align: center;
              background: rgba(255, 255, 255, 0.08);
              border-bottom: 1px solid rgba(255, 255, 255, 0.35);
            }

            .ivp-title {
              margin: 0;
              font-size: 26px;
              font-weight: 700;
              color: #000000;
              letter-spacing: -0.01em;
            }

            .ivp-subtitle {
              margin: 8px 0 0;
              font-size: 14px;
              color: #000000;
              opacity: 0.62;
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
              border: 1px solid rgba(255, 255, 255, 0.4);
              background: rgba(255, 255, 255, 0.14);
              backdrop-filter: blur(16px) saturate(160%);
              -webkit-backdrop-filter: blur(16px) saturate(160%);
              cursor: pointer;
              transition: border-color 0.18s ease, background-color 0.18s ease,
                box-shadow 0.18s ease, transform 0.18s ease;
              font-family: inherit;
            }

            .ivp-role-card:hover {
              border-color: rgba(255, 255, 255, 0.65);
              background: rgba(255, 255, 255, 0.26);
              box-shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.18);
              transform: translateY(-1px);
            }

            .ivp-role-card:focus-visible {
              outline: 2px solid #000000;
              outline-offset: 2px;
            }

            .ivp-role-card--active {
              border-color: rgba(0, 0, 0, 0.55);
              background: rgba(255, 255, 255, 0.34);
              box-shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.22);
            }

            .ivp-role-badge {
              flex-shrink: 0;
              width: 42px;
              height: 42px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(255, 255, 255, 0.3);
              color: #000000;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.02em;
              border: 1px solid rgba(255, 255, 255, 0.5);
            }

            .ivp-role-card--active .ivp-role-badge {
              background: #0a0a0a;
              color: #ffffff;
              border-color: #0a0a0a;
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
              color: #000000;
            }

            .ivp-role-desc {
              font-size: 13.5px;
              line-height: 1.5;
              color: #000000;
              opacity: 0.6;
            }

            .ivp-role-indicator {
              flex-shrink: 0;
              width: 18px;
              height: 18px;
              margin-top: 2px;
              border-radius: 50%;
              border: 2px solid rgba(0, 0, 0, 0.3);
              background: rgba(255, 255, 255, 0.35);
              transition: border-color 0.18s ease, background-color 0.18s ease;
            }

            .ivp-role-card--active .ivp-role-indicator {
              border-color: #0a0a0a;
              background: #0a0a0a;
              box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.85);
            }

            .ivp-footer {
              display: flex;
              gap: 12px;
              padding: 20px 28px 28px;
              border-top: 1px solid rgba(255, 255, 255, 0.35);
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
              background: rgba(255, 255, 255, 0.18);
              border: 1px solid rgba(255, 255, 255, 0.5);
              color: #000000;
              backdrop-filter: blur(14px) saturate(160%);
              -webkit-backdrop-filter: blur(14px) saturate(160%);
            }

            .ivp-btn--ghost:hover {
              background: rgba(255, 255, 255, 0.32);
              border-color: rgba(255, 255, 255, 0.7);
            }

            .ivp-btn--primary {
              background: #0a0a0a;
              border: 1px solid #0a0a0a;
              color: #ffffff;
            }

            .ivp-btn--primary:hover:not(:disabled) {
              background: #262626;
              border-color: #262626;
            }

            .ivp-btn--primary:disabled {
              opacity: 0.35;
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