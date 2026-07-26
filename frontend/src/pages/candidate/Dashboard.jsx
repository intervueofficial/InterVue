import { useMemo } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  BarChart3Icon,
  ActivityIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  TrophyIcon,
  SparklesIcon,
  UserCircleIcon,
  ClockIcon,
  TrendingUpIcon,
} from "lucide-react";

import useAuthUser from "../../hooks/useAuthUser";
import { useActiveSessions, useMyRecentSessions } from "../../hooks/useSessions";
import { applicationApi } from "../../api/applicationApi";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import StatCard from "../admin/StatCard";
import SessionGrid from "../../components/session/SessionGrid";
import CandidateDashboardLoading from "./CandidateDashboardLoading";
import { THEME } from "../../constants/theme";

function QuickLink({ to, icon: Icon, title, subtitle }) {
  return (
    <Link to={to} className="block group">
      <div
        className="rounded-xl p-5 transition-colors duration-150"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
      >
        <div className="flex items-center justify-between">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: THEME.surface2 }}
          >
            <Icon size={16} color={THEME.inkMuted} strokeWidth={2} />
          </div>
          <ArrowRightIcon
            size={14}
            color={THEME.inkFaint}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </div>
        <div className="mt-3.5 text-sm font-semibold" style={{ color: THEME.ink }}>{title}</div>
        <div className="text-xs mt-1" style={{ color: THEME.inkFaint }}>{subtitle}</div>
      </div>
    </Link>
  );
}

function SectionHeader({ icon: Icon, title, count, viewAllTo, subtitle }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={18} color={THEME.inkFaint} />}
          <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 19, fontWeight: 600, color: THEME.ink, letterSpacing: "-0.01em" }}>
            {title}
          </h2>
          {typeof count === "number" && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: THEME.primaryTint, color: THEME.primary, border: `1px solid ${THEME.primaryTintBorder}` }}
            >
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: THEME.inkFaint }}>{subtitle}</p>
        )}
      </div>

      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors shrink-0"
          style={{ color: THEME.primary }}
        >
          View all
          <ArrowRightIcon size={14} />
        </Link>
      )}
    </div>
  );
}

const APPLICATION_STATUS_LABEL = {
  applied: { text: "Under Review", cls: "bg-blue-50 text-blue-700" },
  not_eligible: { text: "Not Eligible", cls: "bg-red-50 text-red-600" },
  selected: { text: "Shortlisted", cls: "bg-indigo-50 text-indigo-700" },
  rejected: { text: "Not Selected", cls: "bg-slate-100 text-slate-500" },
};

