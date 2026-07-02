import {
  X,
  Clock3,
  Trophy,
} from "lucide-react";

const ViewQuizModal = ({
  quiz,
  onClose,
}) => {
  if (!quiz) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-6">

      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden">

        <div className="border-b px-8 py-6 flex justify-between">

          <div>

            <h2 className="text-3xl font-bold">
              {quiz.title}
            </h2>

            <p className="text-slate-500">
              Quiz Details
            </p>

          </div>

          <button onClick={onClose}>
            <X />
          </button>

        </div>

        <div className="p-8">

          <div className="grid grid-cols-3 gap-6">

            <div>

              <p className="text-slate-500">
                Difficulty
              </p>

              <p className="font-semibold mt-2">
                {quiz.difficulty}
              </p>

            </div>

            <div>

              <p className="text-slate-500">
                Duration
              </p>

              <div className="flex gap-2 mt-2">

                <Clock3 size={18} />

                {quiz.duration} min

              </div>

            </div>

            <div>

              <p className="text-slate-500">
                Passing Marks
              </p>

              <div className="flex gap-2 mt-2">

                <Trophy size={18} />

                {quiz.passingMarks}

              </div>

            </div>

          </div>

          <div className="mt-8">

            <h3 className="text-xl font-bold mb-4">
              Description
            </h3>

            <div className="bg-slate-50 rounded-xl p-5">
              {quiz.description}
            </div>

          </div>

          <div className="mt-8">

            <h3 className="text-xl font-bold mb-4">
              Questions
            </h3>

            <div className="space-y-5">

              {quiz.questions?.map(
                (question, index) => (
                  <div
                    key={index}
                    className="border rounded-xl p-5"
                  >
                    <p className="font-semibold">
                      {index + 1}.{" "}
                      {question.question}
                    </p>

                    <div className="mt-4 space-y-2">

                      {question.options.map(
                        (
                          option,
                          optionIndex
                        ) => (
                          <div
                            key={optionIndex}
                            className={`rounded-lg px-4 py-2 ${
                              optionIndex ===
                              question.correctAnswer
                                ? "bg-green-100 border border-green-400"
                                : "bg-slate-50"
                            }`}
                          >
                            {option}
                          </div>
                        )
                      )}

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ViewQuizModal;