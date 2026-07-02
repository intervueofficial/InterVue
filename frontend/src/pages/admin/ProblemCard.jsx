import {
  Clock3,
  Pencil,
  Trash2,
  Eye,
  Tag,
  CalendarDays,
} from "lucide-react";

const difficultyStyles = {
  Easy: {
    bg: "bg-green-100",
    text: "text-green-700",
  },
  Medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },
  Hard: {
    bg: "bg-red-100",
    text: "text-red-700",
  },
};

const ProblemCard = ({
  problem,
  onEdit,
  onDelete,
  onView,
}) => {
  const difficulty =
    difficultyStyles[problem.difficulty] ||
    difficultyStyles.Easy;

  return (
    <div className="group bg-white rounded-3xl border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden">

      {/* Header */}

      <div className="p-6 border-b border-slate-100">

        <div className="flex items-start justify-between">

          <div>

            <h3 className="text-xl font-bold text-slate-900 line-clamp-2">
              {problem.title}
            </h3>

            <p className="text-slate-500 mt-2 line-clamp-2">
              {problem.description}
            </p>

          </div>

          <span
            className={`${difficulty.bg} ${difficulty.text}
            px-3 py-1 rounded-full text-xs font-semibold`}
          >
            {problem.difficulty}
          </span>

        </div>

      </div>

      {/* Tags */}

      <div className="px-6 pt-5">

        <div className="flex items-center gap-2 flex-wrap">

          {problem.tags?.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs"
            >
              <Tag size={12} />

              {tag}
            </span>
          ))}

        </div>

      </div>

      {/* Footer */}

      <div className="px-6 py-5 mt-4 border-t border-slate-100">

        <div className="flex justify-between items-center">

          <div className="space-y-2 text-sm text-slate-500">

            <div className="flex items-center gap-2">

              <CalendarDays size={15} />

              {new Date(
                problem.createdAt
              ).toLocaleDateString()}

            </div>

            <div className="flex items-center gap-2">

              <Clock3 size={15} />

              Updated{" "}
              {new Date(
                problem.updatedAt
              ).toLocaleDateString()}

            </div>

          </div>

          <div className="flex gap-2">

            <button
              onClick={() => onView(problem)}
              className="w-10 h-10 rounded-xl hover:bg-slate-100 transition flex items-center justify-center"
            >
              <Eye
                size={18}
                className="text-slate-600"
              />
            </button>

            <button
              onClick={() => onEdit(problem)}
              className="w-10 h-10 rounded-xl hover:bg-blue-50 transition flex items-center justify-center"
            >
              <Pencil
                size={18}
                className="text-blue-600"
              />
            </button>

            <button
              onClick={() => onDelete(problem)}
              className="w-10 h-10 rounded-xl hover:bg-red-50 transition flex items-center justify-center"
            >
              <Trash2
                size={18}
                className="text-red-600"
              />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ProblemCard;