function ApplicationRow({ application }) {
  const status = APPLICATION_STATUS_LABEL[application.status] || {
    text: application.status,
    cls: "bg-slate-100 text-slate-500",
  };
  const jobTitle = application.job?.title || "Job";
  const when = application.createdAt
    ? new Date(application.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";

  return (
    <div
      className="flex items-center gap-4 py-3.5"
      style={{ borderBottom: `1px solid ${THEME.border}` }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: THEME.primaryTint }}
      >
        <BriefcaseIcon size={15} color={THEME.primary} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: THEME.ink }}>
          {jobTitle}
        </div>
        <div className="text-xs mt-0.5 truncate" style={{ color: THEME.inkFaint }}>
          Applied {when}
        </div>
      </div>

      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status.cls}`}>
        {status.text}
      </span>
    </div>
  );
}

function ProgressBar({ label, value, tone }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span style={{ color: THEME.inkMuted }}>{label}</span>
        <span className="font-semibold" style={{ color: THEME.ink }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: THEME.surface2 }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: tone }}
        />
      </div>
    </div>
  );
}

const CandidateDashboard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { data: authUser } = useAuthUser();

  const { data: activeSessionsData, isLoading: loadingActive } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecent } = useMyRecentSessions();

  const { data: applicationsData, isLoading: loadingApplications } = useQuery({
    queryKey: ["my-applications-dashboard"],
    queryFn: async () => applicationApi.getMyApplications(await getToken()),
  });

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];
  const applications = applicationsData?.applications || [];

  // "My" upcoming interviews = active/waiting/live sessions I've already joined
  const myUpcoming = activeSessions.filter(
    (s) => s.candidate?._id === authUser?._id
  );

  const quizzesWithScore = recentSessions.filter((s) => s.quizResult?.total);
  const avgQuizScore =
    quizzesWithScore.length > 0
      ? Math.round(
          (quizzesWithScore.reduce(
            (sum, s) => sum + s.quizResult.score / s.quizResult.total,
            0
          ) /
            quizzesWithScore.length) *
            100
        )
      : null;

  const { codingSubmissions, avgCodingScore, offersCount } = useMemo(() => {
    let codingTotal = 0;
    let codingCount = 0;
    let offers = 0;

    for (const s of recentSessions) {
      if (s.codeResult?.total > 0) {
        codingTotal += (s.codeResult.passed / s.codeResult.total) * 100;
        codingCount += 1;
      }
    }

    for (const a of applications) {
      if (a.status === "selected" || a.finalDecision === "hired") offers += 1;
    }

    return {
      codingSubmissions: codingCount,
      avgCodingScore: codingCount > 0 ? Math.round(codingTotal / codingCount) : null,
      offersCount: offers,
    };
  }, [recentSessions, applications]);

  const profileComplete = !!authUser?.candidateProfile?.isComplete;

  const isLoading = loadingActive || loadingRecent;
  const firstName = user?.firstName || "there";

  const recentApplications = applications.slice(0, 5);

  // Full-page skeleton while the primary data this view depends on is loading
  if (isLoading) {
    return (
      <AppShell scope="candidate">
        <CandidateDashboardLoading />
      </AppShell>
    );
  }

  return (
    <AppShell scope="candidate">
      <div className="space-y-12">
        <PageHeader
          eyebrow="Candidate"
          title="Dashboard"
          description={`Welcome back, ${firstName}. Here's what's happening with your interviews.`}
        />

        {!profileComplete && (
          <div
            className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
            style={{ background: THEME.warningTint, border: `1px solid ${THEME.border}` }}
          >
            <div className="flex items-center gap-3">
              <UserCircleIcon size={18} color={THEME.warning} />
              <p className="text-sm" style={{ color: THEME.ink }}>
                Your profile isn't complete yet — finish it to apply for jobs.
              </p>
            </div>
            <Link to="/candidate/profile" className="text-sm font-semibold shrink-0" style={{ color: THEME.warning }}>
              Complete Profile →
            </Link>
          </div>
        )}

        {/* Primary stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Upcoming Interviews"
            value={myUpcoming.length}
            subtitle="Scheduled, waiting, or live"
            icon={CalendarClockIcon}
            color={THEME.primary}
          />
          <StatCard
            title="Completed"
            value={recentSessions.length}
            subtitle="Interviews you've finished"
            icon={CheckCircle2Icon}
            color={THEME.success}
          />
          <StatCard
            title="Avg Quiz Score"
            value={avgQuizScore !== null ? `${avgQuizScore}%` : "--"}
            subtitle={
              quizzesWithScore.length > 0
                ? `Across ${quizzesWithScore.length} quiz${quizzesWithScore.length !== 1 ? "zes" : ""}`
                : "No quizzes taken yet"
            }
            icon={BarChart3Icon}
            color="#8B5CF6"
          />
          <StatCard
            title="Total Interviews"
            value={myUpcoming.length + recentSessions.length}
            subtitle="All-time sessions"
            icon={ActivityIcon}
            color={THEME.warning}
          />
        </div>

        {/* Secondary stats — application pipeline + coding signal */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Applications Submitted"
            value={loadingApplications ? "—" : applications.length}
            subtitle="Jobs you've applied to"
            icon={BriefcaseIcon}
            color={THEME.info}
          />
          <StatCard
            title="Offers / Shortlists"
            value={loadingApplications ? "—" : offersCount}
            subtitle="Positive outcomes so far"
            icon={TrophyIcon}
            color={THEME.success}
          />
          <StatCard
            title="Avg Coding Score"
            value={avgCodingScore !== null ? `${avgCodingScore}%` : "—"}
            subtitle={codingSubmissions > 0 ? `Across ${codingSubmissions} submission(s)` : "No code graded yet"}
            icon={SparklesIcon}
            color="#8B5CF6"
          />
          <StatCard
            title="Profile Status"
            value={profileComplete ? "Complete" : "Incomplete"}
            subtitle={profileComplete ? "Ready to apply for jobs" : "Finish it to unlock applying"}
            icon={UserCircleIcon}
            color={profileComplete ? THEME.success : THEME.warning}
          />
        </div>

        {/* Upcoming interviews */}
        <div>
          <SectionHeader
            icon={CalendarClockIcon}
            title="Upcoming Interviews"
            count={myUpcoming.length}
            viewAllTo="/candidate/interviews"
          />

          <SessionGrid
            sessions={myUpcoming.slice(0, 3)}
            emptyTitle="No upcoming interviews"
            emptySubtitle="Once you join a scheduled session, it will show up here."
          />
        </div>

        {/* Two-column: Recent Sessions + My Applications */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <SectionHeader
              icon={ClockIcon}
              title="Recent Sessions"
              viewAllTo="/candidate/results"
            />

            <SessionGrid
              sessions={recentSessions.slice(0, 2)}
              emptyTitle="No completed interviews yet"
              emptySubtitle="Interviews you've finished will show up here."
            />
          </div>

          <div>
            <SectionHeader
              icon={TrendingUpIcon}
              title="My Applications"
              viewAllTo="/candidate/jobs"
            />

            <div
              className="rounded-xl px-5"
              style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
            >
              {recentApplications.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm" style={{ color: THEME.inkFaint }}>
                    No applications yet — browse the Jobs Board to apply.
                  </p>
                </div>
              ) : (
                <div>
                  {recentApplications.map((a) => (
                    <ApplicationRow key={a._id} application={a} />
                  ))}
                </div>
              )}
            </div>

            {(avgQuizScore !== null || avgCodingScore !== null) && (
              <div
                className="rounded-xl p-5 mt-4 space-y-4"
                style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
              >
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: THEME.inkFaint }}>
                  Readiness Snapshot
                </div>
                {avgQuizScore !== null && (
                  <ProgressBar label="Quiz Accuracy" value={avgQuizScore} tone={THEME.info} />
                )}
                {avgCodingScore !== null && (
                  <ProgressBar label="Coding Score" value={avgCodingScore} tone={THEME.success} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2
            className="mb-5"
            style={{ fontFamily: THEME.fontDisplay, fontSize: 19, fontWeight: 600, color: THEME.ink, letterSpacing: "-0.01em" }}
          >
            Quick Links
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <QuickLink
              to="/candidate/jobs"
              icon={BriefcaseIcon}
              title="Jobs Board"
              subtitle="Browse and apply for open roles"
            />
            <QuickLink
              to="/candidate/sessions"
              icon={CalendarDaysIcon}
              title="Browse Sessions"
              subtitle="Find and join an available interview"
            />
            <QuickLink
              to="/candidate/interviews"
              icon={ClipboardListIcon}
              title="My Interviews"
              subtitle="See everything you're scheduled for"
            />
            <QuickLink
              to="/candidate/results"
              icon={BarChart3Icon}
              title="My Results"
              subtitle="Review your past interview outcomes"
            />
            <QuickLink
              to="/candidate/profile"
              icon={UserCircleIcon}
              title="My Profile"
              subtitle="Keep your details up to date"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default CandidateDashboard;
