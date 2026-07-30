import { useState, useRef, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useSignUp, useAuth } from "@clerk/clerk-react";
import { Loader2, Mail, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";

// Security feature: nobody reaches a dashboard of any role without first
// proving they own the email address they signed up with. Clerk emails a
// one-time code to the address entered, and the account only becomes
// active once that code is verified — the OTP step can never be skipped.
const SignUpPage = () => {
  const { isSignedIn } = useAuth();
  const { data: user, isLoading: userLoading } = useAuthUser();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [step, setStep] = useState("details"); // "details" | "otp"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
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

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!isLoaded || submitting) return;
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) return setError("Please enter your name.");
    if (!trimmedEmail) return setError("Please enter your email address.");
    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    setSubmitting(true);
    try {
      const [firstName, ...rest] = trimmedName.split(" ");

      // Password is collected up front (Clerk instances configured with
      // both "password" and "email verification code" as sign-up
      // requirements need it before the sign-up can ever reach
      // status "complete" — without it, verifying the OTP correctly
      // still leaves the attempt stuck on "missing_requirements").
      await signUp.create({
        emailAddress: trimmedEmail,
        password,
        firstName,
        lastName: rest.join(" ") || undefined,
      });

      // Only a real, deliverable email address gets this far — Clerk
      // sends the code straight to the inbox owner.
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setStep("otp");
      setResendCooldown(30);
      toast.success(`We sent a verification code to ${trimmedEmail}`);
    } catch (err) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Couldn't start sign up. Please try again.";
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
      const attempt = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        toast.success("Email verified — welcome to InterVue!");
      } else {
        // The code itself was accepted (no throw), but the sign-up still
        // needs something else to finish — surface exactly what, instead
        // of a generic message, so this is diagnosable instead of a dead end.
        const missing = attempt.missingFields?.length
          ? ` Missing: ${attempt.missingFields.join(", ")}.`
          : "";
        setError(
          `Your code was correct, but the account isn't complete yet (status: ${attempt.status}).${missing} Please contact support if this keeps happening.`
        );
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
    if (!isLoaded || resendCooldown > 0) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
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
              {step === "details" ? "Create your account" : "Verify your email"}
            </h1>
            <p className="text-sm text-neutral-500">
              {step === "details"
                ? "We'll send a one-time code to confirm it's really you."
                : `Enter the code we sent to ${email}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-md bg-neutral-900 text-white text-sm px-4 py-3">
            {error}
          </div>
        )}

        {step === "details" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Full name
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-2 w-full rounded-md border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-2 w-full rounded-md border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-md border border-neutral-300 pl-4 pr-11 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  tabIndex={0}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Clerk's CAPTCHA mount point (bot protection for sign-up) */}
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
                "Verify & create account"
              )}
            </button>

            <div className="flex items-center justify-between text-sm pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("details");
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
          Already have an account?{" "}
          <Link to="/sign-in" className="text-neutral-900 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;