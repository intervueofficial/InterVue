import { useEffect, useRef, useState } from "react";
import { RefreshCwIcon, PauseIcon, PlayIcon } from "lucide-react";
import { THEME } from "../../constants/theme";

/**
 * Shared "live data" control for admin list/dashboard pages.
 * Ticks down to the next automatic refresh, lets the user pause/resume
 * auto-refresh, and always offers a manual refresh regardless of pause
 * state — the pattern used by most SaaS ops/analytics dashboards.
 *
 * Usage:
 *   <AutoRefreshBar onRefresh={refetch} isFetching={isFetching} intervalSeconds={30} />
 */
function AutoRefreshBar({ onRefresh, isFetching = false, intervalSeconds = 30 }) {
  const [enabled, setEnabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          onRefreshRef.current?.();
          return intervalSeconds;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [enabled, intervalSeconds]);

  const handleManualRefresh = () => {
    onRefresh?.();
    setSecondsLeft(intervalSeconds);
  };

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-1 py-1"
      style={{ border: `1px solid ${THEME.border}`, background: THEME.surface }}
    >
      <button
        type="button"
        onClick={() => setEnabled((e) => !e)}
        title={enabled ? "Pause auto-refresh" : "Resume auto-refresh"}
        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
        style={{ color: THEME.inkMuted }}
        onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {enabled ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
      </button>

      <span
        className="text-[11px] font-medium tabular-nums min-w-[92px] text-center"
        style={{ color: THEME.inkFaint, fontFamily: THEME.fontMono }}
      >
        {enabled ? `refresh in ${secondsLeft}s` : "auto-refresh off"}
      </span>

      <button
        type="button"
        onClick={handleManualRefresh}
        title="Refresh now"
        disabled={isFetching}
        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-50"
        style={{ color: THEME.inkMuted }}
        onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <RefreshCwIcon
          size={12}
          style={{
            animation: isFetching ? "spin 0.7s linear infinite" : "none",
          }}
        />
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AutoRefreshBar;
