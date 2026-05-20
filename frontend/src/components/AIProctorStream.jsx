
import { useEffect, useRef, useState, useCallback } from "react";
import {
  FaceMesh,
  FACEMESH_LEFT_EYE,
  FACEMESH_RIGHT_EYE,
  FACEMESH_FACE_OVAL,
  FACEMESH_LEFT_EYEBROW,
  FACEMESH_RIGHT_EYEBROW,
} from "@mediapipe/face_mesh";
import { drawConnectors } from "@mediapipe/drawing_utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FACES      = 3;
const EAR_THRESHOLD  = 0.20;
const ALERT_COOLDOWN = 4000; // ms between same alert

// MediaPipe landmark indices
const L_EYE_IDX = [362, 385, 387, 263, 373, 380];
const R_EYE_IDX = [33,  160, 158, 133, 153, 144];

// ─── Utilities ────────────────────────────────────────────────────────────────
function ear(lm, idx) {
  const p  = (i) => lm[i];
  const d  = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  return (d(p(idx[1]), p(idx[5])) + d(p(idx[2]), p(idx[4])))
       / (2.0 * d(p(idx[0]), p(idx[3])));
}

function headTilt(lm) {
  // angle between left/right eye centres
  const le = lm[33], re = lm[263];
  return Math.atan2(re.y - le.y, re.x - le.x) * (180 / Math.PI);
}

function gazeScore(lm) {
  const noseTip = lm[1];
  const cx = (lm[234].x + lm[454].x) / 2;
  return Math.abs(noseTip.x - cx); // 0 = centre, >0.09 = away
}

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}

// ─── Alert Queue (with per-key cooldown) ─────────────────────────────────────
function useAlertQueue() {
  const [alerts, setAlerts]   = useState([]);   // [{id, msg, ts}]
  const cooldowns             = useRef({});      // key → timestamp

  const push = useCallback((key, msg) => {
    const last = cooldowns.current[key] || 0;
    if (Date.now() - last < ALERT_COOLDOWN) return;
    cooldowns.current[key] = Date.now();
    const id = Date.now() + Math.random();
    setAlerts(p => [...p.slice(-4), { id, msg }]);
    setTimeout(() => setAlerts(p => p.filter(a => a.id !== id)), 3500);
  }, []);

  return { alerts, push };
}

// ─── Session Log ──────────────────────────────────────────────────────────────
function useSessionLog() {
  const [log, setLog] = useState([]);
  const add = useCallback((msg) => {
    setLog(p => [{ t: now(), msg }, ...p].slice(0, 80));
  }, []);
  return { log, add };
}

