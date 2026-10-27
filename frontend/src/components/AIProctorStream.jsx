import { useCallback, useEffect, useRef, useState } from "react";
import { FaceMesh, FACEMESH_FACE_OVAL, FACEMESH_LEFT_EYE, FACEMESH_RIGHT_EYE, FACEMESH_LEFT_EYEBROW, FACEMESH_RIGHT_EYEBROW } from "@mediapipe/face_mesh";
import { drawConnectors } from "@mediapipe/drawing_utils";

const MAX_FACES = 3;
const EAR_THRESHOLD = 0.20;
const ALERT_COOLDOWN_MS = 4000;
const LOG_COOLDOWN_MS = 2500;

const L_EYE_IDX = [362, 385, 387, 263, 373, 380];
const R_EYE_IDX = [33, 160, 158, 133, 153, 144];

function ear(landmarks, indices) {
  const point = (index) => landmarks[index];
  const distance = (a, b) =>
    Math.hypot(point(a).x - point(b).x, point(a).y - point(b).y);

  const horizontal = distance(indices[0], indices[3]);
  if (!Number.isFinite(horizontal) || horizontal < 1e-6) return 0;

  return (
    distance(indices[1], indices[5]) +
    distance(indices[2], indices[4])
  ) / (2 * horizontal);
}

function headTilt(landmarks) {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  return Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
}

function gazeScore(landmarks) {
  const noseTip = landmarks[1];
  const faceCenterX = (landmarks[234].x + landmarks[454].x) / 2;
  return Math.abs(noseTip.x - faceCenterX);
}

function now() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

function useAlertQueue() {
  const [alerts, setAlerts] = useState([]);
  const cooldowns = useRef(new Map());
  const timers = useRef(new Set());

  const push = useCallback((key, msg) => {
    const currentTime = Date.now();
    const lastTime = cooldowns.current.get(key) ?? 0;
    if (currentTime - lastTime < ALERT_COOLDOWN_MS) return;

    cooldowns.current.set(key, currentTime);
    const id = `${currentTime}-${Math.random().toString(36).slice(2)}`;
    setAlerts((previous) => [...previous.slice(-4), { id, msg }]);

    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setAlerts((previous) => previous.filter((alert) => alert.id !== id));
    }, 3500);

    timers.current.add(timer);
  }, []);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  return { alerts, push };
}

function useSessionLog() {
  const [log, setLog] = useState([]);
  const lastLogged = useRef(new Map());

  const add = useCallback((msg, key = msg) => {
    const currentTime = Date.now();
    const previousTime = lastLogged.current.get(key) ?? 0;
    if (currentTime - previousTime < LOG_COOLDOWN_MS) return;

    lastLogged.current.set(key, currentTime);
    setLog((previous) => [{ t: now(), msg }, ...previous].slice(0, 80));
  }, []);

  return { log, add };
}

