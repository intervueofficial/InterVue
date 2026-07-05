import { useState, useRef, useEffect } from "react";
import { Menu, Bell, Search, CalendarDays, X } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";

const titles = {
  "/admin/dashboard": "Dashboard",
  "/admin/problems": "Coding Problems",
  "/admin/users": "Users",
  "/admin/sessions": "Interview Sessions",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

// Keyword -> route map used for quick search navigation
const searchRoutes = [
  { keywords: ["dashboard", "home", "overview"], path: "/admin/dashboard" },
  { keywords: ["problem", "problems", "coding", "questions"], path: "/admin/problems" },
  { keywords: ["user", "users", "candidate", "candidates", "interviewer", "interviewers"], path: "/admin/users" },
  { keywords: ["session", "sessions", "interview", "interviews"], path: "/admin/sessions" },
  { keywords: ["analytics", "stats", "statistics", "report", "reports"], path: "/admin/analytics" },
  { keywords: ["setting", "settings", "config", "configuration"], path: "/admin/settings" },
];

function resolveSearchRoute(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const exact = searchRoutes.find((r) => r.keywords.includes(q));
  if (exact) return exact.path;

  const partial = searchRoutes.find((r) =>
    r.keywords.some((k) => k.includes(q) || q.includes(k))
  );
  return partial ? partial.path : null;
}

const AdminNavbar = ({ setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notifRef = useRef(null);

  const pageTitle = titles[location.pathname] || "Admin";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [searchError, setSearchError] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    const match = resolveSearchRoute(searchValue);

    if (match) {
      setSearchError(false);
      navigate(match);
      setSearchValue("");
    } else {
      setSearchError(true);
      setTimeout(() => setSearchError(false), 1500);
    }
  };

  const clearSearch = () => setSearchValue("");

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

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

        .search-box.error{
          border-color:#EF4444;
          box-shadow:0 0 0 4px rgba(239,68,68,.12);
          animation: shake .35s ease;
        }

        @keyframes shake{
          0%,100%{ transform:translateX(0); }
          25%{ transform:translateX(-4px); }
          75%{ transform:translateX(4px); }
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
          flex-shrink:0;
        }

        .search-clear{
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .search-clear:hover svg{
          color:#475569;
        }

        .icon-btn{
          position:relative;
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

        .icon-btn.active{
          border-color:#2563EB;
          color:#2563EB;
          background:rgba(37,99,235,.06);
        }

        .notif-dot{
          position:absolute;
          top:8px;
          right:8px;
          width:8px;
          height:8px;
          border-radius:50%;
          background:#EF4444;
          border:2px solid #fff;
        }

        .notif-wrap{
          position:relative;
        }

        .notif-dropdown{
          position:absolute;
          top:54px;
          right:0;
          width:340px;
          max-height:400px;
          background:#fff;
          border:1px solid #E2E8F0;
          border-radius:14px;
          box-shadow:0 12px 32px rgba(15,23,42,.12);
          overflow:hidden;
          z-index:50;
          display:flex;
          flex-direction:column;
        }

        .notif-header{
          padding:14px 16px;
          border-bottom:1px solid #EEF2F7;
          display:flex;
          align-items:center;
          justify-content:space-between;
        }

        .notif-header-title{
          font-size:13.5px;
          font-weight:700;
          color:#0F172A;
        }

        .notif-mark-read{
          font-size:11.5px;
          font-weight:600;
          color:#2563EB;
          cursor:pointer;
          background:none;
          border:none;
        }

        .notif-mark-read:hover{
          text-decoration:underline;
        }

        .notif-list{
          overflow-y:auto;
        }

        .notif-item{
          padding:12px 16px;
          border-bottom:1px solid #F8FAFC;
          cursor:pointer;
          display:flex;
          gap:10px;
          align-items:flex-start;
          transition:background .15s ease;
        }

        .notif-item:hover{
          background:#F8FAFC;
        }

        .notif-item:last-child{
          border-bottom:none;
        }

        .notif-unread-dot{
          width:7px;
          height:7px;
          border-radius:50%;
          background:#2563EB;
          margin-top:5px;
          flex-shrink:0;
        }

        .notif-item.read .notif-unread-dot{
          background:transparent;
        }

        .notif-item-title{
          font-size:12.5px;
          font-weight:600;
          color:#0F172A;
        }

        .notif-item-time{
          font-size:11px;
          color:#94A3B8;
          margin-top:2px;
        }

        .notif-empty{
          padding:32px 16px;
          text-align:center;
          color:#94A3B8;
          font-size:12.5px;
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

          .notif-dropdown{
            width:290px;
            right:-60px;
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
          <form className="search-box" onSubmit={handleSearchSubmit}>
            <Search size={17} />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {searchValue && (
              <span className="search-clear" onClick={clearSearch}>
                <X size={15} />
              </span>
            )}
          </form>

          <button
            className="icon-btn"
            onClick={() => navigate("/admin/sessions")}
            title="Interview calendar"
          >
            <CalendarDays size={17} />
          </button>

          <div className="notif-wrap" ref={notifRef}>
            <button
              className={`icon-btn ${notifOpen ? "active" : ""}`}
              onClick={() => setNotifOpen((prev) => !prev)}
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span className="notif-header-title">Notifications</span>
                  {unreadCount > 0 && (
                    <button className="notif-mark-read" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${n.read ? "read" : ""}`}
                        onClick={() => handleNotifClick(n.id)}
                      >
                        <span className="notif-unread-dot" />
                        <div>
                          <div className="notif-item-title">{n.title}</div>
                          <div className="notif-item-time">{n.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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