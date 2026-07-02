import {
  Eye,
  Pencil,
  Trash2,
  Clock3,
  HelpCircle,
  Trophy,
} from "lucide-react";

import EmptyState from "./EmptyState";

const badge = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Hard: "bg-red-100 text-red-700",
};

const QuizTable = ({
  quizzes = [],
  loading = false,
  search = "",
  onView,
  onEdit,
  onDelete,
}) => {
  const filtered = quizzes.filter((quiz) =>
    quiz.title
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-16 flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="px-8 py-6 border-b">

        <h2 className="text-xl font-semibold">
          Quiz Library
        </h2>

        <p className="text-slate-500 mt-1">
          {filtered.length} quizzes available
        </p>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-50">

            <tr>

              <th className="text-left px-8 py-4">
                Quiz
              </th>

              <th className="text-left px-6 py-4">
                Difficulty
              </th>

              <th className="text-center px-6 py-4">
                Questions
              </th>

              <th className="text-center px-6 py-4">
                Duration
              </th>

              <th className="text-center px-6 py-4">
                Passing
              </th>

              <th className="text-center px-6 py-4">
                Status
              </th>

              <th className="text-center px-6 py-4">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.map((quiz) => (

              <tr
                key={quiz._id}
                className="border-t hover:bg-slate-50 transition"
              >

                {/* Quiz */}

                <td className="px-8 py-5">

                  <div>

                    <h3 className="font-semibold">
                      {quiz.title}
                    </h3>

                    <p className="text-slate-500 text-sm mt-1 line-clamp-1">
                      {quiz.description}
                    </p>

                  </div>

                </td>

                {/* Difficulty */}

                <td className="px-6">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      badge[quiz.difficulty]
                    }`}
                  >
                    {quiz.difficulty}
                  </span>

                </td>

                {/* Questions */}

                <td className="text-center">

                  <div className="flex justify-center items-center gap-2">

                    <HelpCircle size={16} />

                    {quiz.questions?.length || 0}

                  </div>

                </td>

                {/* Duration */}

                <td className="text-center">

                  <div className="flex justify-center items-center gap-2">

                    <Clock3 size={16} />

                    {quiz.duration} min

                  </div>

                </td>

                {/* Passing */}

                <td className="text-center">

                  <div className="flex justify-center items-center gap-2">

                    <Trophy size={16} />

                    {quiz.passingMarks}

                  </div>

                </td>

                {/* Published */}

                <td className="text-center">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      quiz.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {quiz.isPublished
                      ? "Published"
                      : "Draft"}
                  </span>

                </td>

                {/* Actions */}

                <td>

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() => onView?.(quiz)}
                      className="w-10 h-10 rounded-xl hover:bg-slate-100"
                    >
                      <Eye
                        size={18}
                        className="mx-auto"
                      />
                    </button>

                    <button
                      onClick={() => onEdit?.(quiz)}
                      className="w-10 h-10 rounded-xl hover:bg-blue-50"
                    >
                      <Pencil
                        size={18}
                        className="mx-auto text-blue-600"
                      />
                    </button>

                    <button
                      onClick={() => onDelete?.(quiz)}
                      className="w-10 h-10 rounded-xl hover:bg-red-50"
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

export default QuizTable;