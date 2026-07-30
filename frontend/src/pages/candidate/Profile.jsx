import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Camera, Loader2, Plus, Trash2, UserCircle } from "lucide-react";

import useAuthUser from "../../hooks/useAuthUser";
import { authApi } from "../../api/auth";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });

const Profile = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    phone: "",
    degree: "",
    fieldOfStudy: "",
    institution: "",
    yearOfGraduation: "",
    experienceYears: 0,
    skills: [],
    resumeUrl: "",
  });

  const [skillInput, setSkillInput] = useState("");

  // Cloudinary uploads for a given user often reuse the same public_id
  // (so old versions get overwritten instead of piling up), which means
  // the returned URL string can be byte-identical to the previous one.
  // React re-rendering with "new" data doesn't help in that case — the
  // <img> tag never changes its src, so the browser just serves the old
  // cached image. Appending a local version bump forces a real reload.
  const [photoVersion, setPhotoVersion] = useState(0);

  useEffect(() => {
    if (authUser?.candidateProfile) {
      const p = authUser.candidateProfile;
      setForm({
        phone: p.phone || "",
        degree: p.degree || "",
        fieldOfStudy: p.fieldOfStudy || "",
        institution: p.institution || "",
        yearOfGraduation: p.yearOfGraduation || "",
        experienceYears: p.experienceYears || 0,
        skills: p.skills || [],
        resumeUrl: p.resumeUrl || "",
      });
    }
  }, [authUser]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addSkill = () => {
    if (!skillInput.trim()) return;
    update("skills", [...form.skills, skillInput.trim()]);
    setSkillInput("");
  };

  const removeSkill = (i) => update("skills", form.skills.filter((_, idx) => idx !== i));

  const saveMutation = useMutation({
    mutationFn: async () => authApi.updateProfile(form, await getToken()),
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to save profile"),
  });

  // Uploads directly to Cloudinary via the backend, then refreshes the
  // cached user so the new photo shows up everywhere immediately —
  // including on the profile card an interviewer sees in Applicants.
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const dataUrl = await readFileAsDataUrl(file);
      return authApi.uploadProfileImage(dataUrl, await getToken());
    },
    onSuccess: async () => {
      toast.success("Profile picture updated");
      await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      // Bump the cache-buster after the refetch resolves so the <img>
      // src is guaranteed to change even if Cloudinary returned the
      // exact same URL as before.
      setPhotoVersion((v) => v + 1);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Failed to upload photo"),
  });

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    uploadPhotoMutation.mutate(file);
  };

  const isComplete =
    form.degree && form.fieldOfStudy && form.yearOfGraduation && form.skills.length > 0;

  const photoSrc = authUser?.profileImage
    ? `${authUser.profileImage}${authUser.profileImage.includes("?") ? "&" : "?"}v=${photoVersion}`
    : null;

  return (
    <AppShell scope="candidate">
      <PageHeader
        eyebrow="Candidate"
        title="My Profile"
        description="Keep this up to date — it's what jobs are matched against when you apply."
      />

      <div className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-2xl">
        {!isComplete && (
          <div className="mb-6 rounded-xl bg-amber-50 text-amber-700 text-sm px-4 py-3">
            Complete your profile (degree, field of study, graduation year, and at least one
            skill) to be able to apply for jobs.
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhotoMutation.isPending}
            className="relative group w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Upload profile picture"
          >
            {photoSrc ? (
              <img
                key={photoSrc}
                src={photoSrc}
                alt={authUser?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="text-blue-600" size={32} />
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              {uploadPhotoMutation.isPending ? (
                <Loader2 className="text-white animate-spin" size={20} />
              ) : (
                <Camera className="text-white" size={20} />
              )}
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          <div>
            <h2 className="font-bold text-lg">{authUser?.name}</h2>
            <p className="text-sm text-slate-500">{authUser?.email}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1"
            >
              {authUser?.profileImage ? "Change photo" : "Add a photo"}
            </button>
            <p className="text-xs text-slate-400 mt-0.5">
              Visible to interviewers on your profile card. Max 5MB.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Degree *</label>
            <input
              value={form.degree}
              onChange={(e) => update("degree", e.target.value)}
              placeholder="e.g. B.Tech"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Field of Study *</label>
            <input
              value={form.fieldOfStudy}
              onChange={(e) => update("fieldOfStudy", e.target.value)}
              placeholder="e.g. Computer Science"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Institution</label>
            <input
              value={form.institution}
              onChange={(e) => update("institution", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Year of Graduation *</label>
            <input
              type="number"
              value={form.yearOfGraduation}
              onChange={(e) => update("yearOfGraduation", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Years of Experience</label>
            <input
              type="number"
              min={0}
              value={form.experienceYears}
              onChange={(e) => update("experienceYears", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-slate-700">Skills *</label>
          <div className="flex gap-2 mt-1">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="e.g. React — press Enter"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 rounded-xl bg-slate-100 hover:bg-slate-200"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.skills.map((s, i) => (
              <span
                key={i}
                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {s}
                <Trash2 size={12} className="cursor-pointer" onClick={() => removeSkill(i)} />
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-slate-700">Resume Link (optional)</label>
          <input
            value={form.resumeUrl}
            onChange={(e) => update("resumeUrl", e.target.value)}
            placeholder="Google Drive / Dropbox link"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </div>
    </AppShell>
  );
};

export default Profile;