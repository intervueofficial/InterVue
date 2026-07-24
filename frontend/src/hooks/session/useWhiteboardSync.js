import { useCallback, useEffect, useRef, useState } from "react";

const BROADCAST_THROTTLE_MS = 200;
const CURSOR_THROTTLE_MS = 120;
const CURSOR_STALE_MS = 4000;

export default function useWhiteboardSync({
  channel,
  sessionId,
  userId,
  userName,
  enabled,
}) {
  // -------------------------
  // Refs
  // -------------------------

  const lastVersionsRef = useRef(new Map());
  const pendingBatchRef = useRef(new Map());

  const throttleTimerRef = useRef(null);
  const cursorThrottleRef = useRef(false);

  const remoteElementsHandlerRef = useRef(null);
  const remoteClearHandlerRef = useRef(null);

  // -------------------------
  // State
  // -------------------------

  const [remoteCursors, setRemoteCursors] = useState({});
  const [isLive, setIsLive] = useState(false);

  // -------------------------
  // Subscribe to Stream events
  // -------------------------

  useEffect(() => {
    if (!channel || !enabled) {
      setIsLive(false);
      return;
    }

    setIsLive(true);

    const isRemoteEvent = (event) =>
      (!event.sessionId || event.sessionId === sessionId) &&
      event.user?.id !== userId;

    const handleWhiteboardUpdate = (event) => {
      if (!isRemoteEvent(event)) return;
      remoteElementsHandlerRef.current?.(event.elements || []);
    };

    const handleWhiteboardClear = (event) => {
      if (!isRemoteEvent(event)) return;
      remoteClearHandlerRef.current?.();
    };

    const handleCursorUpdate = (event) => {
      if (!isRemoteEvent(event)) return;

      setRemoteCursors((prev) => ({
        ...prev,
        [event.user.id]: {
          x: event.x,
          y: event.y,
          name: event.user?.name || userName || "Guest",
          t: Date.now(),
        },
      }));
    };

    channel.on("whiteboard_update", handleWhiteboardUpdate);
    channel.on("whiteboard_clear", handleWhiteboardClear);
    channel.on("whiteboard_cursor", handleCursorUpdate);

    return () => {
      channel.off("whiteboard_update", handleWhiteboardUpdate);
      channel.off("whiteboard_clear", handleWhiteboardClear);
      channel.off("whiteboard_cursor", handleCursorUpdate);

      setIsLive(false);
    };
  }, [channel, enabled, sessionId, userId, userName]);

  // -------------------------
  // Remove stale cursors
  // -------------------------

  useEffect(() => {
    const interval = setInterval(() => {
      setRemoteCursors((prev) => {
        const now = Date.now();
        const next = {};

        let changed = false;

        for (const [id, cursor] of Object.entries(prev)) {
          if (now - cursor.t < CURSOR_STALE_MS) {
            next[id] = cursor;
          } else {
            changed = true;
          }
        }

        return changed ? next : prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // -------------------------
  // Callback registration
  // -------------------------

  const onRemoteElements = useCallback((callback) => {
    remoteElementsHandlerRef.current = callback;
  }, []);

  const onRemoteClear = useCallback((callback) => {
    remoteClearHandlerRef.current = callback;
  }, []);

  // -------------------------
  // Flush pending updates
  // -------------------------

  const flush = useCallback(() => {
    throttleTimerRef.current = null;

    if (!channel || pendingBatchRef.current.size === 0) return;

    const batch = [...pendingBatchRef.current.values()];

    pendingBatchRef.current.clear();

    batch.forEach((element) => {
      lastVersionsRef.current.set(element.id, element.version);
    });

    channel.sendEvent({
      type: "whiteboard_update",
      sessionId,
      elements: batch,
    }).catch((err) => {
      console.warn("Whiteboard broadcast failed:", err?.message);
    });
  }, [channel, sessionId]);

  // -------------------------
  // Broadcast changed elements
  // -------------------------

  const broadcastElements = useCallback(
    (elements) => {
      if (!channel || !enabled) return;

      elements.forEach((element) => {
        const lastVersion = lastVersionsRef.current.get(element.id);

        if (
          lastVersion === undefined ||
          element.version > lastVersion
        ) {
          pendingBatchRef.current.set(element.id, element);
        }
      });

      if (pendingBatchRef.current.size === 0) return;
      if (throttleTimerRef.current) return;

      throttleTimerRef.current = setTimeout(
        flush,
        BROADCAST_THROTTLE_MS
      );
    },
    [channel, enabled, flush]
  );

  // -------------------------
  // Clear whiteboard
  // -------------------------

  const broadcastClear = useCallback(() => {
    if (!channel || !enabled) return;

    lastVersionsRef.current.clear();
    pendingBatchRef.current.clear();

    channel.sendEvent({
      type: "whiteboard_clear",
      sessionId,
    }).catch(() => {});
  }, [channel, enabled, sessionId]);

  // -------------------------
  // Send cursor
  // -------------------------

  const sendCursor = useCallback(
    (x, y) => {
      if (!channel || !enabled) return;
      if (cursorThrottleRef.current) return;

      cursorThrottleRef.current = true;

      setTimeout(() => {
        cursorThrottleRef.current = false;
      }, CURSOR_THROTTLE_MS);

      channel.sendEvent({
        type: "whiteboard_cursor",
        sessionId,
        x,
        y,
      }).catch(() => {});
    },
    [channel, enabled, sessionId]
  );

  // -------------------------
  // Prime element versions
  // -------------------------

  const primeVersions = useCallback((elements = []) => {
    lastVersionsRef.current = new Map(
      elements.map((element) => [element.id, element.version])
    );
  }, []);

  // -------------------------
  // Public API
  // -------------------------

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