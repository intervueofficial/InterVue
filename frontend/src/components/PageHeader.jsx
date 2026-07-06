import { THEME } from "../constants/theme";

/**
 * Shared page header: small mono "eyebrow" label, a display-font title,
 * an optional description, and optional right-aligned actions (buttons).
 */
function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header
      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6"
      style={{ borderBottom: `1px solid ${THEME.border}` }}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p
            className="mb-2"
            style={{
              fontFamily: THEME.fontMono,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: THEME.inkMuted,
            }}
          >
            {eyebrow}
          </p>
        )}

        <h1
          className="truncate text-2xl sm:text-[28px]"
          style={{ fontFamily: THEME.fontDisplay, fontWeight: 600, letterSpacing: "-0.02em", color: THEME.ink }}
        >
          {title}
        </h1>

        {description && (
          <p className="mt-1.5 max-w-2xl text-sm" style={{ color: THEME.inkMuted }}>
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export default PageHeader;
