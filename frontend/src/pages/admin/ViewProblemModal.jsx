import {
  X,
  CalendarDays,
  Tag,
  BookOpen,
  User,
  Clock3,
  FileCode2,
} from "lucide-react";

const badge = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
};

const ViewProblemModal = ({ problem, onClose }) => {
  if (!problem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden">

        {/* Header */}

        <div className="flex justify-between items-center px-8 py-6 border-b">

          <div>

            <h2 className="text-3xl font-bold text-slate-900">
              {problem.title}
            </h2>

            <p className="text-slate-500 mt-1">
              Coding Problem Details
            </p>

          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          >
            <X />
          </button>

        </div>

        <div className="p-8 grid lg:grid-cols-3 gap-8">

          {/* LEFT */}

          <div className="lg:col-span-2 space-y-8">

            {/* Description */}

            <div className="bg-slate-50 rounded-2xl p-6">

              <div className="flex items-center gap-2 mb-5">

                <BookOpen className="text-blue-600"/>

                <h3 className="text-xl font-semibold">
                  Description
                </h3>

              </div>

              <div className="leading-8 whitespace-pre-wrap text-slate-700">
                {problem.description}
              </div>

            </div>

            {/* Tags */}

            <div className="bg-slate-50 rounded-2xl p-6">

              <div className="flex items-center gap-2 mb-5">

                <Tag className="text-green-600"/>

                <h3 className="text-xl font-semibold">
                  Tags
                </h3>

              </div>

              <div className="flex flex-wrap gap-3">

                {problem.tags?.length ? (

                  problem.tags.map(tag=>(
                    <span
                      key={tag}
                      className="px-4 py-2 rounded-full bg-white border text-sm"
                    >
                      {tag}
                    </span>
                  ))

                ) : (

                  <span className="text-slate-400">
                    No Tags
                  </span>

                )}

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="space-y-5">

            <div className="bg-slate-50 rounded-2xl p-6">

              <div className="flex items-center gap-2 mb-4">

                <FileCode2 className="text-indigo-600"/>

                <h3 className="font-semibold">
                  Difficulty
                </h3>

              </div>

              <span
                className={`inline-flex px-4 py-2 rounded-full border font-semibold ${
                  badge[problem.difficulty]
                }`}
              >
                {problem.difficulty}
              </span>

            </div>

            <div className="bg-slate-50 rounded-2xl p-6">

              <div className="flex items-center gap-2 mb-3">

                <User size={18}/>

                <span className="font-medium">
                  Created By
                </span>

              </div>

              <p className="text-slate-700">
                {problem.createdBy?.name || "Administrator"}
              </p>

            </div>

            <div className="bg-slate-50 rounded-2xl p-6">

              <div className="flex items-center gap-2 mb-3">

                <CalendarDays size={18}/>

                <span className="font-medium">
                  Created
                </span>

              </div>

              <p>
                {new Date(problem.createdAt).toLocaleString()}
              </p>

            </div>

            <div className="bg-slate-50 rounded-2xl p-6">

              <div className="flex items-center gap-2 mb-3">

                <Clock3 size={18}/>

                <span className="font-medium">
                  Updated
                </span>

              </div>

              <p>
                {new Date(problem.updatedAt).toLocaleString()}
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ViewProblemModal;