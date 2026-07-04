import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useEndSession,
  useJoinSession,
  useSessionById,
} from "../hooks/useSessions";
import useAuthUser from "../hooks/useAuthUser";
import { executeCode } from "../lib/piston";
import useStreamClient from "../hooks/useStreamClient";
import { useAuth } from "@clerk/clerk-react";

import useScreenRecorder from "../hooks/session/useScreenRecorder";
import InterviewerLayout from "../components/session/InterviewerLayout";
import CandidateLayout from "../components/session/CandidateLayout";

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const { data: authUser } = useAuthUser();

  // `role` drives which layout renders. It's seeded from the signed-in
  // user's real platform role as soon as it loads (RoleSwitcher in the
  // top bars is a leftover dev-preview toggle, left in place but no
  // longer the source of truth for real sessions).
  const [role, setRole] = useState("candidate");
  const [activePage, setActivePage] = useState("problem");

  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  const recorder = useScreenRecorder();

  const {
    data: sessionData,
    isLoading: loadingSession,
    refetch,
  } = useSessionById(id);
  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();

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
  const { call, channel, chatClient, isInitializingCall, streamClient } =
    useStreamClient(session, loadingSession, isHost, isParticipant);

  const participantCount = call?.state?.remoteParticipants?.length + 1 || 1;

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

  const handleEndSession = async () => {
    if (!confirm("End this session?")) return;

    console.log("Starting end session...");

    try {
      await endSessionMutation.mutateAsync(id);

      console.log("Mutation finished");

      // wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Now navigating");

      navigate("/dashboard");
    } catch (e) {
      console.error(e);
    }
  };

  /* ── INTERVIEWER LAYOUT ── */
  if (role === "interviewer") {
    return (
      <InterviewerLayout
        session={session}
        role={role}
        setRole={setRole}
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
      role={role}
      setRole={setRole}
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
