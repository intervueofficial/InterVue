import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PencilIcon,
  Trash2Icon,
  FlaskConicalIcon,
  BookOpenIcon,
} from "lucide-react";

import { problemApi } from "../api/problemApi";
import useAuthUser from "../hooks/useAuthUser";
import { executeCode } from "../lib/piston";
import AppShell from "../components/AppShell";
import ProblemForm from "./admin/ProblemForm";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import { THEME, DIFFICULTY } from "../constants/theme";

function DifficultyBadge({ difficulty }) {
  const d = DIFFICULTY[difficulty?.toLowerCase()] || DIFFICULTY.medium;
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: d.bg, color: d.text, boxShadow: `inset 0 0 0 1px ${d.border}` }}
    >
      {difficulty}
    </span>
  );
}

const ProblemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();

  // This page is shared: interviewers reach it from /problems, and now
  // candidates can reach it from the Mock Interview practice hub too —
  // so the sidebar shown around it should match whoever's actually here.
  const shellScope = authUser?.role === "candidate" ? "candidate" : "interviewer";

  const [tab, setTab] = useState("description");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["problem", id],
    queryFn: () => problemApi.getProblem(id),
  });

  const problem = data?.problem;

  useEffect(() => {
    setCode(problem?.starterCode || "");
  }, [problem?._id]);

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const result = await executeCode(selectedLanguage, code);
      setOutput(result);
    } catch (error) {
      setOutput({ success: false, error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${problem.title}"?`);
    if (!confirmed) return;

    try {
      const token = await getToken();
      await problemApi.deleteProblem(problem._id, token);
      toast.success("Problem deleted");
      navigate("/problems");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete problem");
    }
  };

  const isOwner = problem?.createdBy?._id === authUser?._id;
  const backTo = authUser?.role === "candidate" ? "/bot" : "/problems";

  if (isLoading) {
    return (
      <AppShell scope={shellScope}>
        <div className="flex justify-center py-24">
          <span className="loading loading-spinner loading-lg" style={{ color: THEME.primary }}></span>
        </div>
      </AppShell>
    );
  }

  if (!problem) {
    return (
      <AppShell scope={shellScope}>
        <div className="text-center py-24" style={{ color: THEME.inkMuted }}>
          Problem not found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell scope={shellScope}>
      <div className="flex flex-col" style={{ height: "calc(100vh - 112px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${THEME.border}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(backTo)}
              className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ border: `1px solid ${THEME.border}`, color: THEME.inkMuted }}
            >
              <ArrowLeftIcon size={15} />
            </button>
            <h1 className="truncate" style={{ fontFamily: THEME.fontDisplay, fontSize: 18, fontWeight: 600, color: THEME.ink }}>
              {problem.title}
            </h1>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-md"
                style={{ border: `1px solid ${THEME.border}`, color: THEME.ink }}
              >
                <PencilIcon size={13} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-md"
                style={{ background: THEME.dangerTint, color: THEME.danger }}
              >
                <Trash2Icon size={13} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden mt-4 rounded-xl" style={{ border: `1px solid ${THEME.border}` }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={42} minSize={28}>
              <div className="h-full flex flex-col" style={{ background: THEME.surface }}>
                <div className="flex items-center gap-1 px-3 pt-3 flex-shrink-0">
                  <button
                    onClick={() => setTab("description")}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-md"
                    style={{
                      background: tab === "description" ? THEME.primaryTint : "transparent",
                      color: tab === "description" ? THEME.primary : THEME.inkMuted,
                    }}
                  >
                    <BookOpenIcon size={12} />
                    Description
                  </button>
                  <button
                    onClick={() => setTab("tests")}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-md"
                    style={{
                      background: tab === "tests" ? THEME.primaryTint : "transparent",
                      color: tab === "tests" ? THEME.primary : THEME.inkMuted,
                    }}
                  >
                    <FlaskConicalIcon size={12} />
                    Test Cases
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {tab === "description" ? (
                    <>
                      <div className="flex items-center gap-1.5 flex-wrap mb-4">
                        {problem.tags?.map((tag) => (
                          <span key={tag} className="text-[11px]" style={{ color: THEME.inkFaint }}>#{tag}</span>
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: THEME.inkMuted }}>
                        {problem.description}
                      </p>
                    </>
                  ) : (problem.testCases?.length > 0 ? (
                    <div className="space-y-3">
                      {problem.testCases.map((tc, i) => (
                        <div key={i} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${THEME.border}` }}>
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: THEME.surface2, color: THEME.inkFaint, fontFamily: THEME.fontMono }}>
                            Case {i + 1}
                          </div>
                          <div className="p-3 text-[12.5px]" style={{ fontFamily: THEME.fontMono }}>
                            <div className="flex gap-2 mb-1.5">
                              <span style={{ color: THEME.primary, fontWeight: 700, minWidth: 55 }}>Input:</span>
                              <span style={{ color: THEME.ink }}>{tc.input}</span>
                            </div>
                            <div className="flex gap-2">
                              <span style={{ color: THEME.success, fontWeight: 700, minWidth: 55 }}>Output:</span>
                              <span style={{ color: THEME.ink }}>{tc.expectedOutput}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs mt-3" style={{ color: THEME.inkFaint }}>
                        Compare these against your code's output manually — running code checks that it executes, it doesn't auto-grade correctness.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: THEME.inkFaint }}>No test cases were added for this problem.</p>
                  ))}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle style={{ width: 4, background: THEME.border }} />

            <Panel defaultSize={58} minSize={35}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={65} minSize={30}>
                  <CodeEditorPanel
                    selectedLanguage={selectedLanguage}
                    code={code}
                    isRunning={isRunning}
                    onLanguageChange={(e) => setSelectedLanguage(e.target.value)}
                    onCodeChange={(value) => setCode(value || "")}
                    onRunCode={handleRunCode}
                  />
                </Panel>
                <PanelResizeHandle style={{ height: 4, background: THEME.border }} />
                <Panel defaultSize={35} minSize={15}>
                  <OutputPanel output={output} />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>

      {showEditForm && (
        <ProblemForm
          problem={problem}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["problem", id] })}
        />
      )}
    </AppShell>
  );
};

export default ProblemPage;
