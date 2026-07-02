import {
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Tag,
} from "lucide-react";

import EmptyState from "./EmptyState";

const badgeColor = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Hard: "bg-red-100 text-red-700",
};

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
    const matchesSearch =
      problem.title
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const matchesDifficulty =
      difficulty === "All" ||
      problem.difficulty === difficulty;

    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
        <span className="loading loading-spinner loading-lg"></span>
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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}

      <div className="flex items-center justify-between px-8 py-6 border-b">

        <div>

          <h2 className="text-xl font-semibold">
            Problem Library
          </h2>

          <p className="text-slate-500 mt-1">
            {filtered.length} problems available
          </p>

        </div>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="sticky top-0 bg-slate-50">

            <tr className="text-left text-slate-500 text-sm">

              <th className="px-8 py-4 font-semibold">
                Problem
              </th>

              <th className="px-6 py-4 font-semibold">
                Difficulty
              </th>

              <th className="px-6 py-4 font-semibold">
                Tags
              </th>

              <th className="px-6 py-4 font-semibold">
                Created
              </th>

              <th className="px-6 py-4 text-center font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.map((problem) => (

              <tr
                key={problem._id}
                className="border-t hover:bg-slate-50 transition"
              >

                {/* Problem */}

                <td className="px-8 py-5">

                  <div>

                    <h3 className="font-semibold text-slate-900">
                      {problem.title}
                    </h3>

                    <p className="text-slate-500 text-sm mt-1 line-clamp-1">
                      {problem.description}
                    </p>

                  </div>

                </td>

                {/* Difficulty */}

                <td className="px-6">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      badgeColor[problem.difficulty]
                    }`}
                  >
                    {problem.difficulty}
                  </span>

                </td>

                {/* Tags */}

                <td className="px-6">

                  <div className="flex gap-2 flex-wrap">

                    {problem.tags?.slice(0, 3).map((tag) => (

                      <span
                        key={tag}
                        className="bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-xs flex items-center gap-1"
                      >
                        <Tag size={12} />

                        {tag}

                      </span>

                    ))}

                  </div>

                </td>

                {/* Created */}

                <td className="px-6">

                  <div className="flex items-center gap-2 text-slate-500">

                    <CalendarDays size={16} />

                    {new Date(
                      problem.createdAt
                    ).toLocaleDateString()}

                  </div>

                </td>

                {/* Actions */}

                <td className="px-6">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() => onView?.(problem)}
                      className="w-10 h-10 rounded-xl hover:bg-slate-100 transition"
                    >
                      <Eye
                        size={18}
                        className="mx-auto"
                      />
                    </button>

                    <button
                      onClick={() => onEdit?.(problem)}
                      className="w-10 h-10 rounded-xl hover:bg-blue-50 transition"
                    >
                      <Pencil
                        size={18}
                        className="mx-auto text-blue-600"
                      />
                    </button>

                    <button
                      onClick={() => onDelete?.(problem)}
                      className="w-10 h-10 rounded-xl hover:bg-red-50 transition"
                    >
                      <Trash2
                        size={18}
                        className="mx-auto text-red-600"
                      />
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