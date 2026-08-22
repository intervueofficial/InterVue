import { Clock3, LogOut, XCircle } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { THEME } from "../constants/theme";

/**
 * Shown in place of the normal interviewer dashboard/sidebar whenever
 * the signed-in interviewer's `interviewerApproval.status` isn't yet
 * "approved" — see App.jsx, which routes every interviewer-only path
 * here instead of the real page while pending/rejected. Deliberately
 * not a silent 403: the person always sees exactly where they stand.
 */
const InterviewerPendingApproval = ({ status = "pending", note = "" }) => {
  const { signOut } = useClerk();
  const isRejected = status === "rejected";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center"
      style={{ background: THEME.background, fontFamily: THEME.fontSans }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: isRejected ? "#FEF2F2" : THEME.primaryTint,
          border: `1px solid ${isRejected ? "#FECACA" : THEME.primaryTintBorder}`,
        }}
      >
        {isRejected ? (
          <XCircle size={28} color="#DC2626" />
        ) : (
          <Clock3 size={28} color={THEME.primary} />
        )}
      </div>

      <h1
        style={{
          fontFamily: THEME.fontDisplay,
          fontSize: 24,
          fontWeight: 600,
          color: THEME.ink,
        }}
      >
        {isRejected
          ? "Your interviewer application was not approved"
          : "Your interviewer access is pending admin approval"}
      </h1>

      <p className="max-w-md text-sm" style={{ color: THEME.inkMuted }}>
        {isRejected
          ? "An admin has reviewed your request and it wasn't approved. If you think this is a mistake, please reach out to your admin team."
          : "Thanks for signing up as an interviewer! An admin needs to review and approve your account before you can access interviews, applicants, or interview content. We'll email you as soon as a decision is made."}
      </p>

      {note && (
        <div
          className="max-w-md rounded-xl border px-4 py-3 text-left text-sm"
          style={{ borderColor: THEME.border, background: THEME.surface2, color: THEME.inkMuted }}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: THEME.inkFaint }}>
            Note from admin
          </p>
          {note}
        </div>
      )}

      <button
        onClick={() => signOut()}
        className="mt-2 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-black/5"
        style={{ borderColor: THEME.border, color: THEME.ink }}
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  );
};

export default InterviewerPendingApproval;
