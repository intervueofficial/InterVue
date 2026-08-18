import { useUser } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import useAuthUser from "./hooks/useAuthUser";
import useSyncRole from "./hooks/useSyncRole";
import { THEME } from "./constants/theme";
import AppLoader from "./components/AppLoader";

// Landing
import HomePage from "./pages/HomePage";
import MockInterviewPage from "./pages/MockInterviewPage";

// Authentication (custom OTP-gated sign-in/sign-up — see SignInPage/SignUpPage)
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

// Interviewer
import DashboardPage from "./pages/DashboardPage";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemPage from "./pages/ProblemPage";
import SessionPage from "./pages/SessionPage";
import QuizePage from "./pages/QuizePage";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Problems from "./pages/admin/Problems";
import Quiz from "./pages/admin/Quiz";
import Users from "./pages/admin/Users";
import Sessions from "./pages/Sessions";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import AdminJobs from "./pages/admin/Jobs";
import Billing from "./pages/admin/Billing";
import Pipeline from "./pages/admin/Pipeline";
import AuditLog from "./pages/admin/AuditLog";
import EmailTemplates from "./pages/admin/EmailTemplates";
import SystemHealth from "./pages/admin/SystemHealth";

// Candidate
import CandidateDashboard from "./pages/candidate/Dashboard";
import MyInterviews from "./pages/candidate/MyInterviews";
import Results from "./pages/candidate/Results";
import CandidateJobs from "./pages/candidate/Jobs";
import CandidateProfile from "./pages/candidate/Profile";

// Interviewer (job applicants)
import Applicants from "./pages/interviewer/Applicants";
import Waitlist from "./pages/interviewer/Waitlist";

function App() {
  const { isLoaded, isSignedIn } = useUser();

  useSyncRole();

  const {
    data: authUser,
    isLoading,
    isError,
  } = useAuthUser();

  if (!isLoaded) {
    return <AppLoader fullScreen label="" />;
  }

  if (isSignedIn && isLoading) {
    return <AppLoader fullScreen label="" />;
  }

  if (isSignedIn && (isError || !authUser)) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: THEME.background, fontFamily: THEME.fontSans }}
      >
        <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 20, fontWeight: 600, color: THEME.ink }}>
          Unable to load your account
        </h2>

        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
          style={{ background: THEME.ink, color: THEME.surface }}
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

  const dashboard = dashboardRoutes[role] || "/";

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

        {/* Authentication */}

        <Route
          path="/sign-in/*"
          element={
            !isSignedIn ? <SignInPage /> : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/sign-up/*"
          element={
            !isSignedIn ? <SignUpPage /> : <Navigate replace to={dashboard} />
          }
        />

        {/* Mock Interview — in production, /bot is proxied at the Vercel
            edge (see vercel.json) to a separately-deployed bot app;
            that rewrite only fires on a genuine full-page navigation,
            which is why the landing page button and the sidebar link
            both use a real <a href> instead of client-side routing.
            This route only ever renders as a fallback when there's no
            such rewrite in front of it — e.g. running locally with
            `npm run dev`, where vercel.json has no effect. */}
        <Route
          path="/bot"
          element={
            isSignedIn
              ? <MockInterviewPage />
              : <Navigate replace to="/sign-in" />
          }
        />

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin"
          element={
            role === "admin"
              ? <AdminLayout />
              : <Navigate replace to={dashboard} />
          }
        >
          <Route
            index
            element={<Navigate to="dashboard" replace />}
          />

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="problems"
            element={<Problems />}
          />

          <Route
            path="quiz"
            element={<Quiz />}
          />

          <Route
            path="users"
            element={<Users />}
          />

          <Route
            path="sessions"
            element={<Sessions />}
          />

          <Route
            path="analytics"
            element={<Analytics />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />

          <Route
            path="jobs"
            element={<AdminJobs />}
          />

          <Route
            path="billing"
            element={<Billing />}
          />

          <Route
            path="pipeline"
            element={<Pipeline />}
          />

          <Route
            path="audit-log"
            element={<AuditLog />}
          />

          <Route
            path="email-templates"
            element={<EmailTemplates />}
          />

          <Route
            path="system-health"
            element={<SystemHealth />}
          />
        </Route>

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
            role === "interviewer" || role === "candidate"
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

        <Route
          path="/sessions"
          element={
            role === "interviewer"
              ? <Sessions />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/applicants"
          element={
            role === "interviewer"
              ? <Applicants />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/waitlist"
          element={
            role === "interviewer"
              ? <Waitlist />
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
          path="/candidate/sessions"
          element={
            role === "candidate"
              ? <Sessions />
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

        <Route
          path="/candidate/jobs"
          element={
            role === "candidate"
              ? <CandidateJobs />
              : <Navigate replace to={dashboard} />
          }
        />

        <Route
          path="/candidate/profile"
          element={
            role === "candidate"
              ? <CandidateProfile />
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