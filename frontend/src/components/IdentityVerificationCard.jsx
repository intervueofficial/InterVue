import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ShieldCheck, ShieldAlert, Loader2, ExternalLink } from "lucide-react";

import { identityApi } from "../api/auth";
import { THEME } from "../constants/theme";

const REDIRECT_MESSAGES = {
  verified: { type: "success", text: "Identity verified via DigiLocker." },
  already_verified: { type: "success", text: "Your identity was already verified." },
  duplicate: {
    type: "error",
    text: "This identity is already linked to another InterVue account. Duplicate accounts aren't allowed.",
  },
  failed: { type: "error", text: "Identity verification failed. Please try again." },
};

/**
 * Duplicate-account prevention: a candidate can trivially sign up with
 * a new email address, but Aadhaar (verified via DigiLocker) is
 * biometrically unique per person at the UIDAI level — so one verified
 * identity can only ever be linked to one InterVue account. See
 * backend/IDENTITY_VERIFICATION_SETUP.md for how to set this up.
 */
function IdentityVerificationCard({ index = 0 }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data } = useQuery({
    queryKey: ["identity-status"],
    queryFn: async () => identityApi.getStatus(await getToken()),
  });

  // Handle the redirect back from DigiLocker (?identity=verified|failed|duplicate)
  useEffect(() => {
    const status = searchParams.get("identity");
    if (!status) return;

    const message = REDIRECT_MESSAGES[status];
    if (message) {
      if (message.type === "success") toast.success(message.text);
      else toast.error(message.text);
    }

    queryClient.invalidateQueries({ queryKey: ["identity-status"] });
    queryClient.invalidateQueries({ queryKey: ["auth-user"] });

    // Clean the query params out of the URL so a refresh doesn't
    // re-show the toast.
    searchParams.delete("identity");
    searchParams.delete("reason");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMutation = useMutation({
    mutationFn: async () => identityApi.startVerification(await getToken()),
    onSuccess: (res) => {
      if (res.alreadyVerified) {
        toast.success("You're already verified.");
        queryClient.invalidateQueries({ queryKey: ["identity-status"] });
        return;
      }
      if (res.redirectUrl) {
        // Full-page redirect — DigiLocker's OAuth flow can't run in an
        // XHR/iframe, it needs to take over the browser tab.
        window.location.href = res.redirectUrl;
      }
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Couldn't start identity verification"),
  });

  const verification = data?.verification;
  const configured = data?.configured;
  const isVerified = Boolean(verification?.verified);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl p-6 sm:p-7"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: isVerified ? THEME.successTint || "#ECFDF5" : THEME.surface2,
            }}
          >
            {isVerified ? (
              <ShieldCheck size={18} color={THEME.success} />
            ) : (
              <ShieldAlert size={18} color={THEME.inkFaint} />
            )}
          </div>
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold"
              style={{ color: THEME.ink, fontFamily: THEME.fontDisplay }}
            >
              Identity Verification
            </h3>
            {isVerified ? (
              <p className="text-xs mt-1" style={{ color: THEME.inkMuted }}>
                Verified via DigiLocker
                {verification.maskedAadhaar ? ` · Aadhaar ${verification.maskedAadhaar}` : ""}
                {verification.verifiedAt
                  ? ` · ${new Date(verification.verifiedAt).toLocaleDateString()}`
                  : ""}
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: THEME.inkMuted }}>
                Verify your identity once via DigiLocker (Aadhaar-backed) to prevent
                duplicate accounts. This never shares your Aadhaar number with us — only
                a verified, masked record.
              </p>
            )}
          </div>
        </div>

        {!isVerified && (
          <button
            type="button"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending || configured === false}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ background: THEME.ink, color: THEME.surface }}
            title={
              configured === false
                ? "Identity verification isn't configured on this server yet"
                : "Verify with DigiLocker"
            }
          >
            {startMutation.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ExternalLink size={13} />
            )}
            Verify with DigiLocker
          </button>
        )}
      </div>

      {configured === false && !isVerified && (
        <p
          className="mt-3 text-xs rounded-lg px-3 py-2 inline-block"
          style={{
            color: THEME.warning,
            background: THEME.warningTint,
            border: `1px solid ${THEME.warningBorder}`,
          }}
        >
          Identity verification isn't set up on this server yet.
        </p>
      )}
    </motion.div>
  );
}

export default IdentityVerificationCard;
