import { Link } from "react-router";
import Navbar from "../../components/Navbar";
import { PROBLEMS } from "../../data/problems";
import { ChevronRightIcon, Code2Icon, ZapIcon, LayersIcon, FlameIcon } from "lucide-react";
import { getDifficultyBadgeClass } from "../../lib/utils";

/* ─── Jira-inspired palette + Apple glass tokens ─────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .problems-root {
    min-height: 100vh;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background:
      radial-gradient(ellipse 80% 60% at 20% -10%, rgba(79,130,230,0.13) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 85% 10%,  rgba(101,84,192,0.10) 0%, transparent 55%),
      radial-gradient(ellipse 70% 60% at 50% 110%, rgba(0,199,190,0.08) 0%, transparent 60%),
      #f0f4ff;
    --jira-blue:       #0052CC;
    --jira-blue-light: #4C9AFF;
    --jira-purple:     #6554C0;
    --jira-teal:       #00B8D9;
    --jira-green:      #00875A;
    --jira-yellow:     #FF8B00;
    --jira-red:        #DE350B;
    --jira-easy:       #00875A;
    --jira-medium:     #FF8B00;
    --jira-hard:       #DE350B;
    --glass-bg:        rgba(255,255,255,0.62);
    --glass-border:    rgba(255,255,255,0.85);
    --glass-shadow:    0 4px 24px rgba(0,82,204,0.08), 0 1.5px 6px rgba(0,0,0,0.05);
    --glass-hover-shadow: 0 8px 32px rgba(0,82,204,0.13), 0 2px 8px rgba(0,0,0,0.07);
    --text-primary:    #172B4D;
    --text-secondary:  #5E6C84;
    --text-muted:      #97A0AF;
  }

  /* ── glass card base ── */
  .glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(1.6);
    -webkit-backdrop-filter: blur(18px) saturate(1.6);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    box-shadow: var(--glass-shadow);
  }

  /* ── problem row ── */
  .problem-row {
    display: block;
    text-decoration: none;
    color: inherit;
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }
  .problem-row:hover {
    transform: translateY(-2px) scale(1.005);
    box-shadow: var(--glass-hover-shadow);
    background: rgba(255,255,255,0.80);
  }
  .problem-row:hover .solve-arrow {
    transform: translateX(3px);
  }

  /* ── icon bubble ── */
  .icon-bubble {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(79,130,230,0.15) 0%, rgba(101,84,192,0.12) 100%);
    border: 1px solid rgba(79,130,230,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* ── difficulty badges ── */
  .badge-easy {
    background: rgba(0,135,90,0.10);
    color: var(--jira-easy);
    border: 1px solid rgba(0,135,90,0.22);
  }
  .badge-medium {
    background: rgba(255,139,0,0.10);
    color: var(--jira-medium);
    border: 1px solid rgba(255,139,0,0.22);
  }
  .badge-hard {
    background: rgba(222,53,11,0.10);
    color: var(--jira-hard);
    border: 1px solid rgba(222,53,11,0.22);
  }
  .diff-badge {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    padding: 2px 9px;
    border-radius: 20px;
    text-transform: uppercase;
  }

  /* ── category pill ── */
  .category-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    color: var(--jira-blue);
    background: rgba(0,82,204,0.07);
    border: 1px solid rgba(0,82,204,0.14);
    border-radius: 20px;
    padding: 2px 8px;
  }

  /* ── solve button ── */
  .solve-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--jira-blue);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
    padding: 6px 14px;
    border-radius: 8px;
    background: rgba(0,82,204,0.07);
    border: 1px solid rgba(0,82,204,0.18);
    transition: background 0.15s, border-color 0.15s;
  }
  .problem-row:hover .solve-btn {
    background: rgba(0,82,204,0.12);
    border-color: rgba(0,82,204,0.30);
  }
  .solve-arrow {
    transition: transform 0.18s ease;
  }

  /* ── stat cards ── */
  .stat-card {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .stat-value {
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .stat-label {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }
  .stat-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }
  .stat-divider {
    width: 1px;
    background: rgba(0,82,204,0.10);
    align-self: stretch;
    margin: 0 4px;
  }

  /* ── header accent line ── */
  .header-accent {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--jira-blue), var(--jira-purple));
    margin-bottom: 12px;
  }

  /* ── scroll list animation ── */
  .problem-row {
    animation: fadeSlideUp 0.35s ease both;
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── watermark grid ── */
  .problems-root::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(79,130,230,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,130,230,0.035) 1px, transparent 1px);
    background-size: 40px 40px;
    z-index: 0;
  }
