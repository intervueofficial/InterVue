import { useState, useRef, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useSignUp, useAuth } from "@clerk/clerk-react";
import {
  Loader2,
  Mail,
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Lock,
  Zap,
  Users,
  CreditCard,
  Timer,
  XCircle,
  Github,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";

/* ─── Same inline icon set / accent palette as the homepage ─── */
const Icon = {
  ArrowRight: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
  ),
  Google: () => (
    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
  ),
};

// Same subdued blue-gray accent family used throughout the homepage
// (#5a678e / #67779b / #7382a0 / #2563eb-on-links) instead of a flat
// black/neutral palette, so the sign-up page reads as the same product.
const ACCENT = "#5a678e";
const ACCENT_SOFT = "#67779b";
const INK = "#0f172a";
const MUTED = "#475569";

// Security feature: nobody reaches a dashboard of any role without first
// proving they own the email address they signed up with. Clerk emails a
// one-time code to the address entered, and the account only becomes
// active once that code is verified — the OTP step can never be skipped.
const SignUpPage = () => {
  const { isSignedIn } = useAuth();
  const { data: user, isLoading: userLoading } = useAuthUser();
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [step, setStep] = useState("details"); // "details" | "otp"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // "google" | "github" | null
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
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

  // Real Clerk OAuth — redirects to the provider, then back to this app.
  // Requires Google/GitHub to be enabled as SSO connections in the Clerk
  // dashboard; if they aren't, Clerk will surface its own error on redirect.
  const handleOAuth = async (provider) => {
    if (!isLoaded || oauthLoading) return;
    setOauthLoading(provider);
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider === "google" ? "oauth_google" : "oauth_github",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/select-role",
      });
    } catch (err) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        `Couldn't continue with ${provider === "google" ? "Google" : "GitHub"}.`;
      setError(message);
      setOauthLoading(null);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        backgroundColor: "#efefe8",
        backgroundImage:
          "radial-gradient(circle at center, #fafaf7 0%, #efefe8 40%, #d8d8d1 75%, #a6a69e 100%)",
        color: INK,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        * { box-sizing: border-box; }
        .iv-btn-primary { background:#1F1F1F; color:#fff; border:none; font-size:15px; font-weight:600; padding:13px 26px; border-radius:9px; cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; justify-content:center; gap:8px; transition:background 0.15s,transform 0.12s; }
        .iv-btn-primary:hover:not(:disabled) { background:${ACCENT}; transform:translateY(-1px); }
        .iv-btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
        .iv-social-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 0; border:1.5px solid #e2e8f0; border-radius:7px; background:rgba(255,255,255,0.7); font-family:inherit; font-size:14px; font-weight:500; color:${INK}; cursor:pointer; width:100%; transition:border-color 0.15s,background 0.15s; }
        .iv-social-btn:hover:not(:disabled) { border-color:${ACCENT_SOFT}; background:#f0f6ff; }
        .iv-social-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .iv-nav-link { font-size:14px; font-weight:500; color:${MUTED}; padding:8px 12px; border-radius:10px; transition:background 0.2s,color 0.2s; cursor:pointer; text-decoration:none; }
        .iv-nav-link:hover { background:rgba(255,255,255,0.35); color:${INK}; }
        .iv-input { width:100%; border-radius:10px; border:1px solid #e2e8f0; background:rgba(255,255,255,0.75); padding:13px 16px 13px 44px; color:${INK}; font-family:inherit; font-size:14px; transition:border-color 0.15s, box-shadow 0.15s; }
        .iv-input::placeholder { color:#94a3b8; }
        .iv-input:focus { outline:none; border-color:${ACCENT_SOFT}; box-shadow:0 0 0 3px rgba(90,103,142,0.12); }
        .iv-otp-input { width:100%; border-radius:10px; border:1px solid #e2e8f0; background:rgba(255,255,255,0.75); padding:14px; text-align:center; font-size:26px; letter-spacing:0.5em; font-weight:700; color:${INK}; font-family:inherit; }
        .iv-otp-input:focus { outline:none; border-color:${ACCENT_SOFT}; box-shadow:0 0 0 3px rgba(90,103,142,0.12); }
      `}</style>

      {/* ── NAVBAR — identical glass recipe to the homepage ── */}
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
          background: scrollY > 20 ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.42)",
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
              "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 18%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.04) 70%, rgba(255,255,255,0) 100%)",
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
                background: "rgba(255,255,255,.45)",
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
            <span style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>
              InterVue
            </span>
          </Link>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <Link to="/mock-interview" className="iv-nav-link">
              Mock Interview Bot
            </Link>
            <Link to="/sign-in" className="iv-nav-link">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "56px 32px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 1280,
            display: "grid",
            gridTemplateColumns: "0.95fr 1.05fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          {/* LEFT — marketing panel, same glass icon-chip treatment as homepage feature blocks */}
          <div style={{ display: window.innerWidth < 900 ? "none" : "block" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                borderRadius: 20,
                padding: "4px 12px 4px 6px",
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  background: ACCENT,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 12,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                New
              </span>
              <span style={{ fontSize: 13, color: "#5c6377", fontWeight: 500 }}>
                AI-powered Transparent Interviewing
              </span>
            </div>

            <h1
              style={{
                fontSize: 44,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1.2px",
                color: INK,
                marginBottom: 20,
              }}
            >
              Create your account
              <br />
              and <span style={{ color: ACCENT }}>get started</span>
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.65, color: MUTED, marginBottom: 36, maxWidth: 420 }}>
              Join InterVue and experience technical interviews that are fair, collaborative, and
              actually enjoyable.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 36 }}>
              {[
                { Icon: Zap, title: "AI-powered interviews", body: "Real-time feedback and smart scoring" },
                { Icon: Users, title: "Collaborative experience", body: "Work together with your team seamlessly" },
                { Icon: ShieldCheck, title: "Secure & private", body: "Your data is encrypted and protected" },
              ].map(({ Icon: FeatIcon, title, body }) => (
                <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.7)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FeatIcon size={18} color="#1f2937" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: INK, margin: 0 }}>{title}</p>
                    <p style={{ fontSize: 14, color: "#64748b", margin: "2px 0 0" }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 24 }}>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                Trusted by 4,200+ engineering teams worldwide
              </p>
            </div>
          </div>

          {/* RIGHT — form, same glass panel recipe as the nav bar */}
          <div style={{ width: "100%", maxWidth: 460, margin: "0 auto" }}>
            <div
              style={{
                position: "relative",
                borderRadius: 24,
                overflow: "hidden",
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(28px) saturate(180%)",
                WebkitBackdropFilter: "blur(28px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow: "0 30px 80px rgba(15,23,42,0.12), 0 1px 0 0 rgba(255,255,255,0.7) inset",
                padding: 32,
              }}
            >
              {/* glass highlight sheen, same as nav */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0) 65%)",
                }}
              />

              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "#1F1F1F",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {step === "otp" ? (
                      <ShieldCheck className="text-white" size={20} color="#fff" />
                    ) : (
                      <Mail size={18} color="#fff" />
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, letterSpacing: "-0.3px", margin: 0 }}>
                      {step === "details" ? "Create your account" : "Verify your email"}
                    </h2>
                    <p style={{ fontSize: 13.5, color: "#64748b", margin: "2px 0 0" }}>
                      {step === "details"
                        ? "We'll send a one-time code to confirm it's really you."
                        : `Enter the code we sent to ${email}`}
                    </p>
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      marginBottom: 20,
                      borderRadius: 10,
                      background: "#0f172a",
                      color: "#fff",
                      fontSize: 13.5,
                      padding: "12px 16px",
                    }}
                  >
                    {error}
                  </div>
                )}

                {step === "details" ? (
                  <>
                    <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED }}>
                          Full name
                        </label>
                        <div style={{ position: "relative", marginTop: 8 }}>
                          <User size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                          <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Doe"
                            className="iv-input"
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED }}>
                          Email address
                        </label>
                        <div style={{ position: "relative", marginTop: 8 }}>
                          <Mail size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="iv-input"
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED }}>
                          Password
                        </label>
                        <div style={{ position: "relative", marginTop: 8 }}>
                          <Lock size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className="iv-input"
                            style={{ paddingRight: 44 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                            style={{
                              position: "absolute",
                              right: 0,
                              top: 0,
                              bottom: 0,
                              display: "flex",
                              alignItems: "center",
                              padding: "0 14px",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#64748b",
                            }}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Clerk's CAPTCHA mount point (bot protection for sign-up) */}
                      <div id="clerk-captcha" />

                      <button type="submit" disabled={submitting} className="iv-btn-primary" style={{ width: "100%", padding: "14px 24px" }}>
                        {submitting ? (
                          <>
                            <Loader2 className="animate-spin" size={18} /> Sending code...
                          </>
                        ) : (
                          <>
                            Send verification code <Icon.ArrowRight />
                          </>
                        )}
                      </button>
                    </form>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0" }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(15,23,42,0.1)" }} />
                      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.06em" }}>OR</span>
                      <div style={{ flex: 1, height: 1, background: "rgba(15,23,42,0.1)" }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <button type="button" onClick={() => handleOAuth("google")} disabled={oauthLoading !== null} className="iv-social-btn">
                        {oauthLoading === "google" ? <Loader2 className="animate-spin" size={16} /> : <Icon.Google />}
                        Google
                      </button>
                      <button type="button" onClick={() => handleOAuth("github")} disabled={oauthLoading !== null} className="iv-social-btn">
                        {oauthLoading === "github" ? <Loader2 className="animate-spin" size={16} /> : <Github size={16} />}
                        GitHub
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED }}>
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
                        "Verify & create account"
                      )}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13.5, paddingTop: 2 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("details");
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
                          color: "#64748b",
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
                          color: resendCooldown > 0 ? "#94a3b8" : ACCENT,
                          cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                      </button>
                    </div>
                  </form>
                )}

                <p style={{ textAlign: "center", fontSize: 13.5, color: "#64748b", marginTop: 28 }}>
                  Already have an account?{" "}
                  <Link to="/sign-in" style={{ color: INK, fontWeight: 700, textDecoration: "none" }}>
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── TRUST BAR — same glass footer strip as homepage ── */}
      <footer
        style={{
          position: "relative",
          borderTop: "1px solid rgba(255,255,255,0.6)",
          background: "rgba(255,255,255,0.3)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "20px 32px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px 40px",
            fontSize: 13.5,
            color: MUTED,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={16} color="#94a3b8" /> No credit card required
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Timer size={16} color="#94a3b8" /> Start in 30 seconds
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <XCircle size={16} color="#94a3b8" /> Cancel anytime
          </span>
        </div>
      </footer>
    </div>
  );
};

export default SignUpPage;