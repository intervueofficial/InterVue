import { X, UserCircle, Mail, Phone, GraduationCap, Briefcase, FileText } from "lucide-react";

// Shown when an interviewer clicks "View Profile" on an applicant row.
// Surfaces the candidate's uploaded photo (Cloudinary) alongside the
// skills/profile snapshot captured at application time.
const CandidateProfileModal = ({ application, onClose }) => {
  if (!application) return null;

  const candidate = application.candidate || {};
  const snapshot = application.profileSnapshot || {};

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start px-8 py-6 border-b bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden shrink-0">
              {candidate.profileImage ? (
                <img
                  src={candidate.profileImage}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="text-blue-600" size={32} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
              <p className="text-slate-500 text-sm flex items-center gap-1.5">
                <Mail size={13} /> {candidate.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-200 flex items-center justify-center shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {snapshot.phone && (
              <div className="flex items-start gap-2">
                <Phone size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Phone</p>
                  <p className="text-slate-700 text-sm">{snapshot.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <GraduationCap size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Education</p>
                <p className="text-slate-700 text-sm">
                  {snapshot.degree || "—"}
                  {snapshot.fieldOfStudy ? `, ${snapshot.fieldOfStudy}` : ""}
                </p>
                <p className="text-slate-400 text-xs">
                  {snapshot.institution}
                  {snapshot.yearOfGraduation ? ` · Class of ${snapshot.yearOfGraduation}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Experience</p>
                <p className="text-slate-700 text-sm">{snapshot.experienceYears ?? 0} years</p>
              </div>
            </div>
            {snapshot.resumeUrl && (
              <div className="flex items-start gap-2">
                <FileText size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Resume</p>
                  <a
                    href={snapshot.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    View resume
                  </a>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {(snapshot.skills || []).length > 0 ? (
                snapshot.skills.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-sm">No skills listed</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileModal;
