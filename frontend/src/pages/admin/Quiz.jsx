import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen } from "lucide-react";

import { quizApi } from "../../api/quizApi";
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["quizzes"],
    queryFn: quizApi.getQuizzes,
  });

  const quizzes = data?.quizzes || [];

  return (
    <div className="space-y-8">

      {/* Header */}

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >

        <div className="flex gap-3 items-center">

          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex justify-center items-center">

            <BookOpen size={28} className="text-blue-600" />

          </div>

          <div>

            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Quiz Management
            </h1>

            <p className="text-slate-500">
              Manage technical assessment quizzes.
            </p>

          </div>

        </div>

        <button
          onClick={() => {
            setSelectedQuiz(null);
            setOpenForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex gap-2 items-center transition shadow-sm shadow-blue-600/20"
        >

          <Plus size={18} />

          Add Quiz

        </button>

      </motion.div>

      {/* Search */}

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="relative"
      >

        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          placeholder="Search quizzes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-300 rounded-xl pl-12 py-3 outline-none transition focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
        />

      </motion.div>

      {/* Table */}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >

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

      </motion.div>

      {/* Add / Edit Quiz */}

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

      {/* View Quiz */}

      {viewOpen && (
        <ViewQuizModal
          quiz={selectedQuiz}
          onClose={() => setViewOpen(false)}
        />
      )}

      {/* Delete Quiz */}

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