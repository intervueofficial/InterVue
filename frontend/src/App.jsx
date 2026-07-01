import { useUser, SignIn, SignUp } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";

import useAuthUser from "./hooks/useAuthUser";

import HomePage from "./pages/HomePage";

// Interviewer
import DashboardPage from "./pages/DashboardPage";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemPage from "./pages/ProblemPage";
import SessionPage from "./pages/SessionPage";
import QuizePage from "./pages/QuizePage";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";
import Users from "./pages/admin/Users";
import Sessions from "./pages/admin/Sessions";

// Candidate
import CandidateDashboard from "./pages/candidate/Dashboard";
import MyInterviews from "./pages/candidate/MyInterviews";
import Results from "./pages/candidate/Results";

function App() {
  const { isLoaded, isSignedIn } = useUser();

  const {
    data: authUser,
    isLoading,
    isError,
  } = useAuthUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (isSignedIn && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (isSignedIn && (isError || !authUser)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">
          Unable to load your account
        </h2>

        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const role = authUser?.role;

  const dashboardRoutes = {
    admin: "/admin/dashboard",
    interviewer: "/dashboard",
    candidate: "/candidate/dashboard",
  };

  const dashboard =
    dashboardRoutes[role] || "/";

  return (
    <>
      <Routes>

        {/* Landing */}

        <Route
          path="/"
          element={
            isSignedIn
              ? <Navigate replace to={dashboard} />
              : <HomePage />
          }
        />

        {/* Clerk */}

        <Route
          path="/sign-in/*"
          element={
            !isSignedIn
              ? (
                <div className="min-h-screen flex items-center justify-center">
                  <SignIn
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    forceRedirectUrl={dashboard}
                  />
                </div>
              )
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/sign-up/*"
          element={
            !isSignedIn
              ? (
                <div className="min-h-screen flex items-center justify-center">
                  <SignUp
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    forceRedirectUrl={dashboard}
                  />
                </div>
              )
              : <Navigate replace to={dashboard} />
          }
        />

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin/dashboard"
          element={
            role === "admin"
              ? <AdminDashboard />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/admin/users"
          element={
            role === "admin"
              ? <Users />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/admin/sessions"
          element={
            role === "admin"
              ? <Sessions />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/admin/analytics"
          element={
            role === "admin"
              ? <Analytics />
              : <Navigate replace to={dashboard} />
          }
        />

        {/* ================= INTERVIEWER ================= */}

        <Route
          path="/dashboard"
          element={
            role === "interviewer"
              ? <DashboardPage />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/problems"
          element={
            role === "interviewer"
              ? <ProblemsPage />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/problem/:id"
          element={
            role === "interviewer"
              ? <ProblemPage />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/session/:id"
          element={
            role === "interviewer"
              ? <SessionPage />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/quiz"
          element={
            role === "interviewer"
              ? <QuizePage />
              : <Navigate replace to={dashboard} />
          }
        />

        {/* ================= CANDIDATE ================= */}

        <Route
          path="/candidate/dashboard"
          element={
            role === "candidate"
              ? <CandidateDashboard />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/candidate/interviews"
          element={
            role === "candidate"
              ? <MyInterviews />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/candidate/results"
          element={
            role === "candidate"
              ? <Results />
              : <Navigate replace to={dashboard} />
          }
        />

        {/* 404 */}

        <Route
          path="*"
          element={<Navigate replace to="/" />}
        />

      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />
    </>
  );
}

export default App;