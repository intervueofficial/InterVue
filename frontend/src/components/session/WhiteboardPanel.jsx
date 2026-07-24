import { useCallback, useEffect, useRef, useState } from "react";
import {
  Excalidraw,
  exportToBlob,
  reconcileElements,
  sceneCoordsToViewportCoords,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import toast from "react-hot-toast";
import {
  Trash2Icon,
  DownloadIcon,
  SaveIcon,
  WifiOffIcon,
  PenLineIcon,
} from "lucide-react";
import { T } from "../../constants/sessionTheme";
import { SpinnerIcon } from "./SessionUI";
import { useWhiteboardData, useSaveWhiteboard } from "../../hooks/useSessions";
import useWhiteboardSync from "../../hooks/session/useWhiteboardSync";

const AUTOSAVE_INTERVAL_MS = 8000;

/**
 * @param {object} props
 * @param {object} props.session
 * @param {import("stream-chat").Channel} props.channel
 * @param {{id:string,name:string}} props.currentUser
 * @param {"interviewer"|"candidate"|"viewer"} props.permission
 */
function WhiteboardPanel({ session, channel, currentUser, permission }) {
  const excalidrawRef = useRef(null);
  const lastElementsRef = useRef([]);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [viewState, setViewState] = useState({
    zoom: { value: 1 },
    offsetLeft: 0,
    offsetTop: 0,
    scrollX: 0,
    scrollY: 0,
  });

  const sessionId = session?._id;
  const canEdit = permission === "interviewer" || permission === "candidate";
  const canClear = permission === "interviewer";

  const { data: savedBoard, isLoading } = useWhiteboardData(sessionId);
  const saveMutation = useSaveWhiteboard(sessionId);
  const versionRef = useRef(0);

  const {
    isLive,
    remoteCursors,
    onRemoteElements,
    onRemoteClear,
    broadcastElements,
    broadcastClear,
    sendCursor,
    primeVersions,
  } = useWhiteboardSync({
    channel,
    sessionId,
    userId: currentUser?.id,
    userName: currentUser?.name,
    enabled: !!channel && !!sessionId,
  });

  /* Load the saved board into the canvas once it's fetched */
  useEffect(() => {
    if (!excalidrawRef.current || !savedBoard || loadedOnce) return;

    const elements = savedBoard.elements || [];
    excalidrawRef.current.updateScene({
      elements,
      appState: { viewBackgroundColor: savedBoard.appState?.viewBackgroundColor || "#ffffff" },
    });
    lastElementsRef.current = elements;
    versionRef.current = savedBoard.version || 0;
    primeVersions(elements);
    setLoadedOnce(true);
  }, [savedBoard, loadedOnce, primeVersions]);

  /* Apply incoming remote edits / clears into the local scene */
  useEffect(() => {
    onRemoteElements((incoming) => {
      if (!excalidrawRef.current) return;
      const merged = reconcileElements(
        lastElementsRef.current,
        incoming,
        excalidrawRef.current.getAppState()
      );
      lastElementsRef.current = merged;
      excalidrawRef.current.updateScene({ elements: merged });
    });

    onRemoteClear(() => {
      if (!excalidrawRef.current) return;
      lastElementsRef.current = [];
      excalidrawRef.current.updateScene({ elements: [] });
      toast("Whiteboard was cleared by the interviewer", { icon: "🧹" });
    });
  }, [onRemoteElements, onRemoteClear]);

  /* Local edits: keep our own copy in sync + broadcast the diff.
     (This also fires after Ctrl+Z/Ctrl+Shift+Z, since Excalidraw's
     undo/redo produces a normal onChange — so undo/redo converges for
     everyone else the same way any other edit does.) */
  const handleChange = useCallback(
    (elements, appState) => {
      setViewState({
        zoom: appState.zoom,
        offsetLeft: appState.offsetLeft,
        offsetTop: appState.offsetTop,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
      });

      if (!canEdit) return;
      lastElementsRef.current = elements;
      broadcastElements(elements);
    },
    [broadcastElements, canEdit]
  );

  const handlePointerUpdate = useCallback(
    ({ pointer }) => {
      if (!pointer) return;
      sendCursor(pointer.x, pointer.y);
    },
    [sendCursor]
  );

  const getCurrentScene = () => {
    const elements = excalidrawRef.current?.getSceneElements() || [];
    const appState = excalidrawRef.current?.getAppState() || {};
    return { elements, appState: { viewBackgroundColor: appState.viewBackgroundColor } };
  };

  const persist = useCallback(
    (elements, appState, { silent = true } = {}) => {
      versionRef.current += 1;
      saveMutation.mutate(
        { elements, appState, version: versionRef.current },
        {
          onError: () => {
            if (!silent) toast.error("Failed to save whiteboard");
          },
        }
      );
    },
    [saveMutation]
  );

  /* Auto-save every few seconds while editable */
  useEffect(() => {
    if (!canEdit || !sessionId || !loadedOnce) return;

    const id = setInterval(() => {
      const { elements, appState } = getCurrentScene();
      persist(elements, appState);
    }, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, sessionId, loadedOnce, persist]);

  /* Final save on unmount (covers "save when interview ends" for
     however the panel gets torn down — end-session navigation included) */
  useEffect(() => {
    return () => {
      if (!canEdit || !excalidrawRef.current) return;
      const { elements, appState } = getCurrentScene();
      persist(elements, appState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSave = () => {
    const { elements, appState } = getCurrentScene();
    persist(elements, appState, { silent: false });
    toast.success("Whiteboard saved");
  };

  const handleClear = () => {
    if (!canClear || !excalidrawRef.current) return;
    if (!window.confirm("Clear the whiteboard for everyone in this session?")) return;

    excalidrawRef.current.updateScene({ elements: [] });
    lastElementsRef.current = [];
    broadcastClear();
    persist([], {});
    toast.success("Whiteboard cleared");
  };

  const handleDownloadPng = async () => {
    if (!excalidrawRef.current) return;
    try {
      const elements = excalidrawRef.current.getSceneElements();
      const appState = excalidrawRef.current.getAppState();
      const blob = await exportToBlob({
        elements,
        appState: { ...appState, exportBackground: true },
        files: excalidrawRef.current.getFiles(),
        mimeType: "image/png",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `whiteboard-${(session?.title || sessionId || "session").replace(/\s+/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Whiteboard PNG export failed:", err);
      toast.error("Failed to export whiteboard as PNG");
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* Mini toolbar */}
      <div
        style={{
          height: 40,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px",
          borderBottom: `1px solid ${T.border}`,
          background: T.surface,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <PenLineIcon size={13} color={T.amber} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: T.dark }}>Whiteboard</span>

          {!isLive && (
            <span title="Sync paused — not connected" style={{ display: "flex", alignItems: "center" }}>
              <WifiOffIcon size={12} color={T.red} />
            </span>
          )}
          {saveMutation.isPending && <SpinnerIcon size={11} color={T.muted} />}
          {permission === "viewer" && (
            <span style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>(view only)</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {canEdit && (
            <button type="button" onClick={handleManualSave} style={miniBtnStyle}>
              <SaveIcon size={11} /> Save
            </button>
          )}
          <button type="button" onClick={handleDownloadPng} style={miniBtnStyle}>
            <DownloadIcon size={11} /> PNG
          </button>
          {canClear && (
            <button
              type="button"
              onClick={handleClear}
              style={{ ...miniBtnStyle, color: T.red, borderColor: T.redBorder, background: T.redTint }}
            >
              <Trash2Icon size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {isLoading && !loadedOnce && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              zIndex: 5,
            }}
          >
            <SpinnerIcon size={20} color={T.muted} />
          </div>
        )}

        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawRef.current = api;
          }}
          viewModeEnabled={!canEdit}
          onChange={handleChange}
          onPointerUpdate={canEdit ? handlePointerUpdate : undefined}
          UIOptions={{ canvasActions: { clearCanvas: false, loadScene: false } }}
        />

        {/* Remote cursors — positions arrive in scene coordinates (pan/zoom
            independent), converted here using our own current viewport. */}
        {Object.entries(remoteCursors).map(([uid, c]) => {
          const { x: left, y: top } = sceneCoordsToViewportCoords(
            { sceneX: c.x, sceneY: c.y },
            { ...viewState, offsetLeft: 0, offsetTop: 0 }
          );
          return (
            <div
              key={uid}
              style={{
                position: "absolute",
                left,
                top,
                pointerEvents: "none",
                zIndex: 10,
                transition: "left 0.08s linear, top 0.08s linear",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: T.blue,
                  border: "2px solid #fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                }}
              />
              <div
                style={{
                  marginTop: 3,
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#fff",
                  background: T.blue,
                  padding: "1px 6px",
                  borderRadius: 3,
                  whiteSpace: "nowrap",
                }}
              >
                {c.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const miniBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 9px",
  borderRadius: 4,
  border: `1px solid ${T.border}`,
  background: "#fff",
  fontSize: 10.5,
  fontWeight: 700,
  color: T.body,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
};

export default WhiteboardPanel;
