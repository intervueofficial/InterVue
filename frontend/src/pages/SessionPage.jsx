import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useEndSession,
  useJoinSession,
  useSessionById,
  useSubmitCodeResult,
} from "../hooks/useSessions";
import useAuthUser from "../hooks/useAuthUser";
import { executeCode } from "../lib/piston";
import useStreamClient from "../hooks/useStreamClient";
import { useAuth } from "@clerk/clerk-react";

import useScreenRecorder from "../hooks/session/useScreenRecorder";
import InterviewerLayout from "../components/session/InterviewerLayout";
import CandidateLayout from "../components/session/CandidateLayout";
import { applicationApi } from "../api/applicationApi";
import SessionDecisionModal from "../components/SessionDecisionModal";

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const { data: authUser } = useAuthUser();

  // `role` drives which layout renders. It's seeded from the signed-in
  // user's real platform role as soon as it loads. There used to be a
  // manual role-switcher dropdown in the top bars for dev-preview
  // purposes; it's been removed since it let real users flip their own
  // rendered layout to the other role's view mid-interview.
  const [role, setRole] = useState("candidate");
  const [activePage, setActivePage] = useState("problem");

  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);
  // Separate from gradingResult (which just drives the small persistent
  // badge) — this holds the *same* data but is what triggers the popup,
  // and gets set to a fresh object every submission so the modal reopens
  // even for back-to-back submissions with an identical pass/total.
  const [gradingPopup, setGradingPopup] = useState(null);

  const [decisionApplication, setDecisionApplication] = useState(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const recorder = useScreenRecorder();

  const {
    data: sessionData,
    isLoading: loadingSession,
    refetch,
  } = useSessionById(id);
  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();
  const submitCodeResultMutation = useSubmitCodeResult(id);

  const session = sessionData?.session;

  useEffect(() => {
    if (authUser?.role === "interviewer" || authUser?.role === "candidate") {
      setRole(authUser.role);
    }
  }, [authUser]);

  // Session.interviewer / Session.candidate are populated with clerkId
  // by the backend (see getSessionById / joinSession).
  const isHost = !!session?.interviewer && session.interviewer.clerkId === user?.id;
  const isParticipant = !!session?.candidate && session.candidate.clerkId === user?.id;

  const { getToken } = useAuth();
  const { call, channel, chatClient, isInitializingCall, streamClient, participantCount } =
    useStreamClient(session, loadingSession, isHost, isParticipant);

  const candidateStatus = participantCount > 1 ? "Connected" : "Waiting...";

  // Real, admin-created content pushed by the interviewer for this session.
  const problemData = session?.activeProblem || null;
  const quizData = session?.activeQuiz || null;

  /* Anti-cheat + fullscreen enforcement (candidate only) */
  useEffect(() => {
    if (role !== "candidate") return;
    let isTerminated = false;

    const terminate = async (reason) => {
      if (isTerminated) return;
      isTerminated = true;
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/terminate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            candidateId: user?.id,
            sessionId: session?._id,
            reason,
          }),
        });
      } catch (_) {}
      document.body.innerHTML = `
        <div style="height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#0F172A;color:white;font-family:sans-serif;">
          <h1 style="font-size:42px;margin-bottom:12px;">Interview Terminated</h1>
          <p style="font-size:18px;color:#CBD5E1;">Suspicious activity detected.</p>
          <p style="margin-top:20px;color:#94A3B8;">Redirecting to dashboard...</p>
        </div>`;
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2500);
    };

    const onKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J"].includes(e.key)) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        terminate("Developer tools detected");
      }
    };

    document.documentElement.requestFullscreen?.();

    const devInterval = setInterval(() => {
      if (
        window.outerWidth - window.innerWidth > 160 ||
        window.outerHeight - window.innerHeight > 160
      )
        terminate("Developer tools detected");
    }, 1000);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy", (e) => e.preventDefault());
    document.addEventListener("paste", (e) => e.preventDefault());
    document.addEventListener("cut", (e) => e.preventDefault());
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      clearInterval(devInterval);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [role, session, user]);

  /* Auto-join */
  useEffect(() => {
    if (!session || !user || loadingSession) return;
    if (isHost || isParticipant) return;
    joinSessionMutation.mutate(id, { onSuccess: refetch });
  }, [session, user, loadingSession, isHost, isParticipant, id]);

  /* Redirect on completion (participant) */
  useEffect(() => {
    if (!session || loadingSession) return;
    if (session.status === "completed" && !isHost) navigate("/dashboard");
  }, [session, loadingSession, navigate, isHost]);

  /* Sync code editor whenever a *new* problem is pushed */
  useEffect(() => {
    setCode(problemData?.starterCode || "");
    setOutput(null);
    setLastResult(null);
    setGradingResult(null);
  }, [problemData?._id]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
  };

  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setOutput(null);
      const result = await executeCode(selectedLanguage, code);
      setOutput(result);
      setLastResult({ success: result?.success ?? false });
    } catch (err) {
      setOutput({
        success: false,
        error: "Execution failed. Please try again.",
      });
      setLastResult({ success: false });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitForGrading = async () => {
    const testCases = problemData?.testCases || [];

    if (testCases.length === 0) {
      setOutput({
        success: false,
        error: "This problem has no test cases to grade against.",
      });
      return;
    }

    try {
      setIsGrading(true);

      // Graded server-side: the backend re-runs this exact code against
      // every test case (verified against the AI-generated reference
      // solution when the problem was created) and reports back the real
      // pass/fail result — the candidate can't just report a fake score.
      const response = await submitCodeResultMutation.mutateAsync({
        code,
        language: selectedLanguage,
      });

      const codeResult = response?.codeResult;
      if (codeResult) {
        setGradingResult({ passed: codeResult.passed, total: codeResult.total });
      }
      // Show the popup — the backend also returns a per-test-case
      // breakdown (input/expected/actual/passed) alongside the summary,
      // which the modal uses to explain a failure instead of just a count.
      setGradingPopup({
        passed: codeResult?.passed ?? 0,
        total: codeResult?.total ?? 0,
        results: response?.results || [],
      });
    } catch (err) {
      console.error("Failed to submit for grading:", err);
      setOutput({
        success: false,
        error:
          err?.response?.data?.message ||
          "Failed to grade your submission. Please try again.",
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm("End this session?")) return;

    try {
      await endSessionMutation.mutateAsync(id);

      // Only the interviewer decides — and only if this session came
      // from the job-application flow (has a linked Application).
      // Ad-hoc/practice sessions skip straight to the dashboard.
      if (role === "interviewer") {
        try {
          const token = await getToken();
          const { application } = await applicationApi.getApplicationBySession(id, token);

          if (application && application.finalDecision === "pending") {
            setDecisionApplication(application);
            setDecisionModalOpen(true);
            return;
          }
        } catch (lookupErr) {
          console.error("getApplicationBySession:", lookupErr);
        }
      }

      navigate("/dashboard");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecisionSubmit = async (decision, feedback, waitDays) => {
    try {
      setSubmittingDecision(true);
      const token = await getToken();
      await applicationApi.submitDecision(decisionApplication._id, decision, feedback, waitDays, token);
    } catch (err) {
      console.error("submitDecision:", err);
    } finally {
      setSubmittingDecision(false);
      setDecisionModalOpen(false);
      navigate("/dashboard");
    }
  };

  const handleDecisionSkip = () => {
    setDecisionModalOpen(false);
    navigate("/dashboard");
  };

  /* ── INTERVIEWER LAYOUT ── */
  if (role === "interviewer") {
    return (
      <>
        <InterviewerLayout
          session={session}
          handleEndSession={handleEndSession}
          endSessionMutation={endSessionMutation}
          recorder={recorder}
          activePage={activePage}
          setActivePage={setActivePage}
          streamClient={streamClient}
          call={call}
          chatClient={chatClient}
          channel={channel}
          isInitializingCall={isInitializingCall}
          candidateStatus={candidateStatus}
          isHost={isHost}
        />

        <SessionDecisionModal
          open={decisionModalOpen}
          application={decisionApplication}
          onSubmit={handleDecisionSubmit}
          onSkip={handleDecisionSkip}
          loading={submittingDecision}
        />
      </>
    );
  }

  /* ── CANDIDATE LAYOUT ── */
  return (
    <CandidateLayout
      session={session}
      isRunning={isRunning}
      lastResult={lastResult}
      selectedLanguage={selectedLanguage}
      handleLanguageChange={handleLanguageChange}
      handleRunCode={handleRunCode}
      handleSubmitForGrading={handleSubmitForGrading}
      isGrading={isGrading}
      gradingResult={gradingResult}
      gradingPopup={gradingPopup}
      onCloseGradingPopup={() => setGradingPopup(null)}
      activePage={activePage}
      setActivePage={setActivePage}
      problemData={problemData}
      quizData={quizData}
      loadingSession={loadingSession}
      code={code}
      setCode={setCode}
      output={output}
      streamClient={streamClient}
      call={call}
      chatClient={chatClient}
      channel={channel}
      isInitializingCall={isInitializingCall}
      isHost={isHost}
    />
  );
}

export default SessionPage;