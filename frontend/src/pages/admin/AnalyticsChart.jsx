import { useState } from "react";
import { THEME } from "../../constants/theme";

/**
 * Lightweight dependency-free SVG bar chart for the last N days of session
 * activity. Kept as plain SVG (no recharts/chart.js) since neither was
 * already a project dependency -- this avoids adding a new package just
 * for one chart.
 */
const AnalyticsChart = ({ data = [], title, subtitle }) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  const width = 720;
  const height = 260;
  const paddingLeft = 34;
  const paddingRight = 8;
  const paddingTop = 20;
  const paddingBottom = 34;

  const maxCount = Math.max(1, ...data.map((d) => d.count));

  // Round the axis ceiling up to a "nice" number so gridlines read cleanly
  const niceMax = (() => {
    if (maxCount <= 4) return Math.max(4, maxCount);
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxCount)));
    const residual = maxCount / magnitude;
    let niceResidual;
    if (residual <= 1) niceResidual = 1;
    else if (residual <= 2) niceResidual = 2;
    else if (residual <= 5) niceResidual = 5;
    else niceResidual = 10;
    return niceResidual * magnitude;
  })();

  const gridSteps = 4;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) =>
    Math.round((niceMax / gridSteps) * i)
  ).reverse();

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const barGap = 10;
  const barWidth =
    data.length > 0
      ? Math.max(4, chartWidth / data.length - barGap)
      : 0;

  const formatLabel = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const formatFullLabel = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <>
      <style>{`
        .chart-card{
          background:${THEME.surface};
          border:1px solid ${THEME.border};
          border-radius:12px;
          padding:24px;
          transition:.25s;
        }

        .chart-card:hover{
          border-color:${THEME.borderStrong};
        }

        .chart-title{
          font-size:15px;
          font-weight:600;
          font-family:${THEME.fontDisplay};
          color:${THEME.ink};
        }

        .chart-subtitle{
          font-size:12px;
          color:${THEME.inkFaint};
          margin-top:2px;
        }

        .chart-bar{
          fill:url(#barGradient);
          transition:filter .15s ease, opacity .15s ease;
          cursor:pointer;
        }

        .chart-bar.dimmed{
          opacity:0.35;
        }

        .chart-bar.active{
          filter:brightness(1.08);
        }

        .chart-hit-area{
          fill:transparent;
          cursor:pointer;
        }

        .chart-gridline{
          stroke:${THEME.surface2};
          stroke-width:1;
        }

        .chart-baseline{
          stroke:${THEME.border};
          stroke-width:1.5;
        }

        .chart-hover-line{
          stroke:${THEME.borderStrong};
          stroke-width:1;
          stroke-dasharray:3 3;
        }

        .chart-axis-label{
          font-size:10.5px;
          fill:${THEME.inkFaint};
          font-family:inherit;
        }

        .chart-axis-label.active{
          fill:${THEME.primary};
          font-weight:600;
        }

        .chart-y-label{
          font-size:10px;
          fill:${THEME.inkFaint};
          font-family:inherit;
        }

        .chart-tooltip-bg{
          fill:${THEME.ink};
        }

        .chart-tooltip-text{
          font-size:11.5px;
          font-weight:700;
          fill:${THEME.surface};
          font-family:inherit;
        }

        .chart-tooltip-subtext{
          font-size:9.5px;
          font-weight:500;
          fill:${THEME.inkFaint};
          font-family:inherit;
        }
      `}</style>

      <div className="chart-card">
        {title && <div className="chart-title">{title}</div>}
        {subtitle && <div className="chart-subtitle">{subtitle}</div>}

        <div style={{ marginTop: 20, width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "auto", minWidth: 560 }}
            role="img"
            aria-label={title || "Sessions over time"}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={THEME.ink} stopOpacity="0.85" />
                <stop offset="100%" stopColor={THEME.ink} />
              </linearGradient>
            </defs>

            {/* Gridlines + Y-axis labels */}
            {gridValues.map((val, i) => {
              const y = paddingTop + (chartHeight / gridSteps) * i;
              return (
                <g key={val + "-" + i}>
                  <line
                    className="chart-gridline"
                    x1={paddingLeft}
                    x2={width - paddingRight}
                    y1={y}
                    y2={y}
                  />
                  <text
                    className="chart-y-label"
                    x={paddingLeft - 10}
                    y={y + 3}
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Baseline (solid, on top of gridlines) */}
            <line
              className="chart-baseline"
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={paddingTop + chartHeight}
              y2={paddingTop + chartHeight}
            />

            {data.map((d, i) => {
              const x = paddingLeft + i * (barWidth + barGap);
              const barHeight =
                niceMax > 0 ? (d.count / niceMax) * chartHeight : 0;
              const y = paddingTop + (chartHeight - barHeight);
              const isHovered = hoverIndex === i;
              const anyHovered = hoverIndex !== null;

              return (
                <g
                  key={d.date}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {/* full-height hit area for easier hover targeting */}
                  <rect
                    className="chart-hit-area"
                    x={x - barGap / 2}
                    y={paddingTop}
                    width={barWidth + barGap}
                    height={chartHeight}
                  />

                  {isHovered && (
                    <line
                      className="chart-hover-line"
                      x1={x + barWidth / 2}
                      x2={x + barWidth / 2}
                      y1={paddingTop}
                      y2={paddingTop + chartHeight}
                    />
                  )}

                  <rect
                    className={`chart-bar ${
                      anyHovered && !isHovered ? "dimmed" : ""
                    } ${isHovered ? "active" : ""}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, d.count > 0 ? 3 : 1.5)}
                    rx={5}
                  />

                  {i % 2 === 0 && (
                    <text
                      className={`chart-axis-label ${
                        isHovered ? "active" : ""
                      }`}
                      x={x + barWidth / 2}
                      y={height - 12}
                      textAnchor="middle"
                    >
                      {formatLabel(d.date)}
                    </text>
                  )}

                  {isHovered &&
                    (() => {
                      const tooltipWidth = 64;
                      const tooltipHeight = 34;
                      const tipX = Math.min(
                        Math.max(
                          x + barWidth / 2 - tooltipWidth / 2,
                          paddingLeft
                        ),
                        width - paddingRight - tooltipWidth
                      );
                      const tipY = Math.max(y - tooltipHeight - 10, paddingTop);

                      return (
                        <g>
                          <rect
                            className="chart-tooltip-bg"
                            x={tipX}
                            y={tipY}
                            width={tooltipWidth}
                            height={tooltipHeight}
                            rx={8}
                          />
                          <text
                            className="chart-tooltip-text"
                            x={tipX + tooltipWidth / 2}
                            y={tipY + 15}
                            textAnchor="middle"
                          >
                            {d.count} session{d.count === 1 ? "" : "s"}
                          </text>
                          <text
                            className="chart-tooltip-subtext"
                            x={tipX + tooltipWidth / 2}
                            y={tipY + 27}
                            textAnchor="middle"
                          >
                            {formatFullLabel(d.date)}
                          </text>
                        </g>
                      );
                    })()}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </>
  );
};

export default AnalyticsChart;