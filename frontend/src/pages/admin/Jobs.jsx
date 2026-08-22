import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Plus,
  Briefcase,
  MapPin,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  AlertTriangleIcon,
  RefreshCwIcon,
} from "lucide-react";

import { jobApi } from "../../api/jobApi";
import PageHeader from "../../components/PageHeader";
import AutoRefreshBar from "../../components/admin/AutoRefreshBar";
import AppLoader from "../../components/AppLoader";
import { THEME } from "../../constants/theme";

import JobForm from "./JobForm";
import DeleteModal from "./DeleteModal";
import EmptyState from "./EmptyState";

const Jobs = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [openForm, setOpenForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => jobApi.getAllJobs(await getToken()),
    retry: 1,
  });

  const jobs = data?.jobs || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });

  const createMutation = useMutation({
    mutationFn: async (job) => jobApi.createJob(job, await getToken()),
    onSuccess: () => {
      toast.success("Job posted");
      invalidate();
      setOpenForm(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to post job"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, job }) => jobApi.updateJob(id, job, await getToken()),
    onSuccess: () => {
      toast.success("Job updated");
      invalidate();
      setOpenForm(false);
      setEditingJob(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to update job"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (job) =>
      jobApi.updateJob(
        job._id,
        { status: job.status === "open" ? "closed" : "open" },
        await getToken()
      ),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => jobApi.deleteJob(id, await getToken()),
    onSuccess: () => {
      toast.success("Job deleted");
      invalidate();
      setDeletingJob(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to delete job"),
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
          title="Job Postings"
          description="Create job roles with eligibility criteria for candidates to apply to."
          actions={
            <>
              <AutoRefreshBar onRefresh={refetch} isFetching={isFetching} intervalSeconds={30} />
              <button
                onClick={() => {
                  setEditingJob(null);
                  setOpenForm(true);
                }}
                className="flex items-center gap-2 rounded-lg font-semibold text-sm px-4 py-2.5 transition-colors"
                style={{ background: THEME.ink, color: THEME.surface }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Plus size={16} />
                Post New Job
              </button>
            </>
          }
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
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
              Couldn't load job postings
            </p>
            <p className="text-xs mt-1 mb-4" style={{ color: THEME.inkFaint }}>
              Something went wrong fetching job postings.
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
        ) : isLoading ? (
          <div
            className="rounded-xl p-16 flex justify-center"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
          >
            <AppLoader />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            title="No job postings yet"
            description={`Click "Post New Job" to create one.`}
          />
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
          >
            <div style={{ borderTop: `1px solid transparent` }}>
              {jobs.map((job, i) => (
                <div
                  key={job._id}
                  className="p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 transition-colors"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${THEME.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-base" style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}>
                        {job.title}
                      </h3>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: job.status === "open" ? THEME.successTint : THEME.surface2,
                          color: job.status === "open" ? THEME.success : THEME.inkMuted,
                          boxShadow: `inset 0 0 0 1px ${job.status === "open" ? THEME.successBorder : THEME.border}`,
                        }}
                      >
                        {job.status === "open" ? "Open" : "Closed"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm" style={{ color: THEME.inkMuted }}>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} color={THEME.inkFaint} /> {job.location}
                      </span>
                      <span>{job.employmentType}</span>
                      {job.fieldOfStudy && <span>{job.fieldOfStudy}</span>}
                    </div>

                    {job.criteria?.requiredDegrees?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.criteria.requiredDegrees.map((d, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ background: THEME.surface2, color: THEME.inkMuted, border: `1px solid ${THEME.border}` }}
                          >
                            {d}
                          </span>
                        ))}
                        {job.criteria.requiredSkills?.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ background: THEME.primaryTint, color: THEME.primary, border: `1px solid ${THEME.primaryTintBorder}` }}
                          >
                            {s}
                          </span>
                        ))}
                        {job.criteria.minExperience > 0 && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ background: THEME.warningTint, color: THEME.warning, border: `1px solid ${THEME.warningBorder}` }}
                          >
                            {job.criteria.minExperience}+ yrs exp
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleStatusMutation.mutate(job)}
                      title={job.status === "open" ? "Close job" : "Reopen job"}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                      style={{ border: `1px solid ${THEME.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {job.status === "open" ? (
                        <Lock size={14} color={THEME.inkMuted} />
                      ) : (
                        <Unlock size={14} color={THEME.inkMuted} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingJob(job);
                        setOpenForm(true);
                      }}
                      title="Edit"
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                      style={{ border: `1px solid ${THEME.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.primaryTint)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Pencil size={14} color={THEME.primary} />
                    </button>
                    <button
                      onClick={() => setDeletingJob(job)}
                      title="Delete"
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                      style={{ border: `1px solid ${THEME.dangerBorder}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.dangerTint)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Trash2 size={14} color={THEME.danger} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <JobForm
        open={openForm}
        job={editingJob}
        loading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setOpenForm(false);
          setEditingJob(null);
        }}
        onSubmit={(form) =>
          editingJob
            ? updateMutation.mutate({ id: editingJob._id, job: form })
            : createMutation.mutate(form)
        }
      />

      <DeleteModal
        open={!!deletingJob}
        title={deletingJob?.title}
        description="All applications for this job will also be deleted."
        loading={deleteMutation.isPending}
        onCancel={() => setDeletingJob(null)}
        onConfirm={() => deleteMutation.mutate(deletingJob._id)}
      />
    </div>
  );
};

export default Jobs;
