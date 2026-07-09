import { THEME } from "../../constants/theme";

/* ─── Shimmer block primitive ────────────────────────────────────────────── */
function Shimmer({ className = "", style = {}, rounded = "rounded-md" }) {
  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{ background: THEME.surface2, ...style }}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)`,
        }}
      />
    </div>
  );
}

function StatCardSkeleton({ delay = 0 }) {
  return (
    <div
      className="rounded-xl p-5 animate-[fadeIn_0.4s_ease-out_both]"
      style={{
        background: THEME.surface,
        border: `1px solid ${THEME.border}`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <Shimmer className="w-9 h-9" rounded="rounded-lg" />
        <Shimmer className="w-12 h-4" />
      </div>
      <Shimmer className="w-16 h-6 mb-2" />
      <Shimmer className="w-24 h-3" />
    </div>
  );
}

function BreakdownRowSkeleton({ delay = 0 }) {
  return (
    <div className="animate-[fadeIn_0.4s_ease-out_both]" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <Shimmer className="w-6 h-6" rounded="rounded-md" />
          <Shimmer className="w-24 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <Shimmer className="w-6 h-3.5" />
          <Shimmer className="w-8 h-3.5" />
        </div>
      </div>
      <Shimmer className="w-full h-1.5" rounded="rounded-full" />
    </div>
  );
}

function PanelCardSkeleton({ delay = 0 }) {
  return (
    <div
      className="rounded-xl overflow-hidden animate-[fadeIn_0.4s_ease-out_both]"
      style={{
        background: THEME.surface,
        border: `1px solid ${THEME.border}`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="px-6 py-5" style={{ borderBottom: `1px solid ${THEME.border}` }}>
        <Shimmer className="w-40 h-4 mb-2" />
        <Shimmer className="w-56 h-3" />
      </div>
      <div className="px-6 py-5 flex flex-col gap-5">
        <BreakdownRowSkeleton delay={0} />
        <BreakdownRowSkeleton delay={80} />
        <BreakdownRowSkeleton delay={160} />
      </div>
    </div>
  );
}

const Loading = () => {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="animate-[fadeIn_0.4s_ease-out_both]">
        <Shimmer className="w-40 h-3 mb-3" />
        <Shimmer className="w-64 h-7 mb-3" />
        <Shimmer className="w-96 max-w-full h-4" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCardSkeleton delay={0} />
        <StatCardSkeleton delay={60} />
        <StatCardSkeleton delay={120} />
        <StatCardSkeleton delay={180} />
      </div>

      {/* Panel cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PanelCardSkeleton delay={240} />
        <PanelCardSkeleton delay={300} />
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Loading;