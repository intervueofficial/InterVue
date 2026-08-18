import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { THEME } from "../../constants/theme";

/**
 * Manual refresh button + a quiet "auto-refreshing every Ns" indicator.
 * Owns its own interval timer and just calls `onRefresh` on schedule —
 * the page doesn't need to configure react-query's refetchInterval
 * itself, this component drives it from the outside.
 */
function AutoRefreshBar({ onRefresh, isFetching, intervalSeconds = 30 }) {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    if (!intervalSeconds) return undefined;
    const id = setInterval(() => {
      onRefresh?.();
    }, intervalSeconds * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalSeconds]);

  useEffect(() => {
    if (!isFetching) setLastUpdated(new Date());
  }, [isFetching]);

  return (
    <div className="flex items-center gap-3">
      <div
        className="hidden md:flex items-center gap-1.5 text-xs"
        style={{ fontFamily: THEME.fontMono, color: THEME.inkFaint }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: THEME.success }}
          />
          <span
            className="relative inline-flex rounded-full h-1.5 w-1.5"
            style={{ background: THEME.success }}
          />
        </span>
        Auto-refresh {intervalSeconds}s
        <span>
          &middot;{" "}
          {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <button
        onClick={() => onRefresh?.()}
        disabled={isFetching}
        title="Refresh now"
        className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.ink }}
        onMouseEnter={(e) => !isFetching && (e.currentTarget.style.background = THEME.surface2)}
        onMouseLeave={(e) => (e.currentTarget.style.background = THEME.surface)}
      >
        <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
        {isFetching ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

export default AutoRefreshBar;