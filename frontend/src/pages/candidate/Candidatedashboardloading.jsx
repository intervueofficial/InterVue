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

function SessionCardSkeleton({ delay = 0 }) {
  return (
    <div
      className="rounded-xl animate-[fadeIn_0.4s_ease-out_both]"
      style={{
        background: THEME.surface,
        border: `1px solid ${THEME.border}`,
        minHeight: 240,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="p-5 space-y-4">
        <Shimmer className="h-5 w-2/3" />
        <Shimmer className="h-3 w-1/3" />
        <div className="h-px my-2" style={{ background: THEME.surface2 }} />
        <Shimmer className="h-3 w-1/2" />
        <Shimmer className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function QuickLinkSkeleton({ delay = 0 }) {
  return (
    <div
      className="rounded-xl p-5 animate-[fadeIn_0.4s_ease-out_both]"
      style={{
        background: THEME.surface,
        border: `1px solid ${THEME.border}`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <Shimmer className="w-9 h-9" rounded="rounded-lg" />
        <Shimmer className="w-3.5 h-3.5" rounded="rounded-sm" />
      </div>
      <Shimmer className="w-32 h-3.5 mt-3.5 mb-2" />
      <Shimmer className="w-40 h-3" />
    </div>
  );
}

const CandidateDashboardLoading = () => {
  return (
    <div className="space-y-12">
      {/* Page header skeleton */}
      <div className="animate-[fadeIn_0.4s_ease-out_both]">
        <Shimmer className="w-24 h-3 mb-3" />
        <Shimmer className="w-56 h-7 mb-3" />
        <Shimmer className="w-80 max-w-full h-4" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCardSkeleton delay={0} />
        <StatCardSkeleton delay={60} />
        <StatCardSkeleton delay={120} />
        <StatCardSkeleton delay={180} />
      </div>

      {/* Upcoming interviews section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5 animate-[fadeIn_0.4s_ease-out_both]" style={{ animationDelay: "220ms" }}>
            <Shimmer className="w-[18px] h-[18px]" rounded="rounded-sm" />
            <Shimmer className="w-40 h-5" />
            <Shimmer className="w-8 h-5" rounded="rounded-full" />
          </div>
          <Shimmer
            className="w-16 h-4 animate-[fadeIn_0.4s_ease-out_both]"
            style={{ animationDelay: "220ms" }}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <SessionCardSkeleton delay={260} />
          <SessionCardSkeleton delay={320} />
          <SessionCardSkeleton delay={380} />
        </div>
      </div>

      {/* Quick links section */}
      <div>
        <Shimmer
          className="w-32 h-5 mb-5 animate-[fadeIn_0.4s_ease-out_both]"
          style={{ animationDelay: "420ms" }}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLinkSkeleton delay={460} />
          <QuickLinkSkeleton delay={500} />
          <QuickLinkSkeleton delay={540} />
        </div>
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

export default CandidateDashboardLoading;