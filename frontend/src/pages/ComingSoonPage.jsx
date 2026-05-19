import { useState, useEffect, useRef } from "react";

const LAUNCH_DATE = new Date(Date.now() + 47 * 24 * 60 * 60 * 1000);

function useCountdown(target) {
  const [time, setTime] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = target - Date.now();
      if (diff <= 0) return setTime({ d: 0, h: 0, m: 0, s: 0 });
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

function Digit({ value, label }) {
  const [prev, setPrev] = useState(value);
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (value !== prev) {
      setFlip(true);
      const t = setTimeout(() => { setPrev(value); setFlip(false); }, 300);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <div style={styles.digitGroup}>
      <div style={{ ...styles.digitCard, ...(flip ? styles.digitFlip : {}) }}>
        <span style={styles.digitNum}>{String(value ?? 0).padStart(2, "0")}</span>
      </div>
      <span style={styles.digitLabel}>{label}</span>
    </div>
  );
}

function FloatingOrb({ size, x, y, delay, duration, color }) {
  return (
    <div style={{
      position: "absolute", width: size, height: size, borderRadius: "50%",
      background: color, left: x, top: y, opacity: 0.12,
      animation: `orbFloat ${duration}s ease-in-out ${delay}s infinite alternate`,
      filter: "blur(40px)", pointerEvents: "none",
    }} />
  );
}

function Particle({ x, y, size, delay }) {
  return (
    <div style={{
      position: "absolute", width: size, height: size, borderRadius: "50%",
      background: "#c8b99a", left: x, top: y, opacity: 0,
      animation: `particleDrift 6s ease-in-out ${delay}s infinite`,
      pointerEvents: "none",
    }} />
  );
}

export default function ComingSoon() {
  const { d, h, m, s } = useCountdown(LAUNCH_DATE);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const w = window.innerWidth, h = window.innerHeight;
      setMousePos({ x: e.clientX / w, y: e.clientY / h });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.includes("@")) return setStatus("error");
    setStatus("success");
    setEmail("");
    setTimeout(() => setStatus("idle"), 4000);
  };

  const parallaxX = (mousePos.x - 0.5) * 24;
  const parallaxY = (mousePos.y - 0.5) * 16;

  return (
    <div ref={containerRef} style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes orbFloat { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,-30px) scale(1.08); } }
        @keyframes particleDrift { 0%,100%{opacity:0;transform:translateY(0) scale(1)} 30%{opacity:0.6} 70%{opacity:0.3;transform:translateY(-60px) scale(0.7)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)} }
        @keyframes lineGrow { from{transform:scaleX(0)}to{transform:scaleX(1)} }
        @keyframes digitFlip { 0%{transform:rotateX(0)}50%{transform:rotateX(-90deg)}100%{transform:rotateX(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes tickPulse { 0%,100%{box-shadow:0 0 0 0 rgba(200,185,154,0)} 50%{box-shadow:0 0 0 6px rgba(200,185,154,0.18)} }
        .anim-1{animation:fadeUp 0.9s cubic-bezier(.22,.68,0,1.2) 0.1s both}
        .anim-2{animation:fadeUp 0.9s cubic-bezier(.22,.68,0,1.2) 0.25s both}
        .anim-3{animation:fadeUp 0.9s cubic-bezier(.22,.68,0,1.2) 0.4s both}
        .anim-4{animation:fadeUp 0.9s cubic-bezier(.22,.68,0,1.2) 0.55s both}
        .anim-5{animation:fadeUp 0.9s cubic-bezier(.22,.68,0,1.2) 0.7s both}
        .anim-line{animation:lineGrow 1.2s cubic-bezier(.22,.68,0,1.2) 0.2s both;transform-origin:left}
        input::placeholder{color:#b8a98e;font-family:'DM Sans',sans-serif}
        input:focus{outline:none;border-color:#9a8570!important;box-shadow:0 0 0 3px rgba(154,133,112,0.12)!important}
        .notify-btn:hover{background:#1a1410!important;transform:translateY(-1px)}
        .notify-btn:active{transform:translateY(0)}
        .social-link{opacity:0.45;transition:opacity 0.2s}.social-link:hover{opacity:1}
      `}</style>

      {/* Background grain texture */}
      <div style={styles.grain} />

      {/* Ambient orbs */}
      <FloatingOrb size="600px" x="-10%" y="-15%" delay={0} duration={8} color="linear-gradient(135deg,#e8ddd0,#d4c4b0)" />
      <FloatingOrb size="400px" x="70%" y="60%" delay={2} duration={10} color="linear-gradient(135deg,#c8b99a,#b8a485)" />
      <FloatingOrb size="300px" x="85%" y="-10%" delay={1} duration={7} color="linear-gradient(135deg,#ddd5c8,#c8bfb0)" />

      {/* Particles */}
      {[...Array(12)].map((_, i) => (
        <Particle key={i} x={`${8 + i * 8}%`} y={`${20 + (i % 3) * 25}%`} size={`${2 + (i % 3)}px`} delay={i * 0.5} />
      ))}

      {/* Parallax decorative grid lines */}
      <div style={{
        ...styles.gridOverlay,
        transform: `translate(${parallaxX * 0.3}px, ${parallaxY * 0.3}px)`,
      }} />

      {/* Main content */}
      <div style={styles.content}>

        {/* Top wordmark */}
        <div className="anim-1" style={styles.wordmark}>
          <div style={styles.wordmarkDot} />
          <span style={styles.wordmarkText}>InterVue</span>
          <div style={styles.wordmarkDot} />
        </div>

        {/* Hero text */}
        <div className="anim-2" style={styles.heroBlock}>
          <p style={styles.eyebrow}>Something extraordinary is</p>
          <h1 style={styles.headline}>
            Coming
            <em style={styles.headlineItalic}> Soon</em>
          </h1>
          <div className="anim-line" style={styles.headlineLine} />
        </div>

        {/* Subtext */}
        <p className="anim-3" style={styles.subtext}>
          We're crafting an experience that redefines the standard.<br />
          Refined, purposeful, and worth the wait.
        </p>

        {/* Countdown */}
        <div className="anim-4" style={styles.countdown}>
          <Digit value={d} label="Days" />
          <div style={styles.countdownSep}>:</div>
          <Digit value={h} label="Hours" />
          <div style={styles.countdownSep}>:</div>
          <Digit value={m} label="Minutes" />
          <div style={styles.countdownSep}>:</div>
          <Digit value={s} label="Seconds" />
        </div>

        {/* Email CTA */}
        <div className="anim-5" style={styles.ctaBlock}>
          {status === "success" ? (
            <div style={styles.successMsg}>
              <div style={styles.successIcon}>✓</div>
              <span>You're on the list. We'll be in touch.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputWrap}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    ...styles.input,
                    borderColor: status === "error" ? "#c0806a" : "#d4c4b0",
                  }}
                />
                <button className="notify-btn" type="submit" style={styles.btn}>
                  Notify Me
                </button>
              </div>
              {status === "error" && (
                <p style={styles.errorMsg}>Please enter a valid email address.</p>
              )}
              <p style={styles.privacyNote}>No spam. Unsubscribe anytime. We respect your privacy.</p>
            </form>
          )}
        </div>

        {/* Progress bar */}
        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>Development Progress</span>
            <span style={styles.progressPct}>78%</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={styles.progressFill} />
          </div>
          <div style={styles.progressMilestones}>
            {["Design", "Development", "Testing", "Launch"].map((m, i) => (
              <div key={m} style={styles.milestone}>
                <div style={{
                  ...styles.milestoneDot,
                  background: i < 3 ? "#8a7560" : "#d4c4b0",
                  animation: i === 2 ? "tickPulse 2s ease-in-out infinite" : "none",
                }} />
                <span style={{ ...styles.milestoneLabel, color: i < 3 ? "#5a4a38" : "#b8a98e" }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div style={styles.socials}>
          {["Twitter", "Instagram", "LinkedIn"].map(s => (
            <a key={s} href="#" className="social-link" style={styles.socialLink}>{s}</a>
          ))}
        </div>

        {/* Bottom legal */}
        <p style={styles.legal}>© 2025 InterVue. All rights reserved.</p>
      </div>

      {/* Decorative corner marks */}
      <div style={{ ...styles.cornerMark, top: 24, left: 24 }}>
        <div style={styles.cornerL} />
      </div>
      <div style={{ ...styles.cornerMark, top: 24, right: 24, transform: "rotate(90deg)" }}>
        <div style={styles.cornerL} />
      </div>
      <div style={{ ...styles.cornerMark, bottom: 24, left: 24, transform: "rotate(-90deg)" }}>
        <div style={styles.cornerL} />
      </div>
      <div style={{ ...styles.cornerMark, bottom: 24, right: 24, transform: "rotate(180deg)" }}>
        <div style={styles.cornerL} />
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #faf7f2 0%, #f2ece2 40%, #ede4d6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "48px 24px",
    boxSizing: "border-box",
  },
  grain: {
    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
    backgroundRepeat: "repeat", backgroundSize: "128px",
  },
  gridOverlay: {
    position: "absolute", inset: "-40px", pointerEvents: "none", zIndex: 1,
    backgroundImage: `
      linear-gradient(rgba(140,120,100,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(140,120,100,0.06) 1px, transparent 1px)
    `,
    backgroundSize: "64px 64px",
    transition: "transform 0.1s ease-out",
  },
  content: {
    position: "relative", zIndex: 2,
    display: "flex", flexDirection: "column", alignItems: "center",
    textAlign: "center", maxWidth: "680px", width: "100%",
    gap: 0,
  },
  wordmark: {
    display: "flex", alignItems: "center", gap: 10,
    marginBottom: 56, letterSpacing: "0.22em",
  },
  wordmarkDot: {
    width: 5, height: 5, borderRadius: "50%", background: "#9a8570",
  },
  wordmarkText: {
    fontSize: 11, fontWeight: 500, color: "#9a8570",
    fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.25em",
  },
  heroBlock: { marginBottom: 20 },
  eyebrow: {
    fontSize: 14, color: "#9a8570", fontWeight: 400, margin: "0 0 8px",
    letterSpacing: "0.05em",
  },
  headline: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "clamp(60px, 10vw, 96px)",
    fontWeight: 300, color: "#2a2018", margin: 0, lineHeight: 1.0,
    letterSpacing: "-0.02em",
  },
  headlineItalic: {
    fontStyle: "italic", fontWeight: 300, color: "#8a7560",
  },
  headlineLine: {
    height: 1, background: "linear-gradient(90deg, transparent, #c8b99a, transparent)",
    marginTop: 20, transformOrigin: "left",
  },
  subtext: {
    fontSize: 15, color: "#7a6a58", lineHeight: 1.75, fontWeight: 300,
    margin: "28px 0 44px", maxWidth: 460,
  },
  countdown: {
    display: "flex", alignItems: "flex-start", gap: 4,
    marginBottom: 48,
  },
  digitGroup: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  },
  digitCard: {
    background: "rgba(255,251,245,0.85)",
    border: "0.5px solid rgba(200,185,154,0.6)",
    borderRadius: 10,
    width: "clamp(64px, 12vw, 88px)",
    height: "clamp(72px, 13vw, 96px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 16px rgba(140,110,80,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
    transition: "transform 0.3s ease",
  },
  digitFlip: {
    animation: "digitFlip 0.3s ease",
  },
  digitNum: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: 300, color: "#2a2018", lineHeight: 1,
  },
  digitLabel: {
    fontSize: 10, color: "#b8a98e", letterSpacing: "0.15em",
    fontWeight: 500, textTransform: "uppercase",
  },
  countdownSep: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(28px, 4vw, 40px)",
    color: "#c8b99a", fontWeight: 300,
    marginTop: "clamp(16px, 2.5vw, 24px)",
    lineHeight: 1,
  },
  ctaBlock: { width: "100%", maxWidth: 480, marginBottom: 52 },
  form: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  inputWrap: {
    display: "flex", width: "100%",
    border: "0.5px solid #d4c4b0",
    borderRadius: 10,
    overflow: "hidden",
    background: "rgba(255,251,245,0.9)",
    boxShadow: "0 2px 12px rgba(140,110,80,0.08)",
    backdropFilter: "blur(8px)",
    transition: "box-shadow 0.2s",
  },
  input: {
    flex: 1, border: "none", background: "transparent",
    padding: "14px 18px", fontSize: 14, color: "#2a2018",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
  },
  btn: {
    background: "#2a2018", color: "#f2e8d8",
    border: "none", padding: "14px 24px",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em",
    whiteSpace: "nowrap",
    transition: "background 0.2s, transform 0.15s",
  },
  privacyNote: {
    fontSize: 11, color: "#b8a98e", margin: 0, letterSpacing: "0.02em",
  },
  errorMsg: {
    fontSize: 12, color: "#c0806a", margin: "0",
  },
  successMsg: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 12, padding: "16px 24px",
    background: "rgba(255,251,245,0.9)", borderRadius: 10,
    border: "0.5px solid #c8b99a",
    fontSize: 14, color: "#5a4a38", fontWeight: 400,
  },
  successIcon: {
    width: 24, height: 24, borderRadius: "50%",
    background: "#8a7560", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 500, flexShrink: 0,
  },
  progressSection: {
    width: "100%", maxWidth: 440, marginBottom: 44,
  },
  progressHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: { fontSize: 11, color: "#9a8570", letterSpacing: "0.12em", textTransform: "uppercase" },
  progressPct: { fontSize: 13, color: "#5a4a38", fontWeight: 500 },
  progressTrack: {
    height: 3, background: "rgba(200,185,154,0.25)", borderRadius: 2,
    overflow: "hidden", marginBottom: 16,
  },
  progressFill: {
    width: "78%", height: "100%",
    background: "linear-gradient(90deg, #8a7560, #c8b99a)",
    borderRadius: 2,
    animation: "lineGrow 1.8s cubic-bezier(.22,.68,0,1.2) 0.8s both",
    transformOrigin: "left",
  },
  progressMilestones: {
    display: "flex", justifyContent: "space-between",
  },
  milestone: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
  },
  milestoneDot: {
    width: 8, height: 8, borderRadius: "50%", transition: "background 0.3s",
  },
  milestoneLabel: {
    fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
  },
  socials: {
    display: "flex", gap: 28, marginBottom: 28,
  },
  socialLink: {
    fontSize: 11, color: "#7a6a58", textDecoration: "none",
    letterSpacing: "0.12em", textTransform: "uppercase",
    transition: "color 0.2s",
  },
  legal: {
    fontSize: 10, color: "#b8a98e", letterSpacing: "0.08em",
    margin: 0,
  },
  cornerMark: {
    position: "absolute", width: 24, height: 24, zIndex: 2,
  },
  cornerL: {
    width: "100%", height: "100%",
    borderTop: "0.5px solid rgba(154,133,112,0.5)",
    borderLeft: "0.5px solid rgba(154,133,112,0.5)",
    borderRadius: "2px 0 0 0",
  },
};