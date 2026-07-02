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

const AdminSidebar = ({
  sidebarOpen,
  setSidebarOpen,
}) => {
  return (
    <>
      <style>{`
        .sidebar-container{
          display:flex;
          flex-direction:column;
          height:100%;
          padding:28px 18px;
        }

        .logo{
          font-size:24px;
          font-weight:700;
          letter-spacing:.5px;
          color:#fff;
          margin-bottom:40px;
          padding:0 10px;
        }

        .nav-links{
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        .nav-item{
          display:flex;
          align-items:center;
          gap:14px;
          text-decoration:none;
          color:rgba(255,255,255,.82);
          padding:14px 16px;
          border-radius:14px;
          transition:.25s ease;
          font-size:15px;
          font-weight:500;
        }

        .nav-item svg{
          width:20px;
          height:20px;
        }

        .nav-item:hover{
          background:rgba(255,255,255,.10);
          color:#fff;
        }

        .nav-item.active{
          background:#fff;
          color:#0F4CFF;
          box-shadow:
          0 10px 30px rgba(0,0,0,.12);
        }

        .sidebar-footer{
          margin-top:auto;
          border-top:1px solid rgba(255,255,255,.15);
          padding-top:22px;
          display:flex;
          align-items:center;
          justify-content:space-between;
        }

        .profile{
          display:flex;
          align-items:center;
          gap:12px;
        }

        .profile-text{
          color:white;
          font-size:14px;
        }

        .profile-text p{
          margin:0;
          font-weight:600;
        }

        .profile-text span{
          color:rgba(255,255,255,.65);
          font-size:12px;
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

        <ChevronLeft
          className="close-btn"
          onClick={() => setSidebarOpen(false)}
        />

        <div className="logo">
          InterVue
        </div>

        <div className="nav-links">

          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon />

                {item.name}
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