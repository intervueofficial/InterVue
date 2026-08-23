import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ShieldCheck, ShieldAlert, Loader2, Camera, X, RotateCcw, Check, Lock, EyeOff, Ban } from "lucide-react";

import { identityApi } from "../api/auth";
import { THEME } from "../constants/theme";

/**
 * Duplicate-account prevention: a candidate can trivially sign up with
 * a new email address, but Aadhaar is unique per person — so we have
 * them scan their physical card via a LIVE camera capture (no gallery
 * upload, enforced below by never rendering a file input) and OCR it
 * server-side. Once verified, name/DOB are locked to what was read off
 * the card, and job applications are blocked until this is done (see
 * candidateProfile.isComplete on the backend).
 */
// Higher ideal resolution than the previous 1280x720 — more pixels per
// printed digit meaningfully helps Tesseract read the Aadhaar number
// reliably. "ideal" still lets the browser fall back on devices/cameras
// that can't hit this, so it's a safe increase.
const AADHAAR_CAMERA_CONSTRAINTS = {
  video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
};

// Four corner-bracket accents drawn over the card-guide box (the classic
// "align document here" framing UI). Each entry says which two sides get
// a border and which corner gets rounded, plus which edges to offset
// negatively so the bracket sits just outside the guide box's own border.
const CORNER_BRACKETS = [
  { key: "tl", vSide: "top", hSide: "left", borderCls: "border-t-[3px] border-l-[3px]", roundedCls: "rounded-tl-lg" },
  { key: "tr", vSide: "top", hSide: "right", borderCls: "border-t-[3px] border-r-[3px]", roundedCls: "rounded-tr-lg" },
  { key: "bl", vSide: "bottom", hSide: "left", borderCls: "border-b-[3px] border-l-[3px]", roundedCls: "rounded-bl-lg" },
  { key: "br", vSide: "bottom", hSide: "right", borderCls: "border-b-[3px] border-r-[3px]", roundedCls: "rounded-br-lg" },
];