function drawFace(ctx, landmarks, faceIndex, totalFaces, width, height) {
  const x = (landmark) => landmark.x * width;
  const y = (landmark) => landmark.y * height;

  const leftEAR = ear(landmarks, L_EYE_IDX);
  const rightEAR = ear(landmarks, R_EYE_IDX);
  const leftOpen = leftEAR > EAR_THRESHOLD;
  const rightOpen = rightEAR > EAR_THRESHOLD;
  const gaze = gazeScore(landmarks);
  const tilt = headTilt(landmarks);
  const gazeAway = gaze > 0.09;
  const tilted = Math.abs(tilt) > 18;
  const alert = totalFaces > 1 || gazeAway || tilted || (!leftOpen && !rightOpen);

  const primaryColor = alert ? "#EF4444" : "#06B6D4";
  const eyeColor = (open) => open ? "#06B6D4" : "#EF4444";

  const faceLeft = landmarks[234];
  const faceRight = landmarks[454];
  const faceTop = landmarks[10];
  const faceBottom = landmarks[152];

  const bx1 = x(faceLeft) - 12;
  const by1 = y(faceTop) - 16;
  const bx2 = x(faceRight) + 12;
  const by2 = y(faceBottom) + 12;
  const boxWidth = Math.max(0, bx2 - bx1);
  const boxHeight = Math.max(0, by2 - by1);
  const cornerSize = Math.min(boxWidth, boxHeight) * 0.2;

  ctx.save();
  ctx.strokeStyle = primaryColor;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "square";

  [[bx1, by1, 1, 1], [bx2, by1, -1, 1], [bx1, by2, 1, -1], [bx2, by2, -1, -1]]
    .forEach(([ox, oy, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(ox + sx * cornerSize, oy);
      ctx.lineTo(ox, oy);
      ctx.lineTo(ox, oy + sy * cornerSize);
      ctx.stroke();
    });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = primaryColor;
  ctx.globalAlpha = 0.92;
  ctx.font = "bold 9px 'IBM Plex Mono', monospace";
  ctx.fillText(`FACE ${faceIndex + 1}`, bx1 + 2, by1 - 4);
  ctx.restore();

  const scanY = by1 + ((Date.now() % 2000) / 2000) * boxHeight;
  const scanGradient = ctx.createLinearGradient(bx1, scanY - 12, bx1, scanY + 12);
  scanGradient.addColorStop(0, "rgba(6,182,212,0)");
  scanGradient.addColorStop(0.5, `rgba(6,182,212,${gazeAway ? 0 : 0.14})`);
  scanGradient.addColorStop(1, "rgba(6,182,212,0)");
  ctx.save();
  ctx.fillStyle = scanGradient;
  ctx.fillRect(bx1, scanY - 12, boxWidth, 24);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.18;
  drawConnectors(ctx, landmarks, FACEMESH_FACE_OVAL, { color: primaryColor, lineWidth: 0.7 });
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.3;
  drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYEBROW, { color: primaryColor, lineWidth: 0.6 });
  drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: primaryColor, lineWidth: 0.6 });
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.82;
  drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYE, { color: eyeColor(leftOpen), lineWidth: 1.4 });
  drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYE, { color: eyeColor(rightOpen), lineWidth: 1.4 });
  ctx.restore();

  const drawIris = (landmark, open) => {
    const eyeX = x(landmark);
    const eyeY = y(landmark);
    const color = eyeColor(open);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = open ? 0.95 : 0.55;
    [4, 8].forEach((radius) => {
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(eyeX - 12, eyeY); ctx.lineTo(eyeX - 5, eyeY);
    ctx.moveTo(eyeX + 5, eyeY); ctx.lineTo(eyeX + 12, eyeY);
    ctx.moveTo(eyeX, eyeY - 12); ctx.lineTo(eyeX, eyeY - 5);
    ctx.moveTo(eyeX, eyeY + 5); ctx.lineTo(eyeX, eyeY + 12);
    ctx.stroke();
    ctx.restore();
  };

  // Refined landmarks include iris indices 468 and 473; fallback to eye corners.
  drawIris(landmarks[468] ?? landmarks[33], leftOpen);
  drawIris(landmarks[473] ?? landmarks[263], rightOpen);

  const drawEyeLabel = (landmark, open, label) => {
    const eyeX = x(landmark);
    const eyeY = y(landmark);
    ctx.save();
    ctx.font = "bold 8px 'IBM Plex Mono', monospace";
    ctx.fillStyle = eyeColor(open);
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = eyeColor(open);
    ctx.shadowBlur = 6;
    ctx.fillText(open ? `${label} OPEN` : `${label} CLOSED`, eyeX - 16, eyeY + 20);
    ctx.restore();
  };

  drawEyeLabel(landmarks[468] ?? landmarks[33], leftOpen, "L");
  drawEyeLabel(landmarks[473] ?? landmarks[263], rightOpen, "R");

  const nose = landmarks[1];
  ctx.save();
  ctx.fillStyle = primaryColor;
  ctx.globalAlpha = 0.6;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x(nose), y(nose), 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (Math.abs(tilt) > 5) {
    const midpoint = {
      x: (x(landmarks[33]) + x(landmarks[263])) / 2,
      y: (y(landmarks[33]) + y(landmarks[263])) / 2,
    };
    const length = 28;
    const radians = tilt * Math.PI / 180;
    const color = tilted ? "#F59E0B" : "#22D3EE";

    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(midpoint.x - Math.cos(radians) * length, midpoint.y - Math.sin(radians) * length);
    ctx.lineTo(midpoint.x + Math.cos(radians) * length, midpoint.y + Math.sin(radians) * length);
    ctx.stroke();
    ctx.restore();
  }

  const statusText = totalFaces > 1
    ? `MULTIPLE FACES (${totalFaces})`
    : gazeAway ? "GAZE DEVIATION"
    : tilted ? `HEAD TILT ${tilt.toFixed(0)}°`
    : "FACE TRACKED";

  ctx.save();
  ctx.font = "bold 8.5px 'IBM Plex Mono', monospace";
  ctx.fillStyle = primaryColor;
  ctx.globalAlpha = 0.9;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 8;
  ctx.fillText(statusText, bx1, by2 + 14);
  ctx.restore();

  return { leftOpen, rightOpen, gazeAway, tilted, tilt, gaze };
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
      <span style={{ fontSize: 7.5, color: "#334155", letterSpacing: "0.12em" }}>{label}</span>
      <span style={{ fontSize: 8, fontWeight: 700, color, letterSpacing: "0.06em" }}>{value}</span>
    </div>
  );
}

