import { useEffect, useRef, useCallback } from "react";
import {
  Code2Icon,
  LoaderIcon,
  PlusIcon,
  XIcon,
  ChevronDownIcon,
} from "lucide-react";
import { PROBLEMS } from "../data/problems";

/* ────────────────────────────────────────────────
   DESIGN SYSTEM (LIGHT THEME TOKENS)
──────────────────────────────────────────────── */
const styles = `
:root {
  --bg: #F8FAFC;
  --surface: #FFFFFF;
  --surface-soft: #F1F5F9;

  --text: #0F172A;
  --text-sub: #475569;
  --text-dim: #94A3B8;

  --border: #E2E8F0;

  --primary: #2563EB;
  --primary-hover: #1D4ED8;

  --success: #16A34A;
  --warning: #D97706;
  --danger: #DC2626;
}

/* ───────────────── MODAL LAYER ───────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.55);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-panel {
  width: 100%;
  max-width: 520px;
  background: var(--surface);
  border-radius: 18px;
  border: 1px solid var(--border);
  box-shadow: 0 30px 90px rgba(0,0,0,0.25);
  animation: modalFade 0.25s ease;
}

@keyframes modalFade {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ───────────────── HEADER ───────────────── */
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

/* ───────────────── BODY ───────────────── */
.modal-body {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ───────────────── INPUT ───────────────── */
.label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-sub);
}

.select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  transition: all 0.2s ease;
}

.select:hover {
  border-color: #CBD5F5;
}

.select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
}

/* ───────────────── SUMMARY ───────────────── */
.summary-box {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(22,163,74,0.08);
  border: 1px solid rgba(22,163,74,0.2);
}

/* ───────────────── FOOTER ───────────────── */
.modal-footer {
  padding: 18px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ───────────────── BUTTONS ───────────────── */
.btn {
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border: none;
  box-shadow: 0 6px 20px rgba(37,99,235,0.35);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(37,99,235,0.45);
}

.btn-ghost {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-sub);
}

.btn-ghost:hover {
  background: var(--surface-soft);
  color: var(--text);
}
`;

/* ────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────── */
const DIFFICULTY_META = {
  Easy:   { color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
  Medium: { color: "#D97706", bg: "rgba(217,119,6,0.1)" },
  Hard:   { color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
};

function DifficultyBadge({ difficulty }) {
  if (!difficulty) return null;
  const meta = DIFFICULTY_META[difficulty];

  return (
    <span
      style={{
        marginLeft: 6,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: meta.bg,
        color: meta.color,
      }}
    >
      {difficulty}
    </span>
  );
}

function RoomSummary({ problem, difficulty }) {
  if (!problem) return null;

  return (
    <div className="summary-box">
      <Code2Icon size={16} color="#16A34A" />
      <div>
        <div style={{ fontWeight: 600, color: "var(--text)" }}>
          Room Summary
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sub)" }}>
          Problem: <b>{problem}</b>
          <DifficultyBadge difficulty={difficulty} />
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sub)" }}>
          Participants: <b>2 (1-on-1 session)</b>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────── */
export default function CreateSessionModal({
  isOpen,
  onClose,
  roomConfig,
  setRoomConfig,
  onCreateRoom,
  isCreating,
}) {
  const problems = Object.values(PROBLEMS);
  const selectRef = useRef(null);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => selectRef.current?.focus());
  }, [isOpen]);

  const handleProblemChange = useCallback(
    (e) => {
      const selected = problems.find((p) => p.title === e.target.value);
      if (!selected) return;

      setRoomConfig({
        problem: selected.title,
        difficulty: selected.difficulty,
      });
    },
    [problems, setRoomConfig]
  );

  if (!isOpen) return null;

  const canSubmit = roomConfig.problem && !isCreating;

  return (
    <>
      <style>{styles}</style>

      <div
        className="modal-backdrop"
        onClick={!isCreating ? onClose : undefined}
      >
        <div
          className="modal-panel"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="modal-header">
            <h2 className="modal-title">Create New Session</h2>
            <button onClick={onClose}>
              <XIcon size={18} />
            </button>
          </div>

          {/* BODY */}
          <div className="modal-body">
            <div>
              <label className="label">
                Select Problem *
              </label>

              <div style={{ position: "relative", marginTop: 6 }}>
                <select
                  ref={selectRef}
                  className="select"
                  value={roomConfig.problem || ""}
                  onChange={handleProblemChange}
                >
                  <option value="">Choose a coding problem…</option>
                  {problems.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title} — {p.difficulty}
                    </option>
                  ))}
                </select>

                <ChevronDownIcon
                  size={16}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    opacity: 0.5,
                  }}
                />
              </div>
            </div>

            <RoomSummary
              problem={roomConfig.problem}
              difficulty={roomConfig.difficulty}
            />
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>

            <button
              className="btn btn-primary"
              disabled={!canSubmit}
              onClick={onCreateRoom}
            >
              {isCreating ? (
                <>
                  <LoaderIcon size={14} className="animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <PlusIcon size={14} /> Create
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}