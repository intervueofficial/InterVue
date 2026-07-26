import { useState } from "react";
import AppLoader from "../components/AppLoader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  PlusIcon,
  SearchIcon,
  Code2Icon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";

import { problemApi } from "../api/problemApi";
import useAuthUser from "../hooks/useAuthUser";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import ProblemForm from "./admin/ProblemForm";
import { THEME, DIFFICULTY } from "../constants/theme";

function DifficultyBadge({ difficulty }) {
  const d = DIFFICULTY[difficulty?.toLowerCase()] || DIFFICULTY.medium;
  return (
    <span
      className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: d.bg, color: d.text, boxShadow: `inset 0 0 0 1px ${d.border}` }}
    >
      {difficulty}
    </span>
  );
}

function ProblemCard({ problem, isOwner, onEdit, onDelete }) {
  return (
    <div
      className="rounded-xl p-5 transition-colors relative group"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
    >
      <Link to={`/problem/${problem._id}`} className="block">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-[15px] pr-12" style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}>
            {problem.title}
          </h3>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        <p className="text-sm line-clamp-2 mb-3" style={{ color: THEME.inkMuted }}>
          {problem.description}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {problem.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[11px]" style={{ color: THEME.inkFaint }}>
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs" style={{ color: THEME.inkFaint }}>
          <UserIcon size={11} />
          {problem.createdBy?.name || "Unknown"}
        </div>
      </Link>

      {isOwner && (
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(problem); }}
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: THEME.surface2, color: THEME.inkMuted }}
          >
            <PencilIcon size={13} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(problem); }}
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: THEME.dangerTint, color: THEME.danger }}
          >
            <Trash2Icon size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

const ProblemsPage = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();

  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["problems"],
    queryFn: () => problemApi.getProblems(),
  });

  const problems = data?.problems || [];

  const filtered = problems.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === "All" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const handleEdit = (problem) => {
    setEditingProblem(problem);
    setShowForm(true);
  };

  const handleDelete = async (problem) => {
    const confirmed = window.confirm(`Delete "${problem.title}"?`);
    if (!confirmed) return;

    try {
      const token = await getToken();
      await problemApi.deleteProblem(problem._id, token);
      toast.success("Problem deleted");
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete problem");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProblem(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["problems"] });
  };

  return (
    <AppShell scope="interviewer">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Interviewer · Library"
          title="Coding Problems"
          description="Browse the shared problem library, or add your own for use in live sessions."
          actions={
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-md font-semibold text-[13px] px-4 py-2.5 transition-colors"
              style={{ background: THEME.ink, color: THEME.surface }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <PlusIcon size={15} />
              Create Problem
            </button>
          }
        />

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon size={14} color={THEME.inkFaint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems…"
              className="w-full text-sm outline-none"
              style={{ padding: "9px 12px 9px 34px", borderRadius: 8, border: `1px solid ${THEME.border}`, background: THEME.surface, color: THEME.ink }}
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="text-sm outline-none"
            style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${THEME.border}`, background: THEME.surface, color: THEME.ink }}
          >
            <option>All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <AppLoader />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl"
            style={{ border: `1px solid ${THEME.border}`, background: THEME.surface }}
          >
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: THEME.surface2 }}>
              <Code2Icon size={20} color={THEME.inkFaint} />
            </div>
            <h2 className="text-sm font-semibold mt-4" style={{ color: THEME.ink }}>No problems found</h2>
            <p className="text-sm mt-1 max-w-xs" style={{ color: THEME.inkFaint }}>
              {problems.length === 0 ? "Create the first one to get started." : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((problem) => (
              <ProblemCard
                key={problem._id}
                problem={problem}
                isOwner={problem.createdBy?._id === authUser?._id}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProblemForm
          problem={editingProblem}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </AppShell>
  );
};

export default ProblemsPage;
