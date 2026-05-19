import { getDifficultyBadgeClass } from "../lib/utils";
function ProblemDescription({ problem, currentProblemId, onProblemChange, allProblems }) {
  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* HEADER SECTION */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-3xl font-bold text-gray-900">{problem.title}</h1>
          <span className={`badge ${getDifficultyBadgeClass(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>
        <p className="text-gray-500">{problem.category}</p>

        {/* Problem selector */}
        <div className="mt-4">
          <select
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentProblemId}
            onChange={(e) => onProblemChange(e.target.value)}
          >
            {allProblems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} - {p.difficulty}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* PROBLEM DESC */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_2px_8px_rgba(28,43,66,0.08)] transition hover:shadow-[0_4px_16px_rgba(28,43,66,0.12)]">
          <h2 className="text-xl font-bold text-gray-900">Description</h2>

          <div className="space-y-3 text-base leading-relaxed">
            <p className="text-gray-700">{problem.description.text}</p>
            {problem.description.notes.map((note, idx) => (
              <p key={idx} className="text-gray-700">
                {note}
              </p>
            ))}
          </div>
        </div>

        {/* EXAMPLES SECTION */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_2px_8px_rgba(28,43,66,0.08)] transition hover:shadow-[0_4px_16px_rgba(28,43,66,0.12)]">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Examples</h2>
          <div className="space-y-4">
            {problem.examples.map((example, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700">{idx + 1}</span>
                  <p className="font-semibold text-gray-900">Example {idx + 1}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-1.5 border border-gray-200">
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold min-w-[70px]">Input:</span>
                    <span>{example.input}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-green-600 font-bold min-w-[70px]">Output:</span>
                    <span>{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div className="pt-2 border-t border-gray-200 mt-2">
                      <span className="text-gray-500 font-sans text-xs">
                        <span className="font-semibold">Explanation:</span> {example.explanation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONSTRAINTS */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-[0_2px_8px_rgba(28,43,66,0.08)] transition hover:shadow-[0_4px_16px_rgba(28,43,66,0.12)]">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Constraints</h2>
          <ul className="space-y-2 text-gray-700">
            {problem.constraints.map((constraint, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-blue-600">•</span>
                <code className="text-sm">{constraint}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProblemDescription;
