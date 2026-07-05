import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  RefreshCw,
  Code2,
} from "lucide-react";

import { problemApi } from "../../api/problemApi";

import ProblemTable from "./ProblemTable";
import ProblemForm from "./ProblemForm";
import ViewProblemModal from "./ViewProblemModal";
import DeleteModal from "./DeleteModal";

const Problems = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [viewProblem, setViewProblem] = useState(null);
  const [deleteProblem, setDeleteProblem] = useState(null);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["problems"],
    queryFn: problemApi.getProblems,
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-8">

      {/* Header */}

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >

        <div className="flex items-center gap-3">

          <motion.div
            whileHover={{ scale: 1.06, rotate: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm ring-1 ring-blue-100"
          >
            <Code2
              className="text-blue-600"
              size={28}
            />
          </motion.div>

          <div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Coding Problems
            </h1>

            <p className="text-slate-500">
              Create, edit and organize interview coding challenges.
            </p>

          </div>

        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setEditingProblem(null);
            setOpenForm(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-shadow"
        >
          <Plus size={20} />
          Add Problem
        </motion.button>

      </motion.div>

      {/* Toolbar */}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm"
      >

        <div className="flex gap-4">

          <div className="relative flex-1 group">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search problems..."
              className="w-full rounded-xl border border-slate-200 pl-12 pr-4 py-3 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />

          </div>

          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value)
            }
            className="rounded-xl border border-slate-200 px-4 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option>All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleRefresh}
            className="border border-slate-200 rounded-xl px-5 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
          >
            <motion.span
              animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: "linear" }}
              className="flex"
            >
              <RefreshCw size={18} />
            </motion.span>
            Refresh
          </motion.button>

        </div>

      </motion.div>

      {/* Table */}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
      >
        <ProblemTable
          problems={problems}
          loading={isLoading}
          search={search}
          difficulty={difficulty}
          onView={(problem) =>
            setViewProblem(problem)
          }
          onEdit={(problem) => {
            setEditingProblem(problem);
            setOpenForm(true);
          }}
          onDelete={(problem) =>
            setDeleteProblem(problem)
          }
        />
      </motion.div>

      {/* Create / Edit */}

      <AnimatePresence>
        {openForm && (
          <ProblemForm
            problem={editingProblem}
            onClose={() => {
              setOpenForm(false);
              setEditingProblem(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["problems"],
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* View */}

      <ViewProblemModal
        problem={viewProblem}
        onClose={() =>
          setViewProblem(null)
        }
      />

      {/* Delete */}

      <DeleteModal
        open={!!deleteProblem}
        title={deleteProblem?.title}
        description="This action cannot be undone."
        loading={deleteMutation.isPending}
        onCancel={() =>
          setDeleteProblem(null)
        }
        onConfirm={() =>
          deleteMutation.mutate(
            deleteProblem._id
          )
        }
      />

    </div>
  );
};

export default Problems;