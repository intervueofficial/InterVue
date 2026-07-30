import { useState, useRef, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useSignIn, useAuth } from "@clerk/clerk-react";
import { Loader2, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";

// Security feature: every sign-in — not just the first one — requires a
// fresh one-time code sent to the account's verified email address. There
// is no password-only path into any dashboard; direct/blind access is not
// possible without proving control of that inbox each time.
const SignInPage = () => {
  const { isSignedIn } = useAuth();
  const { data: user, isLoading: userLoading } = useAuthUser();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailAddressId, setEmailAddressId] = useState(null);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (step === "otp") otpInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (isSignedIn && !userLoading && user) {
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "interviewer":
        return <Navigate to="/dashboard" replace />;
      case "candidate":
        return <Navigate to="/candidate/dashboard" replace />;
      default:
        return <Navigate to="/select-role" replace />;
    }
  }

  const sendCodeTo = async (factorEmailAddressId) => {
    await signIn.prepareFirstFactor({
      strategy: "email_code",
      emailAddressId: factorEmailAddressId,
    });
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!isLoaded || submitting) return;
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError("Please enter your email address.");

    setSubmitting(true);
    try {
      const attempt = await signIn.create({ identifier: trimmedEmail });

      const emailFactor = attempt.supportedFirstFactors?.find(
        (f) => f.strategy === "email_code"
      );

      if (!emailFactor) {
        setError(
          "Email code sign-in isn't enabled for this account. Please contact support."
        );
        return;
      }

      await sendCodeTo(emailFactor.emailAddressId);
      setEmailAddressId(emailFactor.emailAddressId);
      setStep("otp");
      setResendCooldown(30);
      toast.success(`We sent a verification code to ${trimmedEmail}`);
    } catch (err) {
      const clerkCode = err?.errors?.[0]?.code;
      const message =
        clerkCode === "form_identifier_not_found"
          ? "No account found with that email. Try signing up instead."
          : err?.errors?.[0]?.longMessage ||
            err?.errors?.[0]?.message ||
            "Couldn't send a code. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!isLoaded || submitting) return;
    setError("");

    if (code.trim().length < 6) {
      return setError("Enter the 6-digit code from your email.");
    }

    setSubmitting(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: code.trim(),
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        toast.success("Signed in!");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid or expired code. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || resendCooldown > 0 || !emailAddressId) return;
    try {
      await sendCodeTo(emailAddressId);
      setResendCooldown(30);
      toast.success("Code resent.");
    } catch (err) {
      toast.error("Couldn't resend the code. Please try again shortly.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-lg bg-black flex items-center justify-center shrink-0">
            {step === "otp" ? (
              <ShieldCheck className="text-white" size={20} />
            ) : (
              <Mail className="text-white" size={18} />
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
              {step === "email" ? "Sign in" : "Enter your code"}
            </h1>
            <p className="text-sm text-neutral-500">
              {step === "email"
                ? "We'll email you a one-time code — no password needed."
                : `Enter the code we sent to ${email}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-md bg-neutral-900 text-white text-sm px-4 py-3">
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Email address
              </label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-2 w-full rounded-md border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
              />
            </div>

            {/* Clerk's CAPTCHA mount point (bot protection for sign-in) */}
            <div id="clerk-captcha" />

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-black hover:bg-neutral-800 text-white px-6 py-3 font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Sending code...
                </>
              ) : (
                "Send verification code"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Verification code
              </label>
              <input
                ref={otpInputRef}
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="mt-2 w-full rounded-md border border-neutral-300 px-4 py-3 text-center text-2xl tracking-[0.5em] font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-black hover:bg-neutral-800 text-white px-6 py-3 font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Verifying...
                </>
              ) : (
                "Verify & sign in"
              )}
            </button>

            <div className="flex items-center justify-between text-sm pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-neutral-900 font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-neutral-500 mt-8">
          Don't have an account?{" "}
          <Link to="/sign-up" className="text-neutral-900 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;