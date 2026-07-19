import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Plus, Briefcase, MapPin, Users, Lock, Unlock, Pencil, Trash2 } from "lucide-react";

import { jobApi } from "../../api/jobApi";
import JobForm from "./JobForm";
import DeleteModal from "./DeleteModal";

const Jobs = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [openForm, setOpenForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => jobApi.getAllJobs(await getToken()),
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
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm ring-1 ring-blue-100">
            <Briefcase className="text-blue-600" size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Job Postings</h1>
            <p className="text-slate-500 text-sm">
              Create job roles with eligibility criteria for candidates to apply to.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingJob(null);
            setOpenForm(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-shadow"
        >
          <Plus size={18} /> Post New Job
        </button>
      </motion.div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No job postings yet. Click "Post New Job" to create one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <div key={job._id} className="p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        job.status === "open"
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {job.status === "open" ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {job.location}
                    </span>
                    <span>{job.employmentType}</span>
                    {job.department && <span>{job.department}</span>}
                  </div>
                  {job.criteria?.requiredDegrees?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.criteria.requiredDegrees.map((d, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                          {d}
                        </span>
                      ))}
                      {job.criteria.requiredSkills?.map((s, i) => (
                        <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                      {job.criteria.minExperience > 0 && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                          {job.criteria.minExperience}+ yrs exp
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatusMutation.mutate(job)}
                    title={job.status === "open" ? "Close job" : "Reopen job"}
                    className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
                  >
                    {job.status === "open" ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingJob(job);
                      setOpenForm(true);
                    }}
                    className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeletingJob(job)}
                    className="w-10 h-10 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
