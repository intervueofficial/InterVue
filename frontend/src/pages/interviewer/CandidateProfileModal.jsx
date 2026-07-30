import { useEffect } from "react";
import { X, UserCircle, Mail, Phone, GraduationCap, Briefcase, FileText } from "lucide-react";

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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[cardIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card header — banner with photo overlapping, like an ID / profile card */}
        <div className="relative bg-black pt-10 pb-16 px-8">
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-8 -mt-14 pb-2">
          <div className="w-24 h-24 rounded-2xl bg-neutral-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
            {candidate.profileImage ? (
              <img
                src={candidate.profileImage}
                alt={candidate.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="text-neutral-400" size={44} />
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
              {candidate.name}
            </h2>
            <p className="text-neutral-500 text-sm flex items-center gap-1.5 mt-0.5">
              <Mail size={13} /> {candidate.email}
            </p>
          </div>
        </div>

        <div className="px-8 pb-8 pt-4 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-5 pt-4 border-t border-neutral-100">
            {snapshot.phone && (
              <div className="flex items-start gap-2.5">
                <Phone size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wide">
                    Phone
                  </p>
                  <p className="text-neutral-800 text-sm mt-0.5">{snapshot.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2.5">
              <GraduationCap size={16} className="text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wide">
                  Education
                </p>
                <p className="text-neutral-800 text-sm mt-0.5">
                  {snapshot.degree || "—"}
                  {snapshot.fieldOfStudy ? `, ${snapshot.fieldOfStudy}` : ""}
                </p>
                <p className="text-neutral-400 text-xs mt-0.5">
                  {snapshot.institution}
                  {snapshot.yearOfGraduation ? ` · Class of ${snapshot.yearOfGraduation}` : ""}
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
                  {snapshot.experienceYears ?? 0} years
                </p>
              </div>
            </div>
            {snapshot.resumeUrl && (
              <div className="flex items-start gap-2.5">
                <FileText size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wide">
                    Resume
                  </p>
                  <a
                    href={snapshot.resumeUrl}
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

          <div className="pt-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wide mb-2.5">
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {(snapshot.skills || []).length > 0 ? (
                snapshot.skills.map((s, i) => (
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