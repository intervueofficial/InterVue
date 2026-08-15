import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, X, PartyPopper } from "lucide-react";
import { T } from "../../constants/sessionTheme";

/**
 * Shown right after "Submit for Grading" comes back from the server.
 * `result` is { passed, total, results } — results is the per-test-case
 * breakdown from the backend (input / expectedOutput / actualOutput /
 * passed), used here to show exactly what went wrong on a fail instead
 * of just a number.
 */
function GradingResultModal({ result, onClose }) {
  if (!result) return null;

  const { passed, total, results = [] } = result;
  const solved = total > 0 && passed === total;
  const failedCases = results.filter((r) => !r.passed);

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: T.bg, border: `1px solid ${T.border}` }}
          >
            {/* Top banner */}
            <div
              className="relative px-6 pt-8 pb-6 flex flex-col items-center text-center overflow-hidden"
              style={{
                background: solved ? T.greenTint : T.amberTint,
                borderBottom: `1px solid ${solved ? T.greenBorder : T.amberBorder}`,
              }}
            >
              <motion.div
                initial={{ scale: 0.4, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.05 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: solved ? T.green : T.amber }}
              >
                {solved ? (
                  <PartyPopper className="text-white" size={30} />
                ) : (
                  <XCircle className="text-white" size={30} />
                )}
              </motion.div>

              <h2 className="text-xl font-bold" style={{ color: T.dark }}>
                {solved ? "Problem Solved!" : "Not quite yet"}
              </h2>
              <p className="text-sm mt-1.5" style={{ color: T.body }}>
                {solved
                  ? `All ${total} test case${total !== 1 ? "s" : ""} passed — nice work.`
                  : `${passed} of ${total} test case${total !== 1 ? "s" : ""} passed. Keep going.`}
              </p>

              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
              >
                <X size={16} style={{ color: T.muted }} />
              </button>
            </div>

            {/* Test-by-test breakdown */}
            <div className="px-6 py-5 max-h-72 overflow-y-auto">
              {results.length > 0 && (
                <div className="flex flex-col gap-2">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-lg px-3 py-2.5 flex items-start gap-2.5"
                      style={{
                        background: r.passed ? T.greenTint : T.redTint,
                        border: `1px solid ${r.passed ? T.greenBorder : T.redBorder}`,
                      }}
                    >
                      {r.passed ? (
                        <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: T.green }} />
                      ) : (
                        <XCircle size={15} className="shrink-0 mt-0.5" style={{ color: T.red }} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold" style={{ color: T.dark }}>
                          Test case {i + 1}
                        </p>
                        {!r.passed && (
                          <div className="mt-1.5 space-y-1 font-mono text-[11px] leading-relaxed">
                            <p style={{ color: T.muted }}>
                              <span className="font-semibold">Input:</span> {r.input || "—"}
                            </p>
                            <p style={{ color: T.muted }}>
                              <span className="font-semibold">Expected:</span> {r.expectedOutput || "—"}
                            </p>
                            <p style={{ color: T.red }}>
                              <span className="font-semibold">Got:</span>{" "}
                              {r.error ? r.error : r.actualOutput || "(no output)"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-end" style={{ borderTop: `1px solid ${T.border}` }}>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: solved ? T.green : T.blue }}
              >
                {solved ? "Nice!" : failedCases.length > 0 ? "Keep debugging" : "Close"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default GradingResultModal;
