import { useEffect } from "react";
import { X, UserCircle, Mail, Phone, GraduationCap, Briefcase, FileText, Sparkles, CheckCircle2, XCircle } from "lucide-react";

// Shown when an interviewer clicks "View Profile" on an applicant row.
// Surfaces the candidate's uploaded photo (Cloudinary) alongside the
// skills/profile snapshot captured at application time.
const CandidateProfileModal = ({ application, onClose }) => {
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!application) return null;

  const candidate = application.candidate || {};
  const snapshot = application.profileSnapshot || {};

  // The candidate's profile (photo, resume, skills, ...) can change after
  // they applied. Prefer whatever's live on their account over the
  // snapshot frozen at application time, falling back to the snapshot
  // only for fields the live profile doesn't have (e.g. very old
  // applications from before a field existed).
  const live = candidate.candidateProfile || {};
  const info = {
    ...snapshot,
    ...Object.fromEntries(
      Object.entries(live).filter(([, v]) =>
        Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ""
      )
    ),
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col sm:flex-row animate-[cardIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Identity panel — the "card" half: photo, name, contact */}
        <div className="relative bg-black text-white px-8 py-10 sm:w-64 shrink-0 flex flex-col items-center text-center">
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors sm:hidden"
          >
            <X size={16} />
          </button>

          <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
            {candidate.profileImage ? (
              <img
                src={candidate.profileImage}
                alt={candidate.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="text-white/50" size={44} />
            )}
          </div>

          <h2 className="mt-4 text-lg font-semibold tracking-tight leading-tight">
            {candidate.name}
          </h2>
          <p className="text-white/60 text-xs flex items-center justify-center gap-1.5 mt-1.5 break-all">
            <Mail size={12} className="shrink-0" /> {candidate.email}
          </p>
          {info.phone && (
            <p className="text-white/60 text-xs flex items-center justify-center gap-1.5 mt-1">
              <Phone size={12} className="shrink-0" /> {info.phone}
            </p>
          )}
        </div>

        {/* Details panel */}
        <div className="relative flex-1 min-w-0">
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="hidden sm:flex absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>

          <div className="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-5">
              <div className="flex items-start gap-2.5">
                <GraduationCap size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wide">
                    Education
                  </p>
                  <p className="text-neutral-800 text-sm mt-0.5">
                    {info.degree || "—"}
                    {info.fieldOfStudy ? `, ${info.fieldOfStudy}` : ""}
                  </p>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    {info.institution}
                    {info.yearOfGraduation ? ` · Class of ${info.yearOfGraduation}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Briefcase size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wide">
                    Experience
                  </p>
                  <p className="text-neutral-800 text-sm mt-0.5">
                    {info.experienceYears ?? 0} years
                  </p>
                </div>
              </div>
              {info.resumeUrl && (
                <div className="flex items-start gap-2.5">
                  <FileText size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wide">
                      Resume
                    </p>
                    <a
                      href={info.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-900 text-sm font-medium hover:underline mt-0.5 inline-block"
                    >
                      View resume →
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-5 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wide mb-2.5">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {(info.skills || []).length > 0 ? (
                  info.skills.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium bg-neutral-100 text-neutral-800 px-3 py-1.5 rounded-full border border-neutral-200"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-neutral-400 text-sm">No skills listed</span>
                )}
              </div>
            </div>

            {application.aiFitScore != null && (
              <div className="pt-5 border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-indigo-500" />
                  <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wide">
                    AI Fit Assessment
                  </p>
                  <span
                    className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${
                      application.aiFitScore >= 75
                        ? "bg-emerald-50 text-emerald-700"
                        : application.aiFitScore >= 50
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {application.aiFitScore}/100
                  </span>
                </div>

                {application.aiFitSummary && (
                  <p className="text-sm text-neutral-700 mt-2 leading-relaxed">
                    {application.aiFitSummary}
                  </p>
                )}

                {(application.aiFitBreakdown?.skillsMatched?.length > 0 ||
                  application.aiFitBreakdown?.skillsMissing?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {application.aiFitBreakdown?.skillsMatched?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Matched
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {application.aiFitBreakdown.skillsMatched.map((s, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {application.aiFitBreakdown?.skillsMissing?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-red-500 mb-1.5 flex items-center gap-1">
                          <XCircle size={12} /> Missing
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {application.aiFitBreakdown.skillsMissing.map((s, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium bg-red-50 text-red-600 px-2 py-1 rounded-full"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(application.aiFitBreakdown?.experienceFit ||
                  application.aiFitBreakdown?.educationFit ||
                  application.aiFitBreakdown?.resumeQualitySignal) && (
                  <div className="mt-3 space-y-1.5 text-xs text-neutral-500">
                    {application.aiFitBreakdown?.experienceFit && (
                      <p>
                        <span className="font-semibold text-neutral-600">Experience: </span>
                        {application.aiFitBreakdown.experienceFit}
                      </p>
                    )}
                    {application.aiFitBreakdown?.educationFit && (
                      <p>
                        <span className="font-semibold text-neutral-600">Education: </span>
                        {application.aiFitBreakdown.educationFit}
                      </p>
                    )}
                    {application.aiFitBreakdown?.resumeQualitySignal && (
                      <p>
                        <span className="font-semibold text-neutral-600">Resume: </span>
                        {application.aiFitBreakdown.resumeQualitySignal}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CandidateProfileModal;