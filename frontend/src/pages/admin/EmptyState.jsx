import { Inbox } from "lucide-react";
import { THEME } from "../../constants/theme";

const EmptyState = ({ title, description }) => {
  return (
    <div
      className="rounded-xl p-16 text-center"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto"
        style={{ background: THEME.surface2 }}
      >
        <Inbox size={24} color={THEME.inkFaint} />
      </div>

      <h2
        className="mt-5 text-xl"
        style={{ fontFamily: THEME.fontDisplay, fontWeight: 600, color: THEME.ink }}
      >
        {title}
      </h2>

      <p className="mt-2 text-sm" style={{ color: THEME.inkMuted }}>
        {description}
      </p>
    </div>
  );
};

export default EmptyState;