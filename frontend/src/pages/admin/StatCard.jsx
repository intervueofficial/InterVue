import { ArrowUpRightIcon, ArrowDownRightIcon } from "lucide-react";
import { THEME } from "../../constants/theme";

/**
 * KPI-style stat card ("Ashby Light" system).
 * Same props as before — title, value, subtitle, icon, color, trend,
 * trendUp, onClick — so every existing usage keeps working unchanged.
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = THEME.primary,
  trend,
  trendUp,
  onClick,
}) => {
  const Trend = trendUp ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-3 p-5 rounded-xl transition-colors"
      style={{
        background: THEME.surface,
        border: `1px solid ${THEME.border}`,
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = THEME.borderStrong;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = THEME.border;
      }}
    >
      <div className="flex items-center justify-between">
        <p
          style={{
            fontFamily: THEME.fontMono,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: THEME.inkMuted,
          }}
        >
          {title}
        </p>

        {Icon && <Icon size={16} color={color} strokeWidth={2} />}
      </div>

      <div className="flex items-baseline gap-2">
        <p
          style={{
            fontFamily: THEME.fontDisplay,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: THEME.ink,
            lineHeight: 1.1,
          }}
        >
          {value ?? "--"}
        </p>

        {trend && (
          <span
            className="inline-flex items-center gap-0.5 text-xs font-medium"
            style={{ color: trendUp ? THEME.success : THEME.danger }}
          >
            <Trend size={12} />
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs" style={{ color: THEME.inkMuted }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
