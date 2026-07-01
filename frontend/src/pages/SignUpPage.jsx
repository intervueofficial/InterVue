import { Navigate } from "react-router-dom";
import {
  SignUp,
  useAuth,
} from "@clerk/clerk-react";
import useAuthUser from "../hooks/useAuthUser";

const SignUpPage = () => {
  const { isSignedIn } = useAuth();

  const { data: user, isLoading } = useAuthUser();

  if (isSignedIn && !isLoading && user) {
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;

      case "interviewer":
        return <Navigate to="/dashboard" replace />;

      case "candidate":
        return <Navigate to="/candidate/dashboard" replace />;

      default:
        return <Navigate to="/select-role" replace />;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="w-full max-w-md">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
};

export default SignUpPage;