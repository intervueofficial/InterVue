import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <style>{`
        *{
          box-sizing:border-box;
        }

        html,body,#root{
          margin:0;
          padding:0;
          width:100%;
          height:100%;
          background:#EFF6FF;
          font-family:Inter,system-ui,sans-serif;
        }

        .admin-layout{
          display:flex;
          min-height:100vh;
          background:#EFF6FF;
        }

        /* ── Sidebar: collapsed icon-rail by default, expands on hover ── */
        .admin-sidebar{
          width:88px;
          min-width:88px;
          background:linear-gradient(180deg,#2563EB 0%,#1E3A8A 100%);
          color:white;
          position:fixed;
          left:0;
          top:0;
          bottom:0;
          z-index:1000;
          overflow:hidden;
          transition:width .32s cubic-bezier(.4,0,.2,1);
          box-shadow:4px 0 24px rgba(15,23,42,.10);
        }

        .admin-sidebar:hover{
          width:280px;
          box-shadow:12px 0 40px rgba(15,23,42,.18);
        }

        /* content never shifts -- the expanded sidebar floats above it */
        .admin-content{
          flex:1;
          margin-left:88px;
          display:flex;
          flex-direction:column;
          min-height:100vh;
        }

        .admin-navbar{
          position:sticky;
          top:0;
          z-index:900;
          height:72px;
          background:rgba(255,255,255,.82);
          backdrop-filter:blur(18px);
          border-bottom:1px solid #E2E8F0;
        }

        .admin-page{
          flex:1;
          padding:32px;
          background:#EFF6FF;
        }

        @media(max-width:992px){
          .admin-sidebar{
            width:280px;
            transform:translateX(-100%);
            transition:transform .3s cubic-bezier(.4,0,.2,1);
          }

          .admin-sidebar.mobile-open{
            transform:translateX(0);
          }

          .admin-sidebar:hover{
            width:280px;
            box-shadow:4px 0 24px rgba(15,23,42,.10);
          }

          .admin-content{
            margin-left:0;
          }
        }
      `}</style>

      <div className="admin-layout">
        <aside className={`admin-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
          <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </aside>

        <main className="admin-content">
          <header className="admin-navbar">
            <AdminNavbar setSidebarOpen={setSidebarOpen} />
          </header>

          <section className="admin-page">
            <Outlet />
          </section>
        </main>
      </div>
    </>
  );
};

export default AdminLayout;