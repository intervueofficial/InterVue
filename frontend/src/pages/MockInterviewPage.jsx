import { useState } from "react";
import AppLoader from "../components/AppLoader";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { SearchIcon, Code2Icon, UserIcon, BotIcon } from "lucide-react";

import { problemApi } from "../api/problemApi";
import useAuthUser from "../hooks/useAuthUser";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
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

function ProblemCard({ problem }) {
  return (
    <Link
      to={`/problem/${problem._id}`}
      className="block rounded-xl p-5 transition-colors"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-[15px]" style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}>
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
  );
}

const MockInterviewPage = () => {
  const { data: authUser } = useAuthUser();
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

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

  const scope = authUser?.role === "candidate" ? "candidate" : authUser?.role === "interviewer" ? "interviewer" : "candidate";

  return (
    <AppShell scope={scope}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Practice"
          title="Mock Interview"
          description="Pick a problem from the shared library and practice solo — write code, run it, and compare your output against the sample test cases. No AI grading, just an honest sandbox to warm up in before the real thing."
        />

        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{ background: THEME.primaryTint, border: `1px solid ${THEME.primaryTintBorder}` }}
        >
          <BotIcon size={18} color={THEME.primary} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm" style={{ color: THEME.ink }}>
            This is solo practice — nothing here is scored or shared with an interviewer.
            When you're ready for a real session, head to{" "}
            <Link to="/candidate/sessions" className="font-semibold underline">
              Sessions
            </Link>.
          </p>
        </div>

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
              {problems.length === 0 ? "There's nothing in the problem library yet." : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((problem) => (
              <ProblemCard key={problem._id} problem={problem} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default MockInterviewPage;
