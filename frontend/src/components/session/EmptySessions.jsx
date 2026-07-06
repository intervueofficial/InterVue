import { CalendarDays } from "lucide-react";
import { THEME } from "../../constants/theme";

const EmptySessions = ({
  title = "No sessions to show",
  subtitle = "Sessions will appear here once they're scheduled.",
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl"
      style={{ border: `1px solid ${THEME.border}`, background: THEME.surface }}
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center"
        style={{ background: THEME.surface2 }}
      >
        <CalendarDays size={20} color={THEME.inkFaint} strokeWidth={2} />
      </div>

      <h2 className="text-sm font-semibold mt-4" style={{ color: THEME.ink }}>{title}</h2>
      <p className="text-sm mt-1 max-w-xs" style={{ color: THEME.inkFaint }}>{subtitle}</p>
    </div>
  );
};

export default EmptySessions;