`;

function getDiffClass(difficulty) {
  if (difficulty === "Easy")   return "badge-easy";
  if (difficulty === "Medium") return "badge-medium";
  return "badge-hard";
}

function ProblemsPage() {
  const problems = Object.values(PROBLEMS);
  const easyCount   = problems.filter(p => p.difficulty === "Easy").length;
  const mediumCount = problems.filter(p => p.difficulty === "Medium").length;
  const hardCount   = problems.filter(p => p.difficulty === "Hard").length;

  return (
    <div className="problems-root" style={{ position: "relative", zIndex: 0 }}>
      <style>{styles}</style>
      <Navbar />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px 64px", position: "relative", zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 36 }}>
          <div className="header-accent" />
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: "var(--text-primary)",
            letterSpacing: "-0.02em", marginBottom: 6
          }}>
            Practice Problems
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 400 }}>
            Sharpen your coding skills with these curated problems
          </p>
        </div>

        {/* ── PROBLEM LIST ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {problems.map((problem, idx) => (
            <Link
              key={problem.id}
              to={`/problem/${problem.id}`}
              className="glass-card problem-row"
              style={{ animationDelay: `${idx * 0.045}s` }}
            >
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>

                {/* icon */}
                <div className="icon-bubble">
                  <Code2Icon size={20} color="var(--jira-blue)" strokeWidth={1.8} />
                </div>

                {/* main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 15, fontWeight: 600, color: "var(--text-primary)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                      {problem.title}
                    </span>
                    <span className={`diff-badge ${getDiffClass(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className="category-pill">
                      <LayersIcon size={10} />
                      {problem.category}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 13, color: "var(--text-secondary)", margin: 0,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>
                    {problem.description?.text}
                  </p>
                </div>

                {/* solve cta */}
                <div className="solve-btn">
                  <span>Solve</span>
                  <ChevronRightIcon size={14} className="solve-arrow" />
                </div>

              </div>
            </Link>
          ))}
        </div>

        {/* ── STATS FOOTER ── */}
        <div className="glass-card" style={{ marginTop: 40, padding: "28px 32px" }}>
          <p style={{
            fontSize: 11, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.09em", color: "var(--text-muted)", marginBottom: 20
          }}>
            Problem Bank Summary
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(0,82,204,0.09)" }}>
                <Code2Icon size={16} color="var(--jira-blue)" />
              </div>
              <div className="stat-value" style={{ color: "var(--jira-blue)" }}>{problems.length}</div>
              <div className="stat-label">Total</div>
            </div>

            <div className="stat-divider" />

            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(0,135,90,0.09)" }}>
                <ZapIcon size={16} color="var(--jira-green)" />
              </div>
              <div className="stat-value" style={{ color: "var(--jira-green)" }}>{easyCount}</div>
              <div className="stat-label">Easy</div>
            </div>

            <div className="stat-divider" />

            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(255,139,0,0.09)" }}>
                <LayersIcon size={16} color="var(--jira-yellow)" />
              </div>
              <div className="stat-value" style={{ color: "var(--jira-yellow)" }}>{mediumCount}</div>
              <div className="stat-label">Medium</div>
            </div>

            <div className="stat-divider" />

            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(222,53,11,0.09)" }}>
                <FlameIcon size={16} color="var(--jira-red)" />
              </div>
              <div className="stat-value" style={{ color: "var(--jira-red)" }}>{hardCount}</div>
              <div className="stat-label">Hard</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemsPage;