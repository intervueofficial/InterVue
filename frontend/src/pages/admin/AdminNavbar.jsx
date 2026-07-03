import { Menu, Bell, Search, CalendarDays } from "lucide-react";
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

  const pageTitle = titles[location.pathname] || "Admin";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
          font-size:23px;
          font-weight:700;
          letter-spacing:-.3px;
          color:#2563EB;
        }

        .date{
          color:#64748B;
          font-size:12.5px;
          margin-top:3px;
          font-weight:500;
        }

        .nav-right{
          display:flex;
          align-items:center;
          gap:14px;
        }

        .search-box{
          width:300px;
          height:44px;
          display:flex;
          align-items:center;
          gap:10px;
          padding:0 16px;
          border-radius:12px;
          background:#fff;
          border:1px solid #E2E8F0;
          transition:.2s ease;
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
          font-size:13.5px;
          color:#0F172A;
        }

        .search-box svg{
          color:#94A3B8;
        }

        .icon-btn{
          width:44px;
          height:44px;
          border-radius:12px;
          border:1px solid #E2E8F0;
          background:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          color:#475569;
          transition:.2s ease;
        }

        .icon-btn:hover{
          border-color:#2563EB;
          color:#2563EB;
          box-shadow:0 4px 14px rgba(37,99,235,.16);
          transform:translateY(-1px);
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
            font-size:19px;
          }
        }
      `}</style>

      <header className="navbar">
        <div className="nav-left">
          <Menu className="menu-btn" onClick={() => setSidebarOpen(true)} />

          <div>
            <div className="page-title">{pageTitle}</div>
            <div className="date">{today}</div>
          </div>
        </div>

        <div className="nav-right">
          <div className="search-box">
            <Search size={17} />
            <input type="text" placeholder="Search..." />
          </div>

          <button className="icon-btn">
            <CalendarDays size={17} />
          </button>

          <button className="icon-btn">
            <Bell size={17} />
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