// ─── Canvas Drawing ───────────────────────────────────────────────────────────
function drawFace(ctx, lm, faceIdx, totalFaces, W, H) {
  const lx = (l) => l.x * W;
  const ly = (l) => l.y * H;

  const leftEAR  = ear(lm, L_EYE_IDX);
  const rightEAR = ear(lm, R_EYE_IDX);
  const leftOpen  = leftEAR  > EAR_THRESHOLD;
  const rightOpen = rightEAR > EAR_THRESHOLD;
  const gaze      = gazeScore(lm);
  const tilt      = headTilt(lm);
  const gazeAway  = gaze > 0.09;
  const tilted    = Math.abs(tilt) > 18;
  const alert     = totalFaces > 1 || gazeAway || tilted || (!leftOpen && !rightOpen);

  const primaryColor = alert  ? "#EF4444"
                     : totalFaces > 1 ? "#F59E0B"
                     : "#06B6D4";
  const eyeCol = (o) => o ? "#06B6D4" : "#EF4444";

  // ── Face bounding box ──────────────────────────────────────────────────
  const fl = lm[234], fr = lm[454], ft = lm[10], fb = lm[152];
  const bx1 = lx(fl) - 12, by1 = ly(ft) - 16;
  const bx2 = lx(fr) + 12, by2 = ly(fb) + 12;
  const bw = bx2 - bx1, bh = by2 - by1;
  const cs = Math.min(bw, bh) * 0.20;

  // Corner brackets
  ctx.save();
  ctx.strokeStyle = primaryColor;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur  = 14;
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = "square";
  [[bx1,by1,+1,+1],[bx2,by1,-1,+1],[bx1,by2,+1,-1],[bx2,by2,-1,-1]].forEach(([ox,oy,sx,sy]) => {
    ctx.beginPath();
    ctx.moveTo(ox + sx * cs, oy); ctx.lineTo(ox, oy); ctx.lineTo(ox, oy + sy * cs);
    ctx.stroke();
  });
  ctx.restore();

  // Face index badge
  ctx.save();
  ctx.fillStyle   = primaryColor;
  ctx.globalAlpha = 0.92;
  ctx.font        = "bold 9px 'IBM Plex Mono', monospace";
  ctx.fillText(`FACE ${faceIdx + 1}`, bx1 + 2, by1 - 4);
  ctx.restore();

  // Scan line
  const scanY = by1 + ((Date.now() % 2000) / 2000) * bh;
  const sg = ctx.createLinearGradient(bx1, scanY - 12, bx1, scanY + 12);
  sg.addColorStop(0, "rgba(6,182,212,0)");
  sg.addColorStop(.5, `rgba(6,182,212,${gazeAway ? 0 : 0.14})`);
  sg.addColorStop(1, "rgba(6,182,212,0)");
  ctx.save(); ctx.fillStyle = sg; ctx.fillRect(bx1, scanY - 12, bw, 24); ctx.restore();

  // Face oval
  ctx.save(); ctx.globalAlpha = 0.18;
  drawConnectors(ctx, lm, FACEMESH_FACE_OVAL, { color: primaryColor, lineWidth: 0.7 });
  ctx.restore();

  // Eyebrows
  ctx.save(); ctx.globalAlpha = 0.30;
  drawConnectors(ctx, lm, FACEMESH_LEFT_EYEBROW,  { color: primaryColor, lineWidth: 0.6 });
  drawConnectors(ctx, lm, FACEMESH_RIGHT_EYEBROW, { color: primaryColor, lineWidth: 0.6 });
  ctx.restore();

  // Eye meshes
  ctx.save(); ctx.globalAlpha = 0.82;
  drawConnectors(ctx, lm, FACEMESH_LEFT_EYE,  { color: eyeCol(leftOpen),  lineWidth: 1.4 });
  drawConnectors(ctx, lm, FACEMESH_RIGHT_EYE, { color: eyeCol(rightOpen), lineWidth: 1.4 });
  ctx.restore();

  // Iris reticles
  const drawIris = (l, open) => {
    const ex = lx(l), ey = ly(l), rc = eyeCol(open);
    ctx.save();
    ctx.strokeStyle = rc; ctx.shadowColor = rc; ctx.shadowBlur = 10; ctx.lineWidth = 1.2;
    ctx.globalAlpha = open ? 0.95 : 0.55;
    // rings
    [4, 8].forEach(r => { ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke(); });
    // crosshair
    ctx.beginPath();
    ctx.moveTo(ex-12, ey); ctx.lineTo(ex-5, ey);
    ctx.moveTo(ex+5,  ey); ctx.lineTo(ex+12, ey);
    ctx.moveTo(ex, ey-12); ctx.lineTo(ex, ey-5);
    ctx.moveTo(ex, ey+5);  ctx.lineTo(ex, ey+12);
    ctx.stroke();
    ctx.restore();
  };
  drawIris(lm[468] ?? lm[33],  leftOpen);
  drawIris(lm[473] ?? lm[263], rightOpen);

  // Eye status labels below each eye
  const drawEyeLabel = (l, open, label) => {
    const ex = lx(l), ey = ly(l);
    ctx.save();
    ctx.font = "bold 8px 'IBM Plex Mono', monospace";
    ctx.fillStyle   = eyeCol(open);
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = eyeCol(open);
    ctx.shadowBlur  = 6;
    ctx.fillText(open ? `${label} OPEN` : `${label} CLOSED`, ex - 16, ey + 20);
    ctx.restore();
  };
  drawEyeLabel(lm[468] ?? lm[33],  leftOpen,  "L");
  drawEyeLabel(lm[473] ?? lm[263], rightOpen, "R");

  // Nose centre dot
  const nx = lx(lm[1]), ny = ly(lm[1]);
  ctx.save();
  ctx.fillStyle = primaryColor; ctx.globalAlpha = 0.6;
  ctx.shadowColor = primaryColor; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(nx, ny, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Head tilt indicator line
  if (Math.abs(tilt) > 5) {
    const mid = { x: (lx(lm[33]) + lx(lm[263])) / 2, y: (ly(lm[33]) + ly(lm[263])) / 2 };
    const len = 28;
    const rad = tilt * Math.PI / 180;
    ctx.save();
    ctx.strokeStyle = tilted ? "#F59E0B" : "#22D3EE";
    ctx.globalAlpha = 0.55;
    ctx.lineWidth   = 1.2;
    ctx.shadowColor = tilted ? "#F59E0B" : "#22D3EE";
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.moveTo(mid.x - Math.cos(rad) * len, mid.y - Math.sin(rad) * len);
    ctx.lineTo(mid.x + Math.cos(rad) * len, mid.y + Math.sin(rad) * len);
    ctx.stroke();
    ctx.restore();
  }

  // Bottom status tag
  const tagText = totalFaces > 1 ? `MULTIPLE FACES (${totalFaces})`
                : gazeAway ? "GAZE DEVIATION"
                : tilted   ? `HEAD TILT ${tilt.toFixed(0)}°`
                : "FACE TRACKED";
  ctx.save();
  ctx.font = "bold 8.5px 'IBM Plex Mono', monospace";
  ctx.fillStyle   = primaryColor;
  ctx.globalAlpha = 0.9;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur  = 8;
  ctx.fillText(tagText, bx1, by2 + 14);
  ctx.restore();

  return { leftOpen, rightOpen, gazeAway, tilted, tilt, gaze };
}

// ─── HUD Panel (draggable, fixed position) ────────────────────────────────────
function HUDPanel({ faceData, faceCount, sessionLog, showLog, onToggleLog }) {
  const [pos, setPos] = useState({ x: window.innerWidth - 172, y: 8 });
  const dragRef  = useRef({ dragging: false, ox: 0, oy: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      setPos({ x: e.clientX - dragRef.current.ox, y: e.clientY - dragRef.current.oy });
    };
    const onUp = () => { dragRef.current.dragging = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  const onDown = (e) => {
    dragRef.current = { dragging: true, ox: e.clientX - pos.x, oy: e.clientY - pos.y };
  };

  // Derive attention score from real data
  const f = faceData[0];
  let attention = 100;
  if (faceCount === 0)       attention = 0;
  else if (faceCount > 1)    attention = Math.max(10, attention - 60);
  else {
    if (f?.gazeAway)   attention -= 35;
    if (f?.tilted)     attention -= 20;
    if (!f?.leftOpen)  attention -= 15;
    if (!f?.rightOpen) attention -= 15;
  }
  attention = Math.max(0, attention);

  const statusColor = attention === 0 ? "#EF4444"
    : attention < 50 ? "#F59E0B"
    : "#06B6D4";

  const statusText = faceCount === 0 ? "NO FACE DETECTED"
    : faceCount > 1  ? `${faceCount} FACES — ALERT`
    : f?.gazeAway    ? "GAZE AWAY"
    : f?.tilted      ? "HEAD TILTED"
    : "TRACKING";

  return (
    <div
      onMouseDown={onDown}
      style={{
        position: "fixed",
        top:  pos.y,
        left: pos.x,
        zIndex: 9999,
        width: 158,
        fontFamily: "'IBM Plex Mono', monospace",
       background: "rgba(255,255,255,0.06)",
       backdropFilter: "blur(28px) saturate(180%)",
WebkitBackdropFilter:"blur(28px) saturate(180%)",
       border: `1px solid rgba(255,255,255,0.12)`,
       borderRadius: 16, 
        padding: "12px",
        boxShadow:
  "0 8px 32px rgba(31,38,135,0.16)",
        cursor: "grab",
        userSelect: "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.16em" }}>AI PROCTOR</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: statusColor,
            boxShadow: `0 0 7px ${statusColor}`,
            animation: "hudPulse 1.8s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* Status */}
      <div style={{
        fontSize: 9.5, fontWeight: 700, color: statusColor,
        letterSpacing: "0.05em", marginBottom: 8, lineHeight: 1.3,
      }}>
        {statusText}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 8 }} />

      {/* Face count */}
      <Row label="FACES" value={faceCount} color={faceCount > 1 ? "#EF4444" : faceCount === 0 ? "#475569" : "#06B6D4"} />

      {/* Eye states (first face) */}
      {faceCount > 0 && <>
        <Row label="L.EYE" value={f?.leftOpen  ? "OPEN" : "CLOSED"} color={f?.leftOpen  ? "#06B6D4" : "#EF4444"} />
        <Row label="R.EYE" value={f?.rightOpen ? "OPEN" : "CLOSED"} color={f?.rightOpen ? "#06B6D4" : "#EF4444"} />
        <Row label="GAZE"  value={f?.gazeAway  ? "OFF-AXIS" : "CENTRED"} color={f?.gazeAway ? "#F59E0B" : "#06B6D4"} />
        <Row label="TILT"  value={`${(f?.tilt ?? 0).toFixed(1)}°`} color={f?.tilted ? "#F59E0B" : "#475569"} />
      </>}

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />

      {/* Attention bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 7.5, color: "#475569", letterSpacing: "0.12em" }}>ATTENTION</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: statusColor }}>{attention}%</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${attention}%`,
            background: `linear-gradient(90deg, ${statusColor}, ${statusColor}99)`,
            borderRadius: 2, transition: "width 0.4s ease, background 0.3s",
          }} />
        </div>
      </div>

      {/* Log toggle */}
      <button
        onClick={onToggleLog}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "100%", padding: "5px 0",
          background: showLog ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${showLog ? "#06B6D422" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 5, fontSize: 8, fontWeight: 700,
          color: showLog ? "#06B6D4" : "#475569", cursor: "pointer",
          letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace",
          transition: "all 0.2s",
        }}
      >
        {showLog ? "▲ HIDE LOG" : "▼ SESSION LOG"}
      </button>

      {/* Session log */}
      {showLog && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 8, maxHeight: 120, overflowY: "auto",
            fontSize: 7.5, color: "#334155", lineHeight: 1.6,
            borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 6,
          }}
        >
          {sessionLog.length === 0
            ? <span style={{ color: "#1e293b" }}>No events yet.</span>
            : sessionLog.map((e, i) => (
                <div key={i} style={{ marginBottom: 2 }}>
                  <span style={{ color: "#1e3a5f" }}>{e.t} </span>
                  <span style={{ color: e.msg.includes("ALERT") || e.msg.includes("CLOSED") || e.msg.includes("NO FACE") || e.msg.includes("MULTIPLE") ? "#7f1d1d" : "#1e3a5f" }}>
                    {e.msg}
                  </span>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
      <span style={{ fontSize: 7.5, color: "#334155", letterSpacing: "0.12em" }}>{label}</span>
      <span style={{ fontSize: 8, fontWeight: 700, color, letterSpacing: "0.06em" }}>{value}</span>
    </div>
  );
}

// ─── Alert Toasts ─────────────────────────────────────────────────────────────
function AlertToasts({ alerts }) {
  if (!alerts.length) return null;
  return (
    <div style={{
      position: "fixed", top: 64, right: 16, zIndex: 9998,
      display: "flex", flexDirection: "column", gap: 7, pointerEvents: "none",
    }}>
      {alerts.map(({ id, msg }) => (
        <div key={id} style={{
          background: msg.includes("MULTIPLE") ? "rgba(234,179,8,0.96)" : "rgba(239,68,68,0.96)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 7, padding: "9px 14px",
          display: "flex", alignItems: "center", gap: 9,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          animation: "alertSlide 0.22s cubic-bezier(.22,.68,0,1.2) both",
          minWidth: 210,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px #fff", flexShrink: 0 }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
            {msg}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIProctorStream() {
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const videoRef   = useRef(null); // tracks the live video element

  const [faceData,  setFaceData]  = useState([]);
  const [faceCount, setFaceCount] = useState(0);
  const [showLog,   setShowLog]   = useState(false);

  const { alerts, push: pushAlert }   = useAlertQueue();
  const { log: sessionLog, add: addLog } = useSessionLog();

  // ── Position canvas exactly over the video element every frame ─────────────
  const positionCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Find the first video element in the page
    const video = document.querySelector("video");
    if (!video) return;
    videoRef.current = video;

    const vr = video.getBoundingClientRect();
    // Use fixed positioning so we're always relative to viewport, not any parent
    canvas.style.position = "fixed";
    canvas.style.left     = `${vr.left}px`;
    canvas.style.top      = `${vr.top}px`;
    canvas.style.width    = `${vr.width}px`;
    canvas.style.height   = `${vr.height}px`;
    canvas.width          = vr.width;
    canvas.height         = vr.height;
  }, []);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    });

    faceMesh.setOptions({
      maxNumFaces: MAX_FACES,
      refineLandmarks: true,
      minDetectionConfidence: 0.70,
      minTrackingConfidence: 0.70,
    });

    faceMesh.onResults((results) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      positionCanvas();

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const faces = results.multiFaceLandmarks ?? [];
      const count = faces.length;
      setFaceCount(count);

      if (count === 0) {
        setFaceData([]);
        pushAlert("noface", "⚠ NO FACE DETECTED");
        addLog("ALERT — NO FACE DETECTED");
        return;
      }

      if (count > 1) {
        pushAlert("multiface", `⚠ MULTIPLE FACES DETECTED (${count})`);
        addLog(`ALERT — MULTIPLE FACES (${count})`);
      }

      const frameData = faces.map((lm, i) => {
        const fd = drawFace(ctx, lm, i, count, canvas.width, canvas.height);

        // Log significant events (throttled via pushAlert cooldown)
        if (!fd.leftOpen || !fd.rightOpen) {
          const eyeMsg = (!fd.leftOpen && !fd.rightOpen) ? "BOTH EYES CLOSED" : `${!fd.leftOpen ? "LEFT" : "RIGHT"} EYE CLOSED`;
          pushAlert(`eye${i}`, `👁 ${eyeMsg}`);
          addLog(`ALERT — FACE ${i+1}: ${eyeMsg}`);
        }
        if (fd.gazeAway) {
          pushAlert(`gaze${i}`, "⚠ GAZE DEVIATION DETECTED");
          addLog(`ALERT — FACE ${i+1}: GAZE DEVIATION`);
        }
        if (fd.tilted) {
          pushAlert(`tilt${i}`, `⚠ HEAD TILT ${fd.tilt.toFixed(0)}°`);
          addLog(`ALERT — FACE ${i+1}: HEAD TILT ${fd.tilt.toFixed(0)}°`);
        }
        return fd;
      });

      setFaceData(frameData);
    });

    const detect = async () => {
      const video = document.querySelector("video");
      if (video && video.readyState === 4) {
        await faceMesh.send({ image: video });
      }
      rafRef.current = requestAnimationFrame(detect);
    };

    detect();

    // Re-position on window resize/scroll
    window.addEventListener("resize", positionCanvas);
    window.addEventListener("scroll", positionCanvas, true);

    return () => {
      cancelAnimationFrame(rafRef.current);
      faceMesh.close?.();
      window.removeEventListener("resize", positionCanvas);
      window.removeEventListener("scroll", positionCanvas, true);
    };
  }, [positionCanvas, pushAlert, addLog]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes alertSlide { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:translateX(0)} }
        @keyframes hudPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      `}</style>

      {/* Fixed canvas exactly over the video */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          zIndex: 9990,
          pointerEvents: "none",
          transition: "left 0.05s, top 0.05s",
        }}
      />

      {/* Draggable HUD panel */}
      <HUDPanel
        faceData={faceData}
        faceCount={faceCount}
        sessionLog={sessionLog}
        showLog={showLog}
        onToggleLog={() => setShowLog(s => !s)}
      />

      {/* Alert toasts */}
      <AlertToasts alerts={alerts} />
    </>
  );
}