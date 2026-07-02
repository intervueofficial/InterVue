import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
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

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

        <div className="flex items-center gap-3">

          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Code2
              className="text-blue-600"
              size={28}
            />
          </div>

          <div>

            <h1 className="text-4xl font-bold">
              Coding Problems
            </h1>

            <p className="text-slate-500">
              Create, edit and organize interview coding challenges.
            </p>

          </div>

        </div>

        <button
          onClick={() => {
            setEditingProblem(null);
            setOpenForm(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-4"
        >
          <Plus size={20} />
          Add Problem
        </button>

      </div>

      {/* Toolbar */}

      <div className="bg-white rounded-3xl border p-6">

        <div className="flex gap-4">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search problems..."
              className="w-full rounded-xl border pl-12 pr-4 py-3"
            />

          </div>

          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value)
            }
            className="rounded-xl border px-4"
          >
            <option>All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <button
            onClick={refetch}
            className="border rounded-xl px-5 flex items-center gap-2 hover:bg-slate-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

        </div>

      </div>

      {/* Table */}

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

      {/* Create / Edit */}

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