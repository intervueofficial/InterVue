import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  PlusIcon,
  SearchIcon,
  ClipboardListIcon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  RotateCcwIcon,
} from "lucide-react";

import { quizApi } from "../api/quizApi";
import useAuthUser from "../hooks/useAuthUser";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import QuizForm from "./admin/QuizForm";
import { THEME, DIFFICULTY } from "../constants/theme";

function DifficultyBadge({ difficulty }) {
  const d = DIFFICULTY[difficulty?.toLowerCase()] || DIFFICULTY.medium;
  return (
    <span
      className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: d.bg, color: d.text, boxShadow: `inset 0 0 0 1px ${d.border}` }}
    >
      {difficulty}
    </span>
  );
}

/* ─── Solo quiz-taking view ─────────────────────────────────────────────── */
function QuizPractice({ quiz, onBack }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const questions = quiz.questions || [];

  const handleSelect = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => setSubmitted(true);
  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.correctAnswer).length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ border: `1px solid ${THEME.border}`, color: THEME.inkMuted }}
        >
          <ArrowLeftIcon size={15} />
        </button>
        <div>
          <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 20, fontWeight: 600, color: THEME.ink }}>
            {quiz.title}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: THEME.inkFaint }}>
            {questions.length} question{questions.length !== 1 ? "s" : ""} · {quiz.duration || 30} min
          </p>
        </div>
      </div>

      {submitted && (
        <div
          className="flex items-center gap-3 rounded-xl p-4"
          style={{ background: THEME.successTint, border: `1px solid ${THEME.successBorder}` }}
        >
          <CheckCircle2Icon size={20} color={THEME.success} />
          <div>
            <p className="font-semibold text-sm" style={{ color: THEME.ink }}>
              You scored {score} / {questions.length}
            </p>
            <p className="text-xs" style={{ color: THEME.inkMuted }}>
              {Math.round((score / questions.length) * 100)}% correct
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="ml-auto flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-md"
            style={{ border: `1px solid ${THEME.border}`, color: THEME.ink }}
          >
            <RotateCcwIcon size={13} />
            Retry
          </button>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, qIdx) => {
          const selected = answers[qIdx];

          return (
            <div key={qIdx} className="rounded-xl p-5" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
              <p className="font-medium text-sm mb-3" style={{ color: THEME.ink }}>
                {qIdx + 1}. {q.question}
              </p>

              <div className="space-y-2">
                {q.options?.map((opt, oIdx) => {
                  const isSelected = selected === oIdx;
                  const isCorrect = submitted && oIdx === q.correctAnswer;
                  const isWrongSelected = submitted && isSelected && oIdx !== q.correctAnswer;

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(qIdx, oIdx)}
                      disabled={submitted}
                      className="w-full text-left text-sm px-3.5 py-2.5 rounded-lg transition-colors"
                      style={{
                        border: `1px solid ${isCorrect ? THEME.successBorder : isWrongSelected ? THEME.dangerBorder : isSelected ? THEME.primaryTintBorder : THEME.border}`,
                        background: isCorrect ? THEME.successTint : isWrongSelected ? THEME.dangerTint : isSelected ? THEME.primaryTint : THEME.surface,
                        color: THEME.ink,
                        cursor: submitted ? "default" : "pointer",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {submitted && q.explanation && (
                <p className="text-xs mt-3 rounded-lg p-3" style={{ background: THEME.surface2, color: THEME.inkMuted }}>
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
          style={{ background: THEME.ink, color: THEME.surface }}
        >
          Submit Quiz
        </button>
      )}
    </div>
  );
}

/* ─── Quiz library view ──────────────────────────────────────────────────── */
function QuizCard({ quiz, isOwner, onOpen, onEdit, onDelete }) {
  return (
    <div
      className="rounded-xl p-5 transition-colors relative group cursor-pointer"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      onClick={() => onOpen(quiz)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-[15px] pr-12" style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}>
          {quiz.title}
        </h3>
        <DifficultyBadge difficulty={quiz.difficulty} />
      </div>

      {quiz.description && (
        <p className="text-sm line-clamp-2 mb-3" style={{ color: THEME.inkMuted }}>{quiz.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs mb-3" style={{ color: THEME.inkFaint }}>
        <span>{quiz.questions?.length || 0} questions</span>
        <span>·</span>
        <span>{quiz.duration || 30} min</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs" style={{ color: THEME.inkFaint }}>
        <UserIcon size={11} />
        {quiz.createdBy?.name || "Unknown"}
      </div>

      {isOwner && (
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(quiz); }}
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: THEME.surface2, color: THEME.inkMuted }}
          >
            <PencilIcon size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(quiz); }}
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: THEME.dangerTint, color: THEME.danger }}
          >
            <Trash2Icon size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

const QuizePage = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();

  const [search, setSearch] = useState("");
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => quizApi.getQuizzes(),
  });

  const quizzes = data?.quizzes || [];
  const filtered = quizzes.filter((q) => q.title?.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setShowForm(true);
  };

  const handleDelete = async (quiz) => {
    const confirmed = window.confirm(`Delete "${quiz.title}"?`);
    if (!confirmed) return;

    try {
      const token = await getToken();
      await quizApi.deleteQuiz(quiz._id, token);
      toast.success("Quiz deleted");
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete quiz");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingQuiz(null);
  };

  if (activeQuiz) {
    return (
      <AppShell scope="interviewer">
        <QuizPractice quiz={activeQuiz} onBack={() => setActiveQuiz(null)} />
      </AppShell>
    );
  }

  return (
    <AppShell scope="interviewer">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Interviewer · Library"
          title="Quizzes"
          description="Browse the shared quiz library, or add your own for use in live sessions."
          actions={
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-md font-semibold text-[13px] px-4 py-2.5 transition-colors"
              style={{ background: THEME.ink, color: THEME.surface }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <PlusIcon size={15} />
              Create Quiz
            </button>
          }
        />

        <div className="relative max-w-xs">
          <SearchIcon size={14} color={THEME.inkFaint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes…"
            className="w-full text-sm outline-none"
            style={{ padding: "9px 12px 9px 34px", borderRadius: 8, border: `1px solid ${THEME.border}`, background: THEME.surface, color: THEME.ink }}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="loading loading-spinner loading-lg" style={{ color: THEME.primary }}></span>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl"
            style={{ border: `1px solid ${THEME.border}`, background: THEME.surface }}
          >
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: THEME.surface2 }}>
              <ClipboardListIcon size={20} color={THEME.inkFaint} />
            </div>
            <h2 className="text-sm font-semibold mt-4" style={{ color: THEME.ink }}>No quizzes found</h2>
            <p className="text-sm mt-1 max-w-xs" style={{ color: THEME.inkFaint }}>
              {quizzes.length === 0 ? "Create the first one to get started." : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((quiz) => (
              <QuizCard
                key={quiz._id}
                quiz={quiz}
                isOwner={quiz.createdBy?._id === authUser?._id}
                onOpen={setActiveQuiz}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <QuizForm
          quiz={editingQuiz}
          onClose={handleFormClose}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["quizzes"] })}
        />
      )}
    </AppShell>
  );
};

export default QuizePage;