function IdentityVerificationCard({ index = 0 }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [cameraOpen, setCameraOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [captured, setCaptured] = useState(null); // data URL of the captured frame
  const [scanStatus, setScanStatus] = useState("positioning"); // "positioning" | "aligned" | "captured"
  const [extracted, setExtracted] = useState(null); // { name, dob, aadhaarNumber, aadhaarNumberValid }
  const [reviewOpen, setReviewOpen] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanCanvasRef = useRef(null); // small offscreen canvas used for the fit/alignment check
  const scanIntervalRef = useRef(null);

  const { data } = useQuery({
    queryKey: ["identity-status"],
    queryFn: async () => identityApi.getStatus(await getToken()),
  });

  const verification = data?.verification;
  const isVerified = Boolean(verification?.verified);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // ─── Auto-capture: "does a card actually fill the guide box" check ───
  // True document-edge detection (finding the card's exact rectangle in
  // frame) needs a real CV model — not something to fake. What we CAN do
  // honestly and cheaply, scoped specifically to the guide-box region
  // (not the whole frame): on every sampled tick, measure (1) how much
  // detail/contrast is present in there — a blank table or empty hand
  // reads as low-variance, while a printed card's text/photo/microprint
  // reads as high-variance — and (2) how much it's changed since the
  // last tick, so a mid-motion blur doesn't get captured. Once both say
  // "yes, a card is filling this box and it's not moving," we fire —
  // no artificial countdown, just a couple of confirming ticks (a few
  // hundred ms) to rule out a one-frame fluke. Manual "Capture
  // Manually" stays available as a fallback for unusual lighting where
  // this heuristic doesn't settle.
  const SCAN_SAMPLE_W = 96;
  const SCAN_SAMPLE_H = 60;
  const SCAN_INTERVAL_MS = 150;
  const SCAN_MOTION_THRESHOLD = 10; // avg per-sample luminance delta considered "still"
  const SCAN_CONTENT_VARIANCE_THRESHOLD = 380; // min luminance variance = "something detailed is in the box"
  const SCAN_CONFIRM_TICKS = 3; // ~450ms of simultaneous fit + stillness before firing

  // Guide box in sample-pixel coordinates — must stay in sync with the
  // CSS guide box below (80% width, centered, 1.586 aspect ratio). If
  // you resize the visual guide, update these to match.
  const guideBoxRef = useRef(null);

  const getGuideBox = () => {
    if (guideBoxRef.current) return guideBoxRef.current;
    const w = Math.round(SCAN_SAMPLE_W * 0.8);
    const h = Math.round(w / 1.586);
    const x = Math.round((SCAN_SAMPLE_W - w) / 2);
    const y = Math.round((SCAN_SAMPLE_H - h) / 2);
    guideBoxRef.current = { x, y, w, h };
    return guideBoxRef.current;
  };

  const stopStabilityScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const startStabilityScan = () => {
    stopStabilityScan();
    setScanStatus("positioning");

    if (!scanCanvasRef.current) {
      scanCanvasRef.current = document.createElement("canvas");
      scanCanvasRef.current.width = SCAN_SAMPLE_W;
      scanCanvasRef.current.height = SCAN_SAMPLE_H;
    }
    const ctx = scanCanvasRef.current.getContext("2d", { willReadFrequently: true });
    const box = getGuideBox();

    let prevBoxFrame = null; // just the guide-box pixels from the previous tick
    let confirmTicks = 0;

    scanIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) return;

      ctx.drawImage(video, 0, 0, SCAN_SAMPLE_W, SCAN_SAMPLE_H);
      const full = ctx.getImageData(0, 0, SCAN_SAMPLE_W, SCAN_SAMPLE_H).data;

      // Walk only the pixels inside the guide box (every 2nd row/col is
      // plenty at this resolution) — this is what makes the check about
      // "does the card fill THIS box," not "is anything happening
      // anywhere in the camera feed."
      let sum = 0;
      let sumSq = 0;
      let diffSum = 0;
      let n = 0;
      const boxFrame = prevBoxFrame ? new Uint8ClampedArray(box.w * box.h) : null;

      for (let row = 0; row < box.h; row += 2) {
        for (let col = 0; col < box.w; col += 2) {
          const px = box.x + col;
          const py = box.y + row;
          const idx = (py * SCAN_SAMPLE_W + px) * 4;
          const lum = full[idx]; // red channel as a cheap luminance proxy

          sum += lum;
          sumSq += lum * lum;
          n += 1;

          const boxIdx = row * box.w + col;
          if (boxFrame) boxFrame[boxIdx] = lum;
          if (prevBoxFrame) diffSum += Math.abs(lum - prevBoxFrame[boxIdx]);
        }
      }

      const mean = sum / n;
      const variance = sumSq / n - mean * mean;
      const avgDiff = prevBoxFrame ? diffSum / n : Infinity;

      const hasCardDetail = variance > SCAN_CONTENT_VARIANCE_THRESHOLD;
      const isStill = avgDiff < SCAN_MOTION_THRESHOLD;
      const looksReady = hasCardDetail && isStill;

      setScanStatus(looksReady ? "aligned" : "positioning");
      confirmTicks = looksReady ? confirmTicks + 1 : 0;

      if (confirmTicks >= SCAN_CONFIRM_TICKS) {
        stopStabilityScan();
        setScanStatus("captured");
        capturePhoto();
        return;
      }

      prevBoxFrame = boxFrame;
    }, SCAN_INTERVAL_MS);
  };

  const openCamera = async () => {
    setCaptured(null);
    setExtracted(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(AADHAAR_CAMERA_CONSTRAINTS);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      startStabilityScan();
    } catch {
      toast.error("Couldn't access the camera. Please allow camera permission and try again.");
      setCameraOpen(false);
    }
  };

  const closeCamera = () => {
    stopStabilityScan();
    stopCamera();
    setCameraOpen(false);
    setCaptured(null);
  };

  const openConsent = () => {
    setConsentChecked(false);
    setConsentOpen(true);
  };

  const proceedFromConsent = () => {
    setConsentOpen(false);
    openCamera();
  };

  useEffect(() => () => { stopStabilityScan(); stopCamera(); }, []); // stop everything if the page unmounts mid-capture

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    stopStabilityScan();

    // Bug fix: this used to draw the ENTIRE camera frame (video.videoWidth
    // x video.videoHeight — the full background, hands, desk, etc.) and
    // hand that whole scene to Tesseract. The on-screen guide box only
    // existed to drive the auto-capture stability check above; nothing
    // ever cropped the actual captured photo down to it. So the printed
    // Aadhaar text — the only part that matters — ended up as a small,
    // low-detail region inside a mostly-irrelevant image, which is a
    // rough starting point for OCR and a likely source of misread
    // digits/characters.
    //
    // The video element is rendered with object-cover inside a 16:10
    // box, so the visible guide-box rectangle (80% width, centered,
    // 1.586 card aspect ratio — must stay in sync with the overlay
    // markup above) has to be mapped through that same cover-scaling to
    // land on the right pixels in the raw video frame, not just taken
    // as a flat percentage of videoWidth/videoHeight.
    const CONTAINER_ASPECT = 16 / 10;
    const CARD_ASPECT = 1.586;
    const GUIDE_WIDTH_FRAC = 0.8;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const videoAspect = vw / vh;

    let visibleW, visibleH, cropOffsetX, cropOffsetY;
    if (videoAspect > CONTAINER_ASPECT) {
      // Video is relatively wider than the 16:10 box — cover crops the sides.
      visibleH = vh;
      visibleW = vh * CONTAINER_ASPECT;
      cropOffsetX = (vw - visibleW) / 2;
      cropOffsetY = 0;
    } else {
      // Video is relatively taller/narrower — cover crops top and bottom.
      visibleW = vw;
      visibleH = vw / CONTAINER_ASPECT;
      cropOffsetX = 0;
      cropOffsetY = (vh - visibleH) / 2;
    }

    const guideWFrac = GUIDE_WIDTH_FRAC;
    const guideHFrac = (GUIDE_WIDTH_FRAC * CONTAINER_ASPECT) / CARD_ASPECT;
    const guideXFrac = (1 - guideWFrac) / 2;
    const guideYFrac = (1 - guideHFrac) / 2;

    const sx = cropOffsetX + guideXFrac * visibleW;
    const sy = cropOffsetY + guideYFrac * visibleH;
    const sw = guideWFrac * visibleW;
    const sh = guideHFrac * visibleH;

    // Upscale a bit on the way out — the cropped region is only ~80% of
    // the frame width to begin with, and printed Aadhaar text is small;
    // giving Tesseract more pixels per character measurably helps
    // recognition, the same reasoning behind the 1920x1080 camera
    // constraint above.
    const UPSCALE = 1.5;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * UPSCALE);
    canvas.height = Math.round(sh * UPSCALE);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setCaptured(dataUrl);
    stopCamera();
  };

  const retake = async () => {
    setCaptured(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(AADHAAR_CAMERA_CONSTRAINTS);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      startStabilityScan();
    } catch {
      toast.error("Couldn't access the camera.");
      setCameraOpen(false);
    }
  };

  const retakeFromReview = () => {
    setReviewOpen(false);
    setExtracted(null);
    openCamera();
  };

  const scanMutation = useMutation({
    mutationFn: async () => identityApi.scanAadhaar(captured, await getToken()),
    onSuccess: (res) => {
      if (res.alreadyVerified) {
        toast.success("You're already verified.");
        setCameraOpen(false);
        queryClient.invalidateQueries({ queryKey: ["identity-status"] });
        return;
      }
      setExtracted(res.extracted);
      setCameraOpen(false);
      setReviewOpen(true);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Couldn't read that card."),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => identityApi.confirmVerification(extracted, await getToken()),
    onSuccess: () => {
      toast.success("Identity verified.");
      setReviewOpen(false);
      queryClient.invalidateQueries({ queryKey: ["identity-status"] });
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onError: (e) => {
      const status = e.response?.data?.status;
      if (status === "duplicate") {
        toast.error(
          "This Aadhaar is already linked to another InterVue account. Duplicate accounts aren't allowed.",
          { duration: 6000 }
        );
      } else {
        toast.error(e.response?.data?.message || "Verification failed.");
      }
    },
  });

  const inputStyle = {
    background: THEME.surface,
    border: `1px solid ${THEME.border}`,
    color: THEME.ink,
    fontFamily: THEME.fontSans,
  };
  const fieldClass = "mt-1.5 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors";

  const aadhaarDigits = (extracted?.aadhaarNumber || "").replace(/\D/g, "");
  const canConfirm =
    extracted?.name?.trim() &&
    extracted?.dob?.trim() &&
    aadhaarDigits.length === 12 &&
    extracted?.aadhaarNumberValid;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl p-6 sm:p-7"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: isVerified ? THEME.successTint || "#ECFDF5" : THEME.surface2 }}
            >
              {isVerified ? (
                <ShieldCheck size={18} color={THEME.success} />
              ) : (
                <ShieldAlert size={18} color={THEME.inkFaint} />
              )}
            </div>
            <div className="min-w-0">
              <h3
                className="text-sm font-semibold"
                style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}
              >
                Identity Verification
              </h3>
              {isVerified ? (
                <p className="text-xs mt-1" style={{ color: THEME.inkMuted }}>
                  Verified via Aadhaar scan
                  {verification.maskedAadhaar ? ` · Aadhaar ${verification.maskedAadhaar}` : ""}
                  {verification.verifiedAt
                    ? ` · ${new Date(verification.verifiedAt).toLocaleDateString()}`
                    : ""}
                </p>
              ) : (
                <p className="text-xs mt-1" style={{ color: THEME.inkMuted }}>
                  Scan your Aadhaar card with your camera to verify your identity and prevent
                  duplicate accounts. Required before you can apply to jobs. Your name, date of
                  birth, and Aadhaar number will be set from the card and can't be changed
                  afterward.
                </p>
              )}
            </div>
          </div>

          {!isVerified && (
            <button
              type="button"
              onClick={openConsent}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors"
              style={{ background: THEME.ink, color: THEME.surface }}
            >
              <Camera size={13} />
              Scan Aadhaar Card
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── Data privacy consent, shown before requesting camera access ─── */}
      <AnimatePresence>
        {consentOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(23,23,31,0.7)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-xl overflow-hidden"
              style={{ background: THEME.surface }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${THEME.border}` }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: THEME.surface2 }}
                  >
                    <Lock size={15} color={THEME.ink} />
                  </div>
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}
                  >
                    Before you scan your Aadhaar card
                  </h3>
                </div>
                <button onClick={() => setConsentOpen(false)} style={{ color: THEME.inkMuted }}>
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                <p className="text-xs leading-relaxed" style={{ color: THEME.inkMuted }}>
                  We're about to request access to your camera to scan your Aadhaar card
                  for identity verification. Please review how this data is handled
                  before continuing.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: THEME.successTint || "#ECFDF5" }}
                    >
                      <ShieldCheck size={13} color={THEME.success} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: THEME.ink }}>
                      Your name, date of birth, and Aadhaar number are extracted from the
                      photo and stored securely in our database, used only to verify your
                      identity and prevent duplicate accounts.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: THEME.successTint || "#ECFDF5" }}
                    >
                      <Ban size={13} color={THEME.success} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: THEME.ink }}>
                      This information is kept strictly confidential and is never shared,
                      sold, or exposed to any third-party application or service.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: THEME.successTint || "#ECFDF5" }}
                    >
                      <EyeOff size={13} color={THEME.success} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: THEME.ink }}>
                      Only a masked version of your Aadhaar number (last 4 digits) is
                      ever shown elsewhere on the platform, including to interviewers
                      and admins.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-xs" style={{ color: THEME.ink }}>
                    I have read the above and consent to InterVue capturing and storing
                    my Aadhaar details for identity verification.
                  </span>
                </label>

                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setConsentOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium"
                    style={{ color: THEME.ink, border: `1px solid ${THEME.border}` }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={proceedFromConsent}
                    disabled={!consentChecked}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: THEME.ink, color: THEME.surface }}
                  >
                    <Camera size={14} />
                    Agree & Open Camera
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Live camera capture modal ─────────────────────────────── */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(23,23,31,0.7)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-xl overflow-hidden"
              style={{ background: THEME.surface }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${THEME.border}` }}
              >
                <h3
                  className="text-sm font-semibold"
                  style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}
                >
                  Scan Aadhaar Card
                </h3>
                <button onClick={closeCamera} style={{ color: THEME.inkMuted }}>
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                <div
                  className="relative w-full aspect-[16/10] rounded-lg overflow-hidden"
                  style={{ background: "#000" }}
                >
                  {!captured ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img src={captured} alt="Captured Aadhaar card" className="w-full h-full object-cover" />
                  )}

                  {/* ─── Card-guide overlay: darkened surrounds, corner
                      brackets, and an animated scan line, sized to the
                      standard ID-1 card aspect ratio (~1.586:1) so the
                      guide itself communicates exactly where to hold the
                      Aadhaar card. ─── */}
                  {!captured && cameraOpen && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div
                        className="absolute rounded-xl overflow-hidden"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "80%",
                          aspectRatio: "1.586",
                          boxShadow: "0 0 0 2000px rgba(0,0,0,0.6)",
                          border: `1.5px solid ${
                            scanStatus === "aligned" ? THEME.success : "rgba(255,255,255,0.55)"
                          }`,
                          transition: "border-color 200ms ease",
                        }}
                      >
                        {CORNER_BRACKETS.map((corner) => (
                          <div
                            key={corner.key}
                            className={`absolute w-6 h-6 border-solid ${corner.borderCls} ${corner.roundedCls}`}
                            style={{
                              [corner.vSide]: -1.5,
                              [corner.hSide]: -1.5,
                              borderColor: scanStatus === "aligned" ? THEME.success : "#fff",
                              transition: "border-color 200ms ease",
                            }}
                          />
                        ))}

                        {scanStatus !== "captured" && (
                          <motion.div
                            className="absolute left-0 right-0 h-[2px]"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${
                                scanStatus === "aligned" ? THEME.success : THEME.primary
                              }, transparent)`,
                              boxShadow: `0 0 10px ${
                                scanStatus === "aligned" ? THEME.success : THEME.primary
                              }`,
                            }}
                            animate={{ top: ["6%", "92%", "6%"] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!captured && cameraOpen && (
                  <div className="mt-3 flex items-center gap-2">
                    <motion.span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: scanStatus === "aligned" ? THEME.success : THEME.inkFaint }}
                      animate={
                        scanStatus === "aligned"
                          ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }
                          : { scale: 1, opacity: 0.5 }
                      }
                      transition={{ duration: 0.6, repeat: scanStatus === "aligned" ? Infinity : 0 }}
                    />
                    <p
                      className="text-xs font-medium"
                      style={{ color: scanStatus === "aligned" ? THEME.success : THEME.inkMuted }}
                    >
                      {scanStatus === "aligned"
                        ? "Card detected — capturing…"
                        : "Fit your Aadhaar card inside the frame, flat and well-lit."}
                    </p>
                  </div>
                )}

                {captured && (
                  <p className="text-xs mt-3" style={{ color: THEME.inkMuted }}>
                    Check the photo is sharp and fully readable before continuing.
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  {!captured ? (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                      style={{ color: THEME.ink, border: `1px solid ${THEME.border}` }}
                    >
                      <Camera size={15} />
                      Capture Manually
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={retake}
                        className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium"
                        style={{ color: THEME.ink, border: `1px solid ${THEME.border}` }}
                      >
                        <RotateCcw size={14} />
                        Retake
                      </button>
                      <button
                        type="button"
                        onClick={() => scanMutation.mutate()}
                        disabled={scanMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                        style={{ background: THEME.ink, color: THEME.surface }}
                      >
                        {scanMutation.isPending ? (
                          <>
                            <Loader2 size={15} className="animate-spin" /> Reading card...
                          </>
                        ) : (
                          <>
                            <Check size={15} /> Use this photo
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Review / correct extracted fields before saving ──────────── */}
      <AnimatePresence>
        {reviewOpen && extracted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(23,23,31,0.7)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-xl overflow-hidden"
              style={{ background: THEME.surface }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${THEME.border}` }}
              >
                <h3
                  className="text-sm font-semibold"
                  style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}
                >
                  Confirm your details
                </h3>
                <button onClick={() => setReviewOpen(false)} style={{ color: THEME.inkMuted }}>
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs" style={{ color: THEME.inkMuted }}>
                  Here's what we read from your card. These fields can't be edited directly — if
                  anything looks wrong, retake the photo instead. Once confirmed, name, date of
                  birth, and Aadhaar number can't be changed.
                </p>

                {!canConfirm && (
                  <p
                    className="text-xs rounded-lg px-3 py-2"
                    style={{
                      color: THEME.warning,
                      background: THEME.warningTint,
                      border: `1px solid ${THEME.warningBorder}`,
                    }}
                  >
                    {aadhaarDigits.length !== 12
                      ? "Couldn't read a complete Aadhaar number from that photo."
                      : !extracted.aadhaarNumberValid
                      ? "This Aadhaar number didn't pass validation."
                      : "Some details couldn't be read clearly."}{" "}
                    Please retake the photo.
                  </p>
                )}

                <div>
                  <label
                    className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: THEME.inkFaint, fontFamily: THEME.fontMono }}
                  >
                    Name
                  </label>
                  <div className={fieldClass} style={inputStyle}>
                    {extracted.name?.trim() || <span style={{ color: THEME.inkFaint }}>Not detected</span>}
                  </div>
                </div>

                <div>
                  <label
                    className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: THEME.inkFaint, fontFamily: THEME.fontMono }}
                  >
                    Date of Birth
                  </label>
                  <div className={fieldClass} style={inputStyle}>
                    {extracted.dob?.trim() || <span style={{ color: THEME.inkFaint }}>Not detected</span>}
                  </div>
                </div>

                <div>
                  <label
                    className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: THEME.inkFaint, fontFamily: THEME.fontMono }}
                  >
                    Aadhaar Number
                  </label>
                  <div className={fieldClass} style={inputStyle}>
                    {aadhaarDigits.length === 12 ? (
                      extracted.aadhaarNumber
                    ) : (
                      <span style={{ color: THEME.inkFaint }}>Not detected</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={retakeFromReview}
                    className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium"
                    style={{ color: THEME.ink, border: `1px solid ${THEME.border}` }}
                  >
                    <RotateCcw size={14} />
                    Wrong, Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmMutation.mutate()}
                    disabled={!canConfirm || confirmMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                    style={{ background: THEME.ink, color: THEME.surface }}
                  >
                    {confirmMutation.isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Verifying...
                      </>
                    ) : (
                      "Confirm & Verify"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default IdentityVerificationCard;