function HUDPanel({ faceData, faceCount, sessionLog, showLog, onToggleLog }) {
  const [pos, setPos] = useState(() => ({
    x: typeof window === "undefined" ? 8 : Math.max(8, window.innerWidth - 172),
    y: 8,
  }));
  const dragRef = useRef({ dragging: false, ox: 0, oy: 0 });

  useEffect(() => {
    const onMove = (event) => {
      if (!dragRef.current.dragging) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 170, event.clientX - dragRef.current.ox)),
        y: Math.max(0, Math.min(window.innerHeight - 80, event.clientY - dragRef.current.oy)),
      });
    };
    const onUp = () => { dragRef.current.dragging = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onDown = (event) => {
    if (event.target.closest("button, a")) return;
    dragRef.current = { dragging: true, ox: event.clientX - pos.x, oy: event.clientY - pos.y };
  };

  const face = faceData[0];
  let attention = 100;
  if (faceCount === 0) attention = 0;
  else if (faceCount > 1) attention = 40;
  else {
    if (face?.gazeAway) attention -= 35;
    if (face?.tilted) attention -= 20;
    if (!face?.leftOpen) attention -= 15;
    if (!face?.rightOpen) attention -= 15;
  }
  attention = Math.max(0, attention);

  const statusColor = attention === 0 ? "#EF4444" : attention < 50 ? "#F59E0B" : "#06B6D4";
  const statusText = faceCount === 0 ? "NO FACE DETECTED"
    : faceCount > 1 ? `${faceCount} FACES — ALERT`
    : face?.gazeAway ? "GAZE AWAY"
    : face?.tilted ? "HEAD TILTED"
    : "TRACKING";

  return (
    <div
      onMouseDown={onDown}
      style={{
        position: "fixed", top: pos.y, left: pos.x, zIndex: 9999, width: 158,
        boxSizing: "border-box", fontFamily: "'IBM Plex Mono', monospace",
        background: "rgba(255,255,255,0.06)", backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 12,
        boxShadow: "0 8px 32px rgba(31,38,135,0.16)", cursor: "grab", userSelect: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.16em" }}>AI PROCTOR</span>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, boxShadow: `0 0 7px ${statusColor}`, animation: "hudPulse 1.8s ease-in-out infinite" }} />
      </div>

      <div style={{ fontSize: 9.5, fontWeight: 700, color: statusColor, letterSpacing: "0.05em", marginBottom: 8, lineHeight: 1.3 }}>
        {statusText}
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 8 }} />
      <Row label="FACES" value={faceCount} color={faceCount > 1 ? "#EF4444" : faceCount === 0 ? "#475569" : "#06B6D4"} />

      {faceCount > 0 && (
        <>
          <Row label="L.EYE" value={face?.leftOpen ? "OPEN" : "CLOSED"} color={face?.leftOpen ? "#06B6D4" : "#EF4444"} />
          <Row label="R.EYE" value={face?.rightOpen ? "OPEN" : "CLOSED"} color={face?.rightOpen ? "#06B6D4" : "#EF4444"} />
          <Row label="GAZE" value={face?.gazeAway ? "OFF-AXIS" : "CENTRED"} color={face?.gazeAway ? "#F59E0B" : "#06B6D4"} />
          <Row label="TILT" value={`${(face?.tilt ?? 0).toFixed(1)}°`} color={face?.tilted ? "#F59E0B" : "#475569"} />
        </>
      )}

      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 7.5, color: "#475569", letterSpacing: "0.12em" }}>ATTENTION</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: statusColor }}>{attention}%</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${attention}%`, background: `linear-gradient(90deg, ${statusColor}, ${statusColor}99)`, borderRadius: 2, transition: "width 0.4s ease, background 0.3s" }} />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleLog}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width: "100%", padding: "5px 0",
          background: showLog ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${showLog ? "#06B6D422" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 5, fontSize: 8, fontWeight: 700,
          color: showLog ? "#06B6D4" : "#475569", cursor: "pointer",
          letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {showLog ? "▲ HIDE LOG" : "▼ SESSION LOG"}
      </button>

      {showLog && (
        <div onMouseDown={(event) => event.stopPropagation()} style={{ marginTop: 8, maxHeight: 120, overflowY: "auto", fontSize: 7.5, color: "#334155", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 6 }}>
          {sessionLog.length === 0
            ? <span style={{ color: "#1e293b" }}>No events yet.</span>
            : sessionLog.map((entry, index) => (
              <div key={`${entry.t}-${index}`} style={{ marginBottom: 2 }}>
                <span style={{ color: "#1e3a5f" }}>{entry.t} </span>
                <span style={{ color: /ALERT|CLOSED|NO FACE|MULTIPLE/.test(entry.msg) ? "#7f1d1d" : "#1e3a5f" }}>{entry.msg}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function AlertToasts({ alerts }) {
  if (alerts.length === 0) return null;

  return (
    <div style={{ position: "fixed", top: 64, right: 16, zIndex: 9998, display: "flex", flexDirection: "column", gap: 7, pointerEvents: "none" }}>
      {alerts.map(({ id, msg }) => (
        <div key={id} style={{
          background: msg.includes("MULTIPLE") ? "rgba(234,179,8,0.96)" : "rgba(239,68,68,0.96)",
          backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 7, padding: "9px 14px", display: "flex", alignItems: "center",
          gap: 9, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          animation: "alertSlide 0.22s cubic-bezier(.22,.68,0,1.2) both", minWidth: 210,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px #fff", flexShrink: 0 }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>{msg}</span>
        </div>
      ))}
    </div>
  );
}

export default function AIProctorStream() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const videoRef = useRef(null);

  const [faceData, setFaceData] = useState([]);
  const [faceCount, setFaceCount] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const { alerts, push: pushAlert } = useAlertQueue();
  const { log: sessionLog, add: addLog } = useSessionLog();

  const positionCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prefer the tracked video, but support a video element mounted after this component.
    const video = videoRef.current?.isConnected
      ? videoRef.current
      : document.querySelector("video");

    if (!video) return;
    videoRef.current = video;

    const rect = video.getBoundingClientRect();
    canvas.style.position = "fixed";
    canvas.style.left = `${rect.left}px`;
    canvas.style.top = `${rect.top}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Setting canvas dimensions clears the context, so only do it when dimensions change.
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
  }, []);

  useEffect(() => {
    let active = true;
    let sending = false;
    let sendFailed = false;
    let faceMesh;
    let pendingSend = null;

    try {
      faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
    } catch (error) {
      console.error("Could not initialize MediaPipe Face Mesh:", error);
      return undefined;
    }

    faceMesh.setOptions({
      maxNumFaces: MAX_FACES,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    faceMesh.onResults((results) => {
      if (!active) return;

      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;

      positionCanvas();
      context.clearRect(0, 0, canvas.width, canvas.height);

      const faces = results.multiFaceLandmarks ?? [];
      const count = faces.length;
      setFaceCount(count);

      if (count === 0) {
        setFaceData([]);
        pushAlert("noface", "⚠ NO FACE DETECTED");
        addLog("ALERT — NO FACE DETECTED", "no-face");
        return;
      }

      if (count > 1) {
        pushAlert("multiface", `⚠ MULTIPLE FACES DETECTED (${count})`);
        addLog(`ALERT — MULTIPLE FACES (${count})`, "multiple-faces");
      }

      const frameData = faces.map((landmarks, index) => {
        const data = drawFace(context, landmarks, index, count, canvas.width, canvas.height);

        if (!data.leftOpen || !data.rightOpen) {
          const eyeMessage = !data.leftOpen && !data.rightOpen
            ? "BOTH EYES CLOSED"
            : `${!data.leftOpen ? "LEFT" : "RIGHT"} EYE CLOSED`;
          pushAlert(`eye${index}`, `👁 ${eyeMessage}`);
          addLog(`ALERT — FACE ${index + 1}: ${eyeMessage}`, `eye-${index}-${eyeMessage}`);
        }

        if (data.gazeAway) {
          pushAlert(`gaze${index}`, "⚠ GAZE DEVIATION DETECTED");
          addLog(`ALERT — FACE ${index + 1}: GAZE DEVIATION`, `gaze-${index}`);
        }

        if (data.tilted) {
          pushAlert(`tilt${index}`, `⚠ HEAD TILT ${data.tilt.toFixed(0)}°`);
          addLog(`ALERT — FACE ${index + 1}: HEAD TILT ${data.tilt.toFixed(0)}°`, `tilt-${index}`);
        }

        return data;
      });

      setFaceData(frameData);
    });

    const detect = async () => {
      if (!active || sendFailed) return;

      // The loop schedules its next frame only after send() completes.
      if (sending) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const video = videoRef.current?.isConnected
          ? videoRef.current
          : document.querySelector("video");

        if (video) videoRef.current = video;

        if (
          video &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          sending = true;
          pendingSend = faceMesh.send({ image: video });
          await pendingSend;
          pendingSend = null;
          sending = false;
        }
      } catch (error) {
        pendingSend = null;
        sending = false;
        sendFailed = true;

        if (active) {
          console.error("MediaPipe Face Mesh processing failed; detection stopped:", error);
          addLog("ERROR — FACE DETECTION STOPPED", "detection-error");
        }
        return;
      }

      if (active) {
        rafRef.current = requestAnimationFrame(detect);
      }
    };

    // Start after the current render so refs and the video element can be available.
    rafRef.current = requestAnimationFrame(detect);
    window.addEventListener("resize", positionCanvas);
    window.addEventListener("scroll", positionCanvas, true);

    return () => {
      active = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      window.removeEventListener("resize", positionCanvas);
      window.removeEventListener("scroll", positionCanvas, true);

      // Do not close the WASM-backed instance while send() is still in flight.
      void (async () => {
        try {
          if (pendingSend) await pendingSend;
        } catch {
          // A pending inference may reject while the component is unmounting.
        }

        try {
          await faceMesh.close();
        } catch (error) {
          console.error("MediaPipe Face Mesh cleanup failed:", error);
        }
      })();
    };
  }, [positionCanvas, pushAlert, addLog]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes alertSlide { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes hudPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          zIndex: 9990,
          pointerEvents: "none",
        }}
      />

      <HUDPanel
        faceData={faceData}
        faceCount={faceCount}
        sessionLog={sessionLog}
        showLog={showLog}
        onToggleLog={() => setShowLog((previous) => !previous)}
      />

      <AlertToasts alerts={alerts} />
    </>
  );
}
