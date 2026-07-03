import { useState, useRef, useCallback, useEffect } from "react";

/* ─── Screen Recorder Hook ──────────────────────────────────────────────────── */
function useScreenRecorder() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      setBlob(null);
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
          cursor: "always",
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
        },
      });

      let audioStream = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch (_) {
        /* no mic, that's fine */
      }

      const tracks = [...displayStream.getTracks()];
      if (audioStream) tracks.push(...audioStream.getAudioTracks());

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setBlob(blob);
        setRecording(false);
        clearInterval(timerRef.current);
        setDuration(0);
        combinedStream.getTracks().forEach((t) => t.stop());
      };

      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== "inactive") recorder.stop();
      };

      recorder.start(1000);
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      setError(err.message || "Screen recording failed");
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const download = useCallback(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-recording-${Date.now()}.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [blob]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  return {
    recording,
    duration,
    formatDuration,
    blob,
    error,
    start,
    stop,
    download,
  };
}

export default useScreenRecorder;
