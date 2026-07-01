import { Navigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { data: user, isLoading } = useAuthUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleProtectedRoute;