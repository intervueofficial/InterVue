import { ArrowUpRight } from "lucide-react";

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "#2563EB",
  onClick,
}) => {
  return (
    <>
      <style>{`
        .stat-card{
          background:#fff;
          border:1px solid #E2E8F0;
          border-radius:22px;
          padding:26px;
          transition:.25s;
          cursor:pointer;
          position:relative;
          overflow:hidden;
          min-height:170px;
        }

        .stat-card:hover{
          transform:translateY(-4px);
          box-shadow:0 20px 45px rgba(15,23,42,.08);
          border-color:#CBD5E1;
        }

        .stat-top{
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .icon-box{
          width:54px;
          height:54px;
          border-radius:16px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:rgba(37,99,235,.08);
        }

        .stat-title{
          margin-top:18px;
          font-size:15px;
          color:#64748B;
          font-weight:500;
        }

        .stat-value{
          margin-top:12px;
          font-size:34px;
          font-weight:700;
          color:#0F172A;
        }

        .stat-sub{
          margin-top:10px;
          color:#94A3B8;
          font-size:14px;
          line-height:1.6;
        }

        .arrow{
          color:#CBD5E1;
        }
      `}</style>

      <div className="stat-card" onClick={onClick}>

        <div className="stat-top">

          <div
            className="icon-box"
            style={{ background: `${color}15` }}
          >
            {Icon && <Icon color={color} size={24} />}
          </div>

          <ArrowUpRight
            className="arrow"
            size={18}
          />

        </div>

        <div className="stat-title">
          {title}
        </div>

        <div className="stat-value">
          {value ?? "--"}
        </div>

        <div className="stat-sub">
          {subtitle}
        </div>

      </div>
    </>
  );
};

export default StatCard;