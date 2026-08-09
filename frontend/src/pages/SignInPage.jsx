import { useState, useRef, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useSignIn, useAuth } from "@clerk/clerk-react";
import { Loader2, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";

const ACCENT = "#5a678e";
const ACCENT_SOFT = "#67779b";

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
  const [scrollY, setScrollY] = useState(0);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (step === "otp") otpInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

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
    <div
      style={{
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        backgroundColor: "#efefe8",
        backgroundImage:
          "radial-gradient(circle at center, #fafaf7 0%, #efefe8 40%, #d8d8d1 75%, #a6a69e 100%)",
        color: "#0f172a",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        * { box-sizing: border-box; }

        /*
          Apple-style frosted glass card: very low white tint + heavy
          blur/saturation so the gradient page behind actually shows
          through and bleeds real color into the panel, instead of an
          opaque white card that merely sits on top of the background.
          Text stays pure black for contrast against whatever comes
          through.
        */
        .iv-glass-card {
          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(42px) saturate(190%);
          -webkit-backdrop-filter: blur(42px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.55);
          box-shadow:
            0 24px 70px -12px rgba(0, 0, 0, 0.25),
            0 1px 0 0 rgba(255, 255, 255, 0.6) inset,
            0 0 0 1px rgba(255, 255, 255, 0.15) inset;
        }
        .iv-glass-chip {
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .iv-btn-primary { background:#000; color:#fff; border:none; font-size:15px; font-weight:600; padding:13px 26px; border-radius:9px; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; justify-content:center; gap:8px; transition:background 0.15s,transform 0.12s; }
        .iv-btn-primary:hover:not(:disabled) { background:${ACCENT}; transform:translateY(-1px); }
        .iv-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
        .iv-nav-link { font-size:14px; font-weight:500; color:#000; opacity:0.65; padding:8px 12px; border-radius:10px; transition:background 0.2s,opacity 0.2s; cursor:pointer; text-decoration:none; }
        .iv-nav-link:hover { background:rgba(255,255,255,0.35); opacity:1; }
        .iv-input { width:100%; border-radius:10px; border:1px solid rgba(255,255,255,0.5); background:rgba(255,255,255,0.28); padding:13px 16px 13px 44px; color:#000; font-family:inherit; font-size:14px; transition:border-color 0.15s, box-shadow 0.15s, background 0.15s; }
        .iv-input::placeholder { color:rgba(0,0,0,0.4); }
        .iv-input:focus { outline:none; background:rgba(255,255,255,0.4); border-color:${ACCENT_SOFT}; box-shadow:0 0 0 3px rgba(90,103,142,0.15); }
        .iv-otp-input { width:100%; border-radius:10px; border:1px solid rgba(255,255,255,0.5); background:rgba(255,255,255,0.28); padding:14px; text-align:center; font-size:26px; letter-spacing:0.5em; font-weight:700; color:#000; font-family:inherit; }
        .iv-otp-input:focus { outline:none; background:rgba(255,255,255,0.4); border-color:${ACCENT_SOFT}; box-shadow:0 0 0 3px rgba(90,103,142,0.15); }
      `}</style>

      {/* ── NAVBAR — same glass recipe as the homepage ── */}
      <nav
        style={{
          position: "sticky",
          top: 12,
          zIndex: 100,
          width: "calc(100% - 32px)",
          maxWidth: 1320,
          margin: "12px auto 0",
          borderRadius: 18,
          backdropFilter: "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
          background: scrollY > 20 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.32)",
          boxShadow:
            scrollY > 20
              ? "0 10px 40px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.65)"
              : "0 6px 24px rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.75)",
          transition: "all .35s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 18%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.02) 70%, rgba(255,255,255,0) 100%)",
            opacity: 0.9,
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
            height: 68,
            display: "flex",
            alignItems: "center",
            gap: 40,
          }}
        >
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "rgba(255,255,255,.35)",
                border: "1px solid rgba(255,255,255,.35)",
              }}
            >
              <img
                src="/logo.png"
                alt="InterVue"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#000", letterSpacing: "-0.5px" }}>
              InterVue
            </span>
          </Link>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <Link to="/mock-interview" className="iv-nav-link">
              Mock Interview Bot
            </Link>
            <Link to="/sign-up" className="iv-nav-link">
              Sign up
            </Link>
            <Link
              to="/sign-up"
              className="iv-btn-primary"
              style={{ padding: "9px 18px", fontSize: 14, textDecoration: "none" }}
            >
              Get started free
              <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div className="iv-glass-card" style={{ position: "relative", borderRadius: 24, overflow: "hidden", padding: 32 }}>
            {/* glass highlight sheen */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0) 65%)",
              }}
            />

            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {step === "otp" ? <ShieldCheck size={20} color="#fff" /> : <Mail size={18} color="#fff" />}
                </div>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: "#000", letterSpacing: "-0.3px", margin: 0 }}>
                    {step === "email" ? "Sign in" : "Enter your code"}
                  </h1>
                  <p style={{ fontSize: 13.5, color: "#000", opacity: 0.6, margin: "2px 0 0" }}>
                    {step === "email"
                      ? "We'll email you a one-time code — no password needed."
                      : `Enter the code we sent to ${email}`}
                  </p>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: 20,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.85)",
                    color: "#fff",
                    fontSize: 13.5,
                    padding: "12px 16px",
                  }}
                >
                  {error}
                </div>
              )}

              {step === "email" ? (
                <form onSubmit={handleRequestCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#000", opacity: 0.55 }}>
                      Email address
                    </label>
                    <div style={{ position: "relative", marginTop: 8 }}>
                      <Mail size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(0,0,0,0.4)" }} />
                      <input
                        autoFocus
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="iv-input"
                      />
                    </div>
                  </div>

                  {/* Clerk's CAPTCHA mount point (bot protection for sign-in) */}
                  <div id="clerk-captcha" />

                  <button type="submit" disabled={submitting} className="iv-btn-primary" style={{ width: "100%", padding: "14px 24px" }}>
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
                <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#000", opacity: 0.55 }}>
                      Verification code
                    </label>
                    <input
                      ref={otpInputRef}
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="iv-otp-input"
                      style={{ marginTop: 8 }}
                    />
                  </div>

                  <button type="submit" disabled={submitting} className="iv-btn-primary" style={{ width: "100%", padding: "14px 24px" }}>
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Verifying...
                      </>
                    ) : (
                      "Verify & sign in"
                    )}
                  </button>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13.5, paddingTop: 2 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setCode("");
                        setError("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#000",
                        opacity: 0.6,
                        fontFamily: "inherit",
                        fontSize: 13.5,
                      }}
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontFamily: "inherit",
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: resendCooldown > 0 ? "rgba(0,0,0,0.35)" : ACCENT,
                        cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </div>
                </form>
              )}

              <p style={{ textAlign: "center", fontSize: 13.5, color: "#000", opacity: 0.6, marginTop: 28 }}>
                Don't have an account?{" "}
                <Link to="/sign-up" style={{ color: "#000", opacity: 1, fontWeight: 700, textDecoration: "none" }}>
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignInPage;