import { CalendarDays } from "lucide-react";

const EmptySessions = ({
  title = "No sessions to show",
  subtitle = "Sessions will appear here once they're scheduled.",
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border"
      style={{ borderColor: "#E5E9F0", background: "#fff" }}
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
      >
        <CalendarDays size={20} color="#94A3B8" strokeWidth={2} />
      </div>

      <h2 className="text-sm font-semibold text-slate-800 mt-4">{title}</h2>

      <p className="text-sm text-slate-400 mt-1 max-w-xs">{subtitle}</p>
    </div>
  );
};

export default EmptySessions;
