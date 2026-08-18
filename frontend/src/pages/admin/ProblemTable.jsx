import {
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Tag,
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

const ProblemTable = ({
  problems = [],
  search = "",
  difficulty = "All",
  loading = false,
  onView,
  onEdit,
  onDelete,
}) => {
  const filtered = problems.filter((problem) => {
    const matchesSearch = problem.title
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesDifficulty =
      difficulty === "All" || problem.difficulty === difficulty;

    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return (
      <div
        className="rounded-xl p-16 text-center"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <AppLoader />
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <EmptyState
        title="No Coding Problems"
        description="Create your first interview coding challenge."
      />
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div className="px-6 py-5" style={{ borderBottom: `1px solid ${THEME.border}` }}>
        <h2
          style={{ fontFamily: THEME.fontDisplay, fontSize: 16, fontWeight: 600, color: THEME.ink }}
        >
          Problem Library
        </h2>
        <p className="text-sm mt-0.5" style={{ color: THEME.inkMuted }}>
          {filtered.length} problem{filtered.length === 1 ? "" : "s"} available
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className="text-left text-[11px] font-semibold uppercase tracking-wide"
              style={{ background: THEME.surface2, color: THEME.inkFaint }}
            >
              <th className="px-6 py-3">Problem</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((problem) => (
              <tr
                key={problem._id}
                className="transition-colors"
                style={{ borderTop: `1px solid ${THEME.border}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-6 py-4">
                  <h3 className="font-semibold text-sm" style={{ color: THEME.ink }}>
                    {problem.title}
                  </h3>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: THEME.inkFaint }}>
                    {problem.description}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </td>

                <td className="px-4 py-4">
                  <div className="flex gap-1.5 flex-wrap max-w-[220px]">
                    {problem.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-[11px] flex items-center gap-1"
                        style={{ background: THEME.surface2, color: THEME.inkMuted, border: `1px solid ${THEME.border}` }}
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: THEME.inkFaint }}>
                    <CalendarDays size={13} />
                    {new Date(problem.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onView?.(problem)}
                      title="View"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Eye size={15} color={THEME.inkMuted} />
                    </button>

                    <button
                      onClick={() => onEdit?.(problem)}
                      title="Edit"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.primaryTint)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Pencil size={15} color={THEME.primary} />
                    </button>

                    <button
                      onClick={() => onDelete?.(problem)}
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

export default ProblemTable;
