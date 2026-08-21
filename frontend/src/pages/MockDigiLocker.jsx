import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";

import { identityApi } from "../api/auth";
import { THEME } from "../constants/theme";

const inputStyle = {
  background: "#fff",
  border: `1px solid ${THEME.border}`,
  color: THEME.ink,
  fontFamily: THEME.fontSans,
};
const fieldClass =
  "mt-1.5 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors";

/**
 * Stands in for DigiLocker's real Aadhaar-OTP consent screen. Only
 * reachable when the backend has DIGILOCKER_MOCK_MODE=true (see
 * backend/IDENTITY_VERIFICATION_SETUP.md) — meant for group/college
 * projects that don't have a registered organization to get real
 * DigiLocker partner credentials.
 *
 * The data entered here is fake/self-reported — there's no real
 * identity check happening. What IS real: the backend hashes
 * (name + DOB + last 4 digits) and enforces a unique index on that
 * hash, so trying to "verify" the same fake identity on a second
 * account correctly gets rejected as a duplicate — which is the actual
 * feature being demonstrated.
 */
function MockDigiLocker() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = searchParams.get("state") || "";

  const [form, setForm] = useState({ name: "", dob: "", aadhaarNumber: "" });
  const [consent, setConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submitMutation = useMutation({
    mutationFn: async () => identityApi.submitMockVerification(form, await getToken()),
    onSuccess: (res) => {
      const status = res.status || "verified";
      navigate(`/candidate/profile?identity=${status}`, { replace: true });
    },
    onError: (e) => {
      const status = e.response?.data?.status;
      if (status) {
        navigate(`/candidate/profile?identity=${status}`, { replace: true });
        return;
      }
      setErrorMsg(e.response?.data?.message || "Verification failed. Please try again.");
    },
  });

  const aadhaarDigits = form.aadhaarNumber.replace(/\D/g, "");
  const canSubmit =
    form.name.trim().length > 1 && form.dob && aadhaarDigits.length === 12 && consent;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#F1F5F9", fontFamily: THEME.fontSans }}
    >
      <div className="w-full max-w-md">
        {/* Clearly-labeled demo banner — never let this be mistaken for the real thing */}
        <div
          className="mb-4 rounded-lg px-4 py-2.5 text-xs font-semibold text-center"
          style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}
        >
          MOCK / DEMO ENVIRONMENT — not the real DigiLocker. No real Aadhaar data is
          sent or verified.
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: `1px solid ${THEME.border}`, boxShadow: "0 20px 60px rgba(15,23,42,0.12)" }}
        >
          {/* Header styled like a govt. consent screen, kept simple */}
          <div className="px-7 pt-7 pb-5" style={{ background: "#0B3D91" }}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={22} color="#fff" />
              <div>
                <p className="text-white font-semibold text-sm leading-tight">DigiLocker</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Simulated consent screen
                </p>
              </div>
            </div>
          </div>

          <div className="px-7 py-6">
            <p className="text-sm mb-5" style={{ color: THEME.inkMuted }}>
              InterVue is requesting to verify your identity using your Aadhaar e-KYC
              details. Enter any test data below to simulate consenting.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: THEME.inkMuted }}>
                  Full Name (as on Aadhaar)
                </label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Raj Kumar Sharma"
                  className={fieldClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: THEME.inkMuted }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => update("dob", e.target.value)}
                  className={fieldClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: THEME.inkMuted }}>
                  Aadhaar Number (any 12 digits — this is fake data)
                </label>
                <input
                  inputMode="numeric"
                  value={form.aadhaarNumber}
                  onChange={(e) => update("aadhaarNumber", e.target.value)}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                  className={fieldClass}
                  style={inputStyle}
                />
                <p className="text-[11px] mt-1" style={{ color: THEME.inkFaint }}>
                  Try verifying two different accounts with the same 12 digits — the
                  second one will correctly get rejected as a duplicate identity.
                </p>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-xs" style={{ color: THEME.ink }}>
                  I consent to share these (simulated) Aadhaar details with InterVue
                  for identity verification.
                </span>
              </label>

              {errorMsg && (
                <div
                  className="flex items-start gap-2 text-xs rounded-lg px-3 py-2.5"
                  style={{ color: THEME.danger, background: THEME.dangerTint, border: `1px solid ${THEME.dangerBorder || THEME.border}` }}
                >
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate("/candidate/profile")}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg"
                style={{ background: THEME.surface2, color: THEME.ink }}
              >
                <ArrowLeft size={14} />
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSubmit || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#0B3D91", color: "#fff" }}
              >
                {submitMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {submitMutation.isPending ? "Verifying..." : "Approve & Continue"}
              </button>
            </div>
          </div>
        </div>

        {state && (
          <p className="text-center text-[11px] mt-3" style={{ color: THEME.inkFaint }}>
            Request ref: {state.slice(0, 12)}…
          </p>
        )}
      </div>
    </div>
  );
}

export default MockDigiLocker;
