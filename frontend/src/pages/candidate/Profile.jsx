import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Camera,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  UserCircle,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Lock,
  Cake,
} from "lucide-react";

import useAuthUser from "../../hooks/useAuthUser";
import { authApi } from "../../api/auth";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import IdentityVerificationCard from "../../components/IdentityVerificationCard";
import { THEME } from "../../constants/theme";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10MB
const RESUME_ACCEPT = ".pdf,.doc,.docx";
const RESUME_MIME_WHITELIST = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });

const fileNameFromUrl = (url) => {
  if (!url) return "";
  try {
    const clean = url.split("?")[0];
    return decodeURIComponent(clean.substring(clean.lastIndexOf("/") + 1)) || "Resume";
  } catch {
    return "Resume";
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ─── Shared primitives, in THEME's own idiom ────────────────────────────── */

function Eyebrow({ children }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{ color: THEME.inkFaint, fontFamily: THEME.fontMono }}
    >
      {children}
    </span>
  );
}

function SectionCard({ eyebrow, title, subtitle, index, children }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index}
      className="rounded-xl p-6 sm:p-7"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div className="mb-6">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h3
          className="text-base font-semibold leading-tight mt-1"
          style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: THEME.inkMuted }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function Field({ label, required, icon: Icon, children }) {
  return (
    <div>
      <label
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: THEME.inkMuted, fontFamily: THEME.fontMono }}
      >
        {Icon && <Icon size={11} />}
        {label}
        {required && <span style={{ color: THEME.primary }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const Profile = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: authUser } = useAuthUser();
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

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

  const inputStyle = {
    background: THEME.surface,
    border: `1px solid ${THEME.border}`,
    color: THEME.ink,
    fontFamily: THEME.fontSans,
  };

  const fieldClass =
    "mt-1.5 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[13px]";

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
    if (form.skills.includes(skillInput.trim())) {
      setSkillInput("");
      return;
    }
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

  // Uploads a resume file (PDF/DOC/DOCX) and stores the returned URL in
  // the same resumeUrl field the manual link input writes to, so both
  // paths converge on one source of truth.
  const uploadResumeMutation = useMutation({
    mutationFn: async (file) => {
      const dataUrl = await readFileAsDataUrl(file);
      return authApi.uploadResume(dataUrl, await getToken());
    },
    onSuccess: async (data) => {
      const url =
        data?.resumeUrl ||
        data?.user?.candidateProfile?.resumeUrl ||
        data?.url ||
        "";
      if (url) update("resumeUrl", url);
      toast.success("Resume uploaded");
      await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Failed to upload resume"),
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

  const handleResumeSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const looksLikeAllowedType =
      RESUME_MIME_WHITELIST.includes(file.type) || /\.(pdf|docx?)$/i.test(file.name);

    if (!looksLikeAllowedType) {
      toast.error("Please upload a PDF or Word document.");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toast.error("Resume must be smaller than 10MB.");
      return;
    }

    uploadResumeMutation.mutate(file);
  };

  const isIdentityVerified = Boolean(authUser?.identityVerification?.verified);

  // Mirrors the backend's isComplete rule exactly (authController.js) —
  // education fields, at least one skill, a resume, AND identity
  // verification.
  const requiredFields = [
    form.degree,
    form.fieldOfStudy,
    form.yearOfGraduation,
    form.skills.length > 0,
    Boolean(form.resumeUrl),
    isIdentityVerified,
  ];
  const completedCount = requiredFields.filter(Boolean).length;
  const isComplete = completedCount === requiredFields.length;
  const completionPct = Math.round((completedCount / requiredFields.length) * 100);

  const photoSrc = authUser?.profileImage
    ? `${authUser.profileImage}${authUser.profileImage.includes("?") ? "&" : "?"}v=${photoVersion}`
    : null;

  return (
    <AppShell scope="candidate">
      <PageHeader
        eyebrow="Candidate"
        title="My Profile"
        description="Keep this up to date — it's what jobs are matched against when you apply, and what interviewers see on your profile card."
      />

      <div
        className="mt-6 max-w-3xl space-y-5"
        style={{ fontFamily: THEME.fontSans }}
      >
        {/* Identity + completeness — quiet, editorial, no gradient banner */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="rounded-xl p-6 sm:p-7"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
              className="relative group w-20 h-20 rounded-lg overflow-hidden shrink-0 focus:outline-none"
              style={{ border: `1px solid ${THEME.border}` }}
              title="Upload profile picture"
            >
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{ background: THEME.surface2 }}
              >
                {photoSrc ? (
                  <img
                    key={photoSrc}
                    src={photoSrc}
                    alt={authUser?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle style={{ color: THEME.inkFaint }} size={34} />
                )}
              </div>

              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                style={{ background: "rgba(23,23,31,0.55)" }}
              >
                {uploadPhotoMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} style={{ color: "#fff" }} />
                ) : (
                  <Camera size={18} style={{ color: "#fff" }} />
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

            <div className="flex-1 min-w-0">
              <h2
                className="text-lg font-semibold leading-tight truncate"
                style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}
              >
                {authUser?.name}
              </h2>
              <p
                className="text-sm flex items-center gap-1.5 mt-0.5"
                style={{ color: THEME.inkMuted }}
              >
                <Mail size={12} style={{ color: THEME.inkFaint }} /> {authUser?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors self-start sm:self-auto"
              style={{ color: THEME.ink, border: `1px solid ${THEME.border}` }}
            >
              <Camera size={12} />
              {authUser?.profileImage ? "Change photo" : "Add a photo"}
            </button>
          </div>

          {/* Completeness meter */}
          <div className="mt-6 flex items-center gap-3">
            <div
              className="flex-1 h-[3px] rounded-full overflow-hidden"
              style={{ background: THEME.surface2 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: isComplete ? THEME.success : THEME.primary }}
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span
              className="text-xs font-semibold shrink-0 flex items-center gap-1 tabular-nums"
              style={{
                color: isComplete ? THEME.success : THEME.inkMuted,
                fontFamily: THEME.fontMono,
              }}
            >
              {isComplete && <CheckCircle2 size={13} />}
              {completionPct}%
            </span>
          </div>

          {!isComplete && (
            <p
              className="mt-3 text-xs rounded-lg px-3 py-2 inline-block"
              style={{
                color: THEME.warning,
                background: THEME.warningTint,
                border: `1px solid ${THEME.warningBorder}`,
              }}
            >
              Add your degree, field of study, graduation year, at least one skill, your resume,
              and verify your identity to be able to apply for jobs.
            </p>
          )}
        </motion.div>

        {/* Duplicate-account prevention */}
        <IdentityVerificationCard index={0.5} />

        {/* Contact & Education */}
        <SectionCard
          eyebrow="01 — Background"
          title="Contact & education"
          index={1}
        >
          {isIdentityVerified && (
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <Field label="Full Name (from Aadhaar)" icon={Lock}>
                <div
                  className={`${fieldClass} flex items-center`}
                  style={{ ...inputStyle, background: THEME.surface2, color: THEME.inkMuted }}
                >
                  {authUser?.identityVerification?.verifiedName || authUser?.name}
                </div>
              </Field>
              <Field label="Date of Birth (from Aadhaar)" icon={Cake}>
                <div
                  className={`${fieldClass} flex items-center`}
                  style={{ ...inputStyle, background: THEME.surface2, color: THEME.inkMuted }}
                >
                  {authUser?.identityVerification?.verifiedDob || "—"}
                </div>
              </Field>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Phone" icon={Phone}>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className={fieldClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Degree" required>
              <input
                value={form.degree}
                onChange={(e) => update("degree", e.target.value)}
                placeholder="e.g. B.Tech"
                className={fieldClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Field of Study" required>
              <input
                value={form.fieldOfStudy}
                onChange={(e) => update("fieldOfStudy", e.target.value)}
                placeholder="e.g. Computer Science"
                className={fieldClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Institution">
              <input
                value={form.institution}
                onChange={(e) => update("institution", e.target.value)}
                placeholder="e.g. IIT Delhi"
                className={fieldClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Year of Graduation" required>
              <input
                type="number"
                value={form.yearOfGraduation}
                onChange={(e) => update("yearOfGraduation", e.target.value)}
                placeholder="2026"
                className={fieldClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Years of Experience" icon={Briefcase}>
              <input
                type="number"
                min={0}
                value={form.experienceYears}
                onChange={(e) => update("experienceYears", Number(e.target.value))}
                className={fieldClass}
                style={inputStyle}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Skills */}
        <SectionCard eyebrow="02 — Skills" title="What you're strongest at" index={2}>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="e.g. React — press Enter to add"
              className={`${fieldClass} mt-0 flex-1`}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 rounded-lg transition-colors"
              style={{ background: THEME.surface2, color: THEME.ink }}
            >
              <Plus size={16} />
            </button>
          </div>

          {form.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3.5">
              {form.skills.map((s, i) => (
                <motion.span
                  key={s}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="group flex items-center gap-1.5 text-xs font-medium pl-3 pr-2 py-1.5 rounded-full"
                  style={{
                    background: THEME.primaryTint,
                    color: THEME.primary,
                    border: `1px solid ${THEME.primaryTintBorder}`,
                  }}
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(i)}
                    className="opacity-50 group-hover:opacity-100 transition"
                    style={{ color: THEME.primary }}
                    aria-label={`Remove ${s}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </motion.span>
              ))}
            </div>
          ) : (
            <p className="text-xs mt-3.5" style={{ color: THEME.inkFaint }}>
              No skills added yet — add at least one to be eligible for jobs.
            </p>
          )}
        </SectionCard>

        {/* Resume */}
        <SectionCard
          eyebrow="03 — Resume"
          title="Resume"
          subtitle="Shown to interviewers on your profile card"
          index={3}
        >
          <button
            type="button"
            onClick={() => resumeInputRef.current?.click()}
            disabled={uploadResumeMutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              border: `1px dashed ${THEME.borderStrong}`,
              color: THEME.inkMuted,
            }}
          >
            {uploadResumeMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Uploading...
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                {form.resumeUrl ? "Upload a new version" : "Upload PDF or Word doc (max 10MB)"}
              </>
            )}
          </button>

          <input
            ref={resumeInputRef}
            type="file"
            accept={RESUME_ACCEPT}
            className="hidden"
            onChange={handleResumeSelect}
          />

          {form.resumeUrl && (
            <a
              href={form.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm w-fit transition-colors"
              style={{
                background: THEME.successTint,
                border: `1px solid ${THEME.successBorder}`,
                color: THEME.ink,
              }}
            >
              <FileText size={14} style={{ color: THEME.success }} className="shrink-0" />
              {fileNameFromUrl(form.resumeUrl)}
              <ExternalLink size={12} style={{ color: THEME.success }} />
            </a>
          )}

          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${THEME.border}` }}>
            <label
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: THEME.inkFaint, fontFamily: THEME.fontMono }}
            >
              Or paste a link (Google Drive / Dropbox)
            </label>
            <input
              value={form.resumeUrl}
              onChange={(e) => update("resumeUrl", e.target.value)}
              placeholder="https://drive.google.com/..."
              className={fieldClass}
              style={inputStyle}
            />
          </div>
        </SectionCard>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="flex justify-end"
        >
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 rounded-lg px-7 py-3 font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{ background: THEME.ink, color: "#fff" }}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
};

export default Profile;