import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

import { problemApi } from "../../api/problemApi";
import PageHeader from "../../components/PageHeader";
import AutoRefreshBar from "../../components/admin/AutoRefreshBar";
import { THEME } from "../../constants/theme";

import ProblemTable from "./ProblemTable";
import ProblemForm from "./ProblemForm";
import ViewProblemModal from "./ViewProblemModal";
import DeleteModal from "./DeleteModal";

const Problems = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");

  const [openForm, setOpenForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [viewProblem, setViewProblem] = useState(null);
  const [deleteProblem, setDeleteProblem] = useState(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["problems"],
    queryFn: problemApi.getProblems,
    retry: 1,
  });

  const problems = data?.problems || [];

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      return problemApi.deleteProblem(id, token);
    },

    onSuccess: () => {
      toast.success("Problem deleted");

      queryClient.invalidateQueries({
        queryKey: ["problems"],
      });

      setDeleteProblem(null);
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete problem"
      );
    },
  });

  return (
    <div className="space-y-8">

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <PageHeader
          eyebrow="Library"
          title="Coding Problems"
          description="Create, edit and organize interview coding challenges."
          actions={
            <>
              <AutoRefreshBar
                onRefresh={refetch}
                isFetching={isFetching}
                intervalSeconds={30}
              />
              <button
                onClick={() => {
                  setEditingProblem(null);
                  setOpenForm(true);
                }}
                className="flex items-center gap-2 rounded-lg font-semibold text-sm px-4 py-2.5 transition-colors"
                style={{ background: THEME.ink, color: THEME.surface }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Plus size={16} />
                Add Problem
              </button>
            </>
          }
        />
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
        className="rounded-xl p-4"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              color={THEME.inkFaint}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems…"
              className="w-full text-sm outline-none transition-colors"
              style={{
                padding: "9px 12px 9px 34px",
                borderRadius: 8,
                border: `1px solid ${THEME.border}`,
                background: THEME.background,
                color: THEME.ink,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = THEME.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = THEME.border)}
            />
          </div>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="text-sm outline-none"
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${THEME.border}`,
              background: THEME.background,
              color: THEME.ink,
            }}
          >
            <option>All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
      </motion.div>

      {/* Table / error state */}
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
              Couldn't load problems
            </p>
            <p className="text-xs mt-1 mb-4" style={{ color: THEME.inkFaint }}>
              Something went wrong fetching the problem library.
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
          <ProblemTable
            problems={problems}
            loading={isLoading}
            search={search}
            difficulty={difficulty}
            onView={(problem) => setViewProblem(problem)}
            onEdit={(problem) => {
              setEditingProblem(problem);
              setOpenForm(true);
            }}
            onDelete={(problem) => setDeleteProblem(problem)}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {openForm && (
          <ProblemForm
            problem={editingProblem}
            onClose={() => {
              setOpenForm(false);
              setEditingProblem(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["problems"] });
            }}
          />
        )}
      </AnimatePresence>

      <ViewProblemModal problem={viewProblem} onClose={() => setViewProblem(null)} />

      <DeleteModal
        open={!!deleteProblem}
        title={deleteProblem?.title}
        description="This action cannot be undone."
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteProblem(null)}
        onConfirm={() => deleteMutation.mutate(deleteProblem._id)}
      />

    </div>
  );
};

export default Problems;
