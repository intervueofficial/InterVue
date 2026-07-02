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
          background:#F8FAFC;
          font-family:Inter,system-ui,sans-serif;
        }

        .admin-layout{
          display:flex;
          min-height:100vh;
          background:#F8FAFC;
        }

        .admin-sidebar{
          width:280px;
          min-width:280px;
          background:linear-gradient(180deg,#0F4CFF 0%,#0A2FA8 100%);
          color:white;
          position:fixed;
          left:0;
          top:0;
          bottom:0;
          z-index:1000;
          transition:.3s;
          box-shadow:
          8px 0 40px rgba(0,0,0,.08);
        }

        .admin-content{
          flex:1;
          margin-left:280px;
          display:flex;
          flex-direction:column;
          min-height:100vh;
        }

        .admin-navbar{
          position:sticky;
          top:0;
          z-index:999;
          height:72px;

          background:rgba(255,255,255,.82);

          backdrop-filter:blur(18px);

          border-bottom:1px solid #E5E7EB;
        }

        .admin-page{
          flex:1;
          padding:32px;
          background:#F8FAFC;
        }

        @media(max-width:992px){

          .admin-sidebar{
            transform:translateX(-100%);
          }

          .admin-sidebar.open{
            transform:translateX(0);
          }

          .admin-content{
            margin-left:0;
          }

        }

      `}</style>

      <div className="admin-layout">

        <aside
          className={`admin-sidebar ${
            sidebarOpen ? "open" : ""
          }`}
        >
          <AdminSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </aside>

        <main className="admin-content">

          <header className="admin-navbar">
            <AdminNavbar
              setSidebarOpen={setSidebarOpen}
            />
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