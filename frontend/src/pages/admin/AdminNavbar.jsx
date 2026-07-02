import {
  Menu,
  Bell,
  Search,
  CalendarDays,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";

const titles = {
  "/admin/dashboard": "Dashboard",
  "/admin/problems": "Coding Problems",
  "/admin/users": "Users",
  "/admin/sessions": "Interview Sessions",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

const AdminNavbar = ({ setSidebarOpen }) => {
  const location = useLocation();

  const pageTitle =
    titles[location.pathname] || "Admin";

  const today = new Date().toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <>
      <style>{`
        .navbar{
          height:72px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:0 32px;
          background:rgba(255,255,255,.82);
          backdrop-filter:blur(18px);
          border-bottom:1px solid #E5E7EB;
        }

        .nav-left{
          display:flex;
          align-items:center;
          gap:18px;
        }

        .menu-btn{
          display:none;
          cursor:pointer;
          color:#2563EB;
        }

        .page-title{
          font-size:24px;
          font-weight:700;
          color:#0F172A;
        }

        .date{
          color:#64748B;
          font-size:13px;
          margin-top:3px;
        }

        .nav-right{
          display:flex;
          align-items:center;
          gap:18px;
        }

        .search-box{
          width:320px;
          height:46px;
          display:flex;
          align-items:center;
          gap:10px;
          padding:0 16px;
          border-radius:14px;
          background:white;
          border:1px solid #E5E7EB;
          transition:.25s;
        }

        .search-box:focus-within{
          border-color:#2563EB;
          box-shadow:0 0 0 4px rgba(37,99,235,.12);
        }

        .search-box input{
          flex:1;
          border:none;
          outline:none;
          background:transparent;
          font-size:14px;
          color:#0F172A;
        }

        .search-box svg{
          color:#94A3B8;
        }

        .icon-btn{
          width:46px;
          height:46px;
          border-radius:14px;
          border:1px solid #E5E7EB;
          background:white;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          transition:.25s;
        }

        .icon-btn:hover{
          border-color:#2563EB;
          color:#2563EB;
          transform:translateY(-2px);
        }

        @media(max-width:992px){

          .menu-btn{
            display:block;
          }

          .search-box{
            display:none;
          }

          .navbar{
            padding:0 18px;
          }

          .page-title{
            font-size:20px;
          }

        }

      `}</style>

      <header className="navbar">

        <div className="nav-left">

          <Menu
            className="menu-btn"
            onClick={() => setSidebarOpen(true)}
          />

          <div>

            <div className="page-title">
              {pageTitle}
            </div>

            <div className="date">
              {today}
            </div>

          </div>

        </div>

        <div className="nav-right">

          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search..."
            />

          </div>

          <button className="icon-btn">
            <CalendarDays size={18} />
          </button>

          <button className="icon-btn">
            <Bell size={18} />
          </button>

          <UserButton
            appearance={{
              elements: {
                avatarBox: {
                  width: 42,
                  height: 42,
                },
              },
            }}
          />

        </div>

      </header>
    </>
  );
};

export default AdminNavbar;