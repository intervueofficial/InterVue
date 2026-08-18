import {
  Eye,
  Pencil,
  Trash2,
  Clock3,
  HelpCircle,
  Trophy,
} from "lucide-react";
import AppLoader from "../../components/AppLoader";
import { THEME, DIFFICULTY } from "../../constants/theme";

import EmptyState from "./EmptyState";

function DifficultyBadge({ difficulty }) {
  const d = DIFFICULTY[difficulty?.toLowerCase()] || DIFFICULTY.medium;
  return (
    <span
      className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ background: d.bg, color: d.text, boxShadow: `inset 0 0 0 1px ${d.border}` }}
    >
      {difficulty}
    </span>
  );
}

function StatusBadge({ published }) {
  return (
    <span
      className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: published ? THEME.successTint : THEME.surface2,
        color: published ? THEME.success : THEME.inkMuted,
        boxShadow: `inset 0 0 0 1px ${published ? THEME.successBorder : THEME.border}`,
      }}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

const QuizTable = ({
  quizzes = [],
  loading = false,
  search = "",
  onView,
  onEdit,
  onDelete,
}) => {
  const filtered = quizzes.filter((quiz) =>
    quiz.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div
        className="rounded-xl p-16 flex justify-center"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <AppLoader />
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <EmptyState
        title="No Quizzes"
        description="Create your first technical assessment."
      />
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div className="px-6 py-5" style={{ borderBottom: `1px solid ${THEME.border}` }}>
        <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 16, fontWeight: 600, color: THEME.ink }}>
          Quiz Library
        </h2>
        <p className="text-sm mt-0.5" style={{ color: THEME.inkMuted }}>
          {filtered.length} quiz{filtered.length === 1 ? "" : "zes"} available
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ background: THEME.surface2, color: THEME.inkFaint }}
            >
              <th className="text-left px-6 py-3">Quiz</th>
              <th className="text-left px-4 py-3">Difficulty</th>
              <th className="text-center px-4 py-3">Questions</th>
              <th className="text-center px-4 py-3">Duration</th>
              <th className="text-center px-4 py-3">Passing</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((quiz) => (
              <tr
                key={quiz._id}
                className="transition-colors"
                style={{ borderTop: `1px solid ${THEME.border}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-6 py-4">
                  <h3 className="font-semibold text-sm" style={{ color: THEME.ink }}>
                    {quiz.title}
                  </h3>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: THEME.inkFaint }}>
                    {quiz.description}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <DifficultyBadge difficulty={quiz.difficulty} />
                </td>

                <td className="text-center px-4 py-4">
                  <div className="flex justify-center items-center gap-1.5 text-sm" style={{ color: THEME.inkMuted }}>
                    <HelpCircle size={14} color={THEME.inkFaint} />
                    {quiz.questions?.length || 0}
                  </div>
                </td>

                <td className="text-center px-4 py-4">
                  <div className="flex justify-center items-center gap-1.5 text-sm" style={{ color: THEME.inkMuted }}>
                    <Clock3 size={14} color={THEME.inkFaint} />
                    {quiz.duration} min
                  </div>
                </td>

                <td className="text-center px-4 py-4">
                  <div className="flex justify-center items-center gap-1.5 text-sm" style={{ color: THEME.inkMuted }}>
                    <Trophy size={14} color={THEME.inkFaint} />
                    {quiz.passingMarks}
                  </div>
                </td>

                <td className="text-center px-4 py-4">
                  <StatusBadge published={quiz.isPublished} />
                </td>

                <td className="px-4 py-4">
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onView?.(quiz)}
                      title="View"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Eye size={15} color={THEME.inkMuted} />
                    </button>

                    <button
                      onClick={() => onEdit?.(quiz)}
                      title="Edit"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.primaryTint)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Pencil size={15} color={THEME.primary} />
                    </button>

                    <button
                      onClick={() => onDelete?.(quiz)}
                      title="Delete"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.dangerTint)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Trash2 size={15} color={THEME.danger} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuizTable;
