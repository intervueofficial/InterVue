import {
  LayoutDashboard,
  Users,
  Code2,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { ClipboardList } from "lucide-react";

const menu = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    name: "Problems",
    icon: Code2,
    path: "/admin/problems",
  },
  {
    name: "Quiz",
    icon: ClipboardList,
    path: "/admin/quiz",
  },
  {
    name: "Users",
    icon: Users,
    path: "/admin/users",
  },
  {
    name: "Sessions",
    icon: CalendarDays,
    path: "/admin/sessions",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    path: "/admin/analytics",
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/admin/settings",
  },
];

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <>
      <style>{`
        .sidebar-container{
          display:flex;
          flex-direction:column;
          height:100%;
          padding:26px 16px;
          position:relative;
        }

        /* ── Logo ─────────────────────────────────────────── */
        .logo{
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom:36px;
          padding:0 6px;
          min-height:36px;
        }

        .logo-mark{
          width:36px;
          height:36px;
          min-width:36px;
          border-radius:10px;
          background:rgba(255,255,255,.16);
          border:1px solid rgba(255,255,255,.22);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:14px;
          font-weight:800;
          letter-spacing:.3px;
          color:#fff;
        }

        .logo-word{
          font-size:20px;
          font-weight:700;
          letter-spacing:.2px;
          color:#fff;
          white-space:nowrap;
          overflow:hidden;
          max-width:0;
          opacity:0;
          transition:max-width .32s cubic-bezier(.4,0,.2,1), opacity .22s ease;
        }

        .admin-sidebar:hover .logo-word,
        .admin-sidebar.mobile-open .logo-word{
          max-width:160px;
          opacity:1;
        }

        /* ── Nav ──────────────────────────────────────────── */
        .nav-links{
          display:flex;
          flex-direction:column;
          gap:6px;
        }

        .nav-item{
          display:flex;
          align-items:center;
          gap:14px;
          text-decoration:none;
          color:rgba(255,255,255,.78);
          padding:12px;
          border-radius:12px;
          transition:background .2s ease, color .2s ease, transform .15s ease;
          font-size:14.5px;
          font-weight:500;
        }

        .nav-item svg{
          width:20px;
          height:20px;
          min-width:20px;
          flex-shrink:0;
        }

        .nav-label{
          white-space:nowrap;
          overflow:hidden;
          max-width:0;
          opacity:0;
          transition:max-width .32s cubic-bezier(.4,0,.2,1), opacity .18s ease;
        }

        .admin-sidebar:hover .nav-label,
        .admin-sidebar.mobile-open .nav-label{
          max-width:160px;
          opacity:1;
        }

        .nav-item:hover{
          background:rgba(255,255,255,.10);
          color:#fff;
        }

        .nav-item.active{
          background:#fff;
          color:#2563EB;
          box-shadow:0 10px 24px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.08);
        }

        /* ── Footer ───────────────────────────────────────── */
        .sidebar-footer{
          margin-top:auto;
          border-top:1px solid rgba(255,255,255,.14);
          padding-top:20px;
          display:flex;
          align-items:center;
        }

        .profile{
          display:flex;
          align-items:center;
          gap:12px;
          overflow:hidden;
        }

        .profile-text{
          color:white;
          font-size:13.5px;
          white-space:nowrap;
          overflow:hidden;
          max-width:0;
          opacity:0;
          transition:max-width .32s cubic-bezier(.4,0,.2,1), opacity .18s ease;
        }

        .admin-sidebar:hover .profile-text,
        .admin-sidebar.mobile-open .profile-text{
          max-width:160px;
          opacity:1;
        }

        .profile-text p{
          margin:0;
          font-weight:600;
        }

        .profile-text span{
          color:rgba(255,255,255,.6);
          font-size:11.5px;
        }

        .close-btn{
          display:none;
          position:absolute;
          top:22px;
          right:18px;
          cursor:pointer;
          color:white;
        }

        @media(max-width:992px){
          .close-btn{
            display:block;
          }
        }
      `}</style>

      <div className="sidebar-container">
        <ChevronLeft className="close-btn" onClick={() => setSidebarOpen(false)} />

        <div className="logo">
          <div className="logo-mark">IV</div>
          <span className="logo-word">InterVue</span>
        </div>

        <div className="nav-links">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon />
                <span className="nav-label">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="profile">
            <UserButton afterSignOutUrl="/" />
            <div className="profile-text">
              <p>Administrator</p>
              <span>InterVue Platform</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;