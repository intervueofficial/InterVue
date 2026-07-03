import { T } from "../../constants/sessionTheme";

/* ─── Global Styles ──────────────────────────────────────────────────────────── */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
      .sp-root { font-family: 'DM Sans', system-ui, sans-serif; }
      @keyframes sp-spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
      @keyframes sp-pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.78)} }
      @keyframes sp-shimmer { 0%{opacity:1}50%{opacity:0.45}100%{opacity:1} }
      @keyframes recPulse { 0%,100%{opacity:1}50%{opacity:0.6} }
      .sp-scroll::-webkit-scrollbar{width:5px}
      .sp-scroll::-webkit-scrollbar-track{background:${T.surface}}
      .sp-scroll::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px}
      .sp-scroll::-webkit-scrollbar-thumb:hover{background:${T.muted}}
      [data-panel-resize-handle-enabled]{outline:none}
    `}</style>
  );
}

export default GlobalStyles;
