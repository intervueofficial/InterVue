import { Outlet } from "react-router-dom";
import AppShell from "../../components/AppShell";

const AdminLayout = () => {
  return (
    <AppShell scope="admin">
      <Outlet />
    </AppShell>
  );
};

export default AdminLayout;
