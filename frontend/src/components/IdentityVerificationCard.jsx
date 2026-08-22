import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ShieldCheck, ShieldAlert, Loader2, Camera, X, RotateCcw, Check } from "lucide-react";

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

function IdentityVerificationCard({ index = 0 }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [cameraOpen, setCameraOpen] = useState(false);
  const [captured, setCaptured] = useState(null); // data URL of the captured frame
  const [extracted, setExtracted] = useState(null); // { name, dob, aadhaarNumber, aadhaarNumberValid }
  const [reviewOpen, setReviewOpen] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

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

  const openCamera = async () => {
    setCaptured(null);
    setExtracted(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(AADHAAR_CAMERA_CONSTRAINTS);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error("Couldn't access the camera. Please allow camera permission and try again.");
      setCameraOpen(false);
    }
  };

  const closeCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCaptured(null);
  };

  useEffect(() => () => stopCamera(), []); // stop the stream if the page unmounts mid-capture

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    setCaptured(dataUrl);
    stopCamera();
  };

  const retake = async () => {
    setCaptured(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(AADHAAR_CAMERA_CONSTRAINTS);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
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
              onClick={openCamera}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors"
              style={{ background: THEME.ink, color: THEME.surface }}
            >
              <Camera size={13} />
              Scan Aadhaar Card
            </button>
          )}
        </div>
      </motion.div>

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
                </div>

                <p className="text-xs mt-3" style={{ color: THEME.inkMuted }}>
                  Place your Aadhaar card flat, well-lit, with no glare, filling the frame.
                </p>

                <div className="mt-4 flex gap-2">
                  {!captured ? (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                      style={{ background: THEME.ink, color: THEME.surface }}
                    >
                      <Camera size={15} />
                      Capture
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
