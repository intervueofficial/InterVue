import { useCallback, useEffect, useRef, useState } from "react";

/*
 * ─── Real-time transport note ──────────────────────────────────────────────
 * InterVue's session page doesn't use Socket.IO — its real-time layer is
 * GetStream (Stream Video for the call, Stream Chat for in-call messages).
 * `channel` here is the same Stream Chat channel instance already created
 * by useStreamClient.js for the chat panel (`messaging:<session.callId>`).
 *
 * Stream Chat channels support arbitrary custom events via
 * `channel.sendEvent()` / `channel.on()`, delivered over the same
 * WebSocket connection already open for chat — this is the "existing
 * real-time connection" this hook reuses for whiteboard sync, playing
 * the same role Socket.IO custom events would in a Socket.IO-based app.
 * ────────────────────────────────────────────────────────────────────────
 */

const BROADCAST_THROTTLE_MS = 200; // batches rapid pen strokes into one event
const CURSOR_THROTTLE_MS = 120;
const CURSOR_STALE_MS = 4000;

/**
 * @param {object} params
 * @param {import("stream-chat").Channel} params.channel
 * @param {string} params.sessionId
 * @param {string} params.userId - current user's Stream user id (used to ignore our own echoed events)
 * @param {string} params.userName
 * @param {boolean} params.enabled
 */
export default function useWhiteboardSync({ channel, sessionId, userId, userName, enabled }) {
  const lastVersionsRef = useRef(new Map()); // elementId -> last broadcast version
  const pendingBatchRef = useRef(new Map()); // elementId -> element, waiting to flush
  const throttleTimerRef = useRef(null);
  const cursorThrottledRef = useRef(false);

  const remoteElementsHandlerRef = useRef(null);
  const remoteClearHandlerRef = useRef(null);

  const [remoteCursors, setRemoteCursors] = useState({}); // userId -> { x, y, name, t }
  const [isLive, setIsLive] = useState(false);

  /* ── Subscribe to incoming events ───────────────────────────────────── */
  useEffect(() => {
    if (!channel || !enabled) {
      setIsLive(false);
      return;
    }

    setIsLive(true);

    const belongsToUs = (event) =>
      (!event.sessionId || event.sessionId === sessionId) && event.user?.id !== userId;

    const handleUpdate = (event) => {
      if (!belongsToUs(event)) return;
      remoteElementsHandlerRef.current?.(event.elements || []);
    };

    const handleClear = (event) => {
      if (!belongsToUs(event)) return;
      remoteClearHandlerRef.current?.();
    };

    const handleCursor = (event) => {
      if (!belongsToUs(event)) return;
      setRemoteCursors((prev) => ({
        ...prev,
        [event.user.id]: {
          x: event.x,
          y: event.y,
          name: event.user?.name || "Guest",
          t: Date.now(),
        },
      }));
    };

    channel.on("whiteboard_update", handleUpdate);
    channel.on("whiteboard_clear", handleClear);
    channel.on("whiteboard_cursor", handleCursor);

    return () => {
      channel.off("whiteboard_update", handleUpdate);
      channel.off("whiteboard_clear", handleClear);
      channel.off("whiteboard_cursor", handleCursor);
      setIsLive(false);
    };
  }, [channel, enabled, sessionId, userId]);

  /* ── Drop cursors we haven't heard from in a while ──────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      setRemoteCursors((prev) => {
        const now = Date.now();
        const next = {};
        let changed = false;
        for (const [uid, c] of Object.entries(prev)) {
          if (now - c.t < CURSOR_STALE_MS) next[uid] = c;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const onRemoteElements = useCallback((cb) => {
    remoteElementsHandlerRef.current = cb;
  }, []);

  const onRemoteClear = useCallback((cb) => {
    remoteClearHandlerRef.current = cb;
  }, []);

  /* ── Broadcast only elements that actually changed (diff by version) ── */
  const flush = useCallback(() => {
    throttleTimerRef.current = null;
    if (!channel || pendingBatchRef.current.size === 0) return;

    const batch = Array.from(pendingBatchRef.current.values());
    pendingBatchRef.current.clear();

    batch.forEach((el) => lastVersionsRef.current.set(el.id, el.version));

    channel
      .sendEvent({ type: "whiteboard_update", sessionId, elements: batch })
      .catch((err) => console.warn("Whiteboard broadcast failed:", err?.message));
  }, [channel, sessionId]);

  const broadcastElements = useCallback(
    (elements) => {
      if (!channel || !enabled) return;

      for (const el of elements) {
        const lastVersion = lastVersionsRef.current.get(el.id);
        if (lastVersion === undefined || el.version > lastVersion) {
          pendingBatchRef.current.set(el.id, el);
        }
      }

      if (pendingBatchRef.current.size === 0) return;
      if (throttleTimerRef.current) return;

      throttleTimerRef.current = setTimeout(flush, BROADCAST_THROTTLE_MS);
    },
    [channel, enabled, flush]
  );

  const broadcastClear = useCallback(() => {
    if (!channel || !enabled) return;
    lastVersionsRef.current.clear();
    pendingBatchRef.current.clear();
    channel.sendEvent({ type: "whiteboard_clear", sessionId }).catch(() => {});
  }, [channel, enabled, sessionId]);

  const sendCursor = useCallback(
    (x, y) => {
      if (!channel || !enabled || cursorThrottledRef.current) return;
      cursorThrottledRef.current = true;
      setTimeout(() => {
        cursorThrottledRef.current = false;
      }, CURSOR_THROTTLE_MS);

      channel.sendEvent({ type: "whiteboard_cursor", sessionId, x, y }).catch(() => {});
    },
    [channel, enabled, sessionId]
  );

  // After loading a saved board (or fully reconciling a remote clear),
  // reset the "last broadcast version" bookkeeping so the next local
  // edit is diffed against reality instead of re-sending everything.
  const primeVersions = useCallback((elements) => {
    lastVersionsRef.current = new Map(elements.map((el) => [el.id, el.version]));
  }, []);

  return {
    isLive,
    remoteCursors,
    onRemoteElements,
    onRemoteClear,
    broadcastElements,
    broadcastClear,
    sendCursor,
    primeVersions,
  };
}
