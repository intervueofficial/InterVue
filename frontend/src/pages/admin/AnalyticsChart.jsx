import { useState } from "react";

/**
 * Lightweight dependency-free SVG bar chart for the last N days of session
 * activity. Kept as plain SVG (no recharts/chart.js) since neither was
 * already a project dependency -- this avoids adding a new package just
 * for one chart.
 */
const AnalyticsChart = ({ data = [], title, subtitle }) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  const width = 720;
  const height = 220;
  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 16;
  const paddingBottom = 34;

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const barGap = 8;
  const barWidth =
    data.length > 0
      ? Math.max(4, chartWidth / data.length - barGap)
      : 0;

  const formatLabel = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  return (
    <>
      <style>{`
        .chart-card{
          background:#fff;
          border:1px solid #E2E8F0;
          border-radius:22px;
          padding:26px;
          transition:.25s;
        }

        .chart-card:hover{
          box-shadow:0 20px 45px rgba(15,23,42,.06);
          border-color:#CBD5E1;
        }

        .chart-title{
          font-size:16px;
          font-weight:700;
          color:#0F172A;
        }

        .chart-subtitle{
          font-size:13px;
          color:#94A3B8;
          margin-top:4px;
        }

        .chart-bar{
          fill:#2563EB;
          opacity:0.85;
          transition:opacity .15s;
          cursor:pointer;
        }

        .chart-bar:hover{
          opacity:1;
        }

        .chart-bar-track{
          fill:#EFF6FF;
        }

        .chart-axis-label{
          font-size:10px;
          fill:#94A3B8;
          font-family:inherit;
        }

        .chart-tooltip{
          font-size:11px;
          font-weight:700;
          fill:#2563EB;
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
            {data.map((d, i) => {
              const x = paddingLeft + i * (barWidth + barGap);
              const barHeight =
                maxCount > 0 ? (d.count / maxCount) * chartHeight : 0;
              const y = paddingTop + (chartHeight - barHeight);
              const isHovered = hoverIndex === i;

              return (
                <g
                  key={d.date}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {/* full-height invisible hit area + track */}
                  <rect
                    className="chart-bar-track"
                    x={x}
                    y={paddingTop}
                    width={barWidth}
                    height={chartHeight}
                    rx={6}
                  />

                  <rect
                    className="chart-bar"
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, d.count > 0 ? 3 : 0)}
                    rx={6}
                  />

                  {isHovered && (
                    <text
                      className="chart-tooltip"
                      x={x + barWidth / 2}
                      y={y - 8}
                      textAnchor="middle"
                    >
                      {d.count}
                    </text>
                  )}

                  {i % 2 === 0 && (
                    <text
                      className="chart-axis-label"
                      x={x + barWidth / 2}
                      y={height - 12}
                      textAnchor="middle"
                    >
                      {formatLabel(d.date)}
                    </text>
                  )}
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
