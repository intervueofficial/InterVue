import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

import { quizApi } from "../../api/quizApi";
import PageHeader from "../../components/PageHeader";
import AutoRefreshBar from "../../components/admin/AutoRefreshBar";
import { THEME } from "../../constants/theme";

import ViewQuizModal from "./ViewQuizModal";
import DeleteQuizModal from "./DeleteQuizModal";
import QuizTable from "./QuizTable";
import QuizForm from "./QuizForm";

const Quiz = () => {
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["quizzes"],
    queryFn: quizApi.getQuizzes,
    retry: 1,
  });

  const quizzes = data?.quizzes || [];

  return (
    <div className="space-y-8">

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <PageHeader
          eyebrow="Library"
          title="Quiz Management"
          description="Manage technical assessment quizzes."
          actions={
            <>
              <AutoRefreshBar onRefresh={refetch} isFetching={isFetching} intervalSeconds={30} />
              <button
                onClick={() => {
                  setSelectedQuiz(null);
                  setOpenForm(true);
                }}
                className="flex items-center gap-2 rounded-lg font-semibold text-sm px-4 py-2.5 transition-colors"
                style={{ background: THEME.ink, color: THEME.surface }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Plus size={16} />
                Add Quiz
              </button>
            </>
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
        className="relative"
      >
        <Search
          size={15}
          color={THEME.inkFaint}
          className="absolute left-3.5 top-1/2 -translate-y-1/2"
        />
        <input
          placeholder="Search quizzes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none transition-colors"
          style={{
            padding: "9px 12px 9px 34px",
            borderRadius: 8,
            border: `1px solid ${THEME.border}`,
            background: THEME.surface,
            color: THEME.ink,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = THEME.primary)}
          onBlur={(e) => (e.currentTarget.style.borderColor = THEME.border)}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
      >
        {isError ? (
          <div
            className="flex flex-col items-center text-center py-16 rounded-xl"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
              style={{ background: THEME.dangerTint }}
            >
              <AlertTriangleIcon size={20} color={THEME.danger} />
            </div>
            <p className="text-sm font-semibold" style={{ color: THEME.ink }}>
              Couldn't load quizzes
            </p>
            <p className="text-xs mt-1 mb-4" style={{ color: THEME.inkFaint }}>
              Something went wrong fetching the quiz library.
            </p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: THEME.ink, color: THEME.surface }}
            >
              <RefreshCwIcon size={14} />
              Try again
            </button>
          </div>
        ) : (
          <QuizTable
            quizzes={quizzes}
            loading={isLoading}
            search={search}
            onView={(quiz) => {
              setSelectedQuiz(quiz);
              setViewOpen(true);
            }}
            onEdit={(quiz) => {
              setSelectedQuiz(quiz);
              setOpenForm(true);
            }}
            onDelete={(quiz) => {
              setSelectedQuiz(quiz);
              setDeleteOpen(true);
            }}
          />
        )}
      </motion.div>

      {openForm && (
        <QuizForm
          quiz={selectedQuiz}
          onClose={() => {
            setOpenForm(false);
            setSelectedQuiz(null);
          }}
          onSuccess={() => refetch()}
        />
      )}

      {viewOpen && (
        <ViewQuizModal quiz={selectedQuiz} onClose={() => setViewOpen(false)} />
      )}

      {deleteOpen && (
        <DeleteQuizModal
          quiz={selectedQuiz}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            setDeleteOpen(false);
            refetch();
          }}
        />
      )}

    </div>
  );
};

export default Quiz;
