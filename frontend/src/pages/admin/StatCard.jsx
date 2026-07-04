const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "#2563EB",
  trend,
  trendUp,
  onClick,
}) => {
  return (
    <>
      <style>{`
        .stat-card{
          background:#fff;
          border:1px solid #E5E9F0;
          border-radius:14px;
          padding:22px 22px 20px;
          transition:border-color .18s ease, box-shadow .18s ease;
          position:relative;
        }

        .stat-card.clickable{
          cursor:pointer;
        }

        .stat-card:hover{
          border-color:#CBD5E1;
          box-shadow:0 4px 16px rgba(15,23,42,.05);
        }

        .stat-top{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
        }

        .stat-icon-box{
          width:36px;
          height:36px;
          border-radius:9px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#F1F5F9;
          flex-shrink:0;
        }

        .stat-trend{
          display:inline-flex;
          align-items:center;
          gap:3px;
          font-size:11.5px;
          font-weight:600;
          padding:3px 8px;
          border-radius:99px;
          letter-spacing:-0.1px;
        }

        .stat-value{
          margin-top:16px;
          font-size:28px;
          font-weight:700;
          color:#0B1220;
          letter-spacing:-0.6px;
          line-height:1.1;
        }

        .stat-title{
          margin-top:6px;
          font-size:13px;
          color:#334155;
          font-weight:500;
        }

        .stat-sub{
          margin-top:3px;
          color:#94A3B8;
          font-size:12px;
          line-height:1.5;
        }
      `}</style>

      <div
        className={`stat-card${onClick ? " clickable" : ""}`}
        onClick={onClick}
        style={{ borderTop: `2px solid ${color}` }}
      >
        <div className="stat-top">
          <div className="stat-icon-box">
            {Icon && <Icon color="#475569" size={17} strokeWidth={2} />}
          </div>

          {trend && (
            <span
              className="stat-trend"
              style={{
                color: trendUp ? "#059669" : "#DC2626",
                background: trendUp ? "#ECFDF5" : "#FEF2F2",
              }}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
        </div>

        <div className="stat-value">{value ?? "--"}</div>
        <div className="stat-title">{title}</div>
        {subtitle && <div className="stat-sub">{subtitle}</div>}
      </div>
    </>
  );
};

export default StatCard;
