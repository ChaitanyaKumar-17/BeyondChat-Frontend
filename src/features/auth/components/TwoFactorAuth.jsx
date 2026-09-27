import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/auth.css";
import "../styles/TwoFactor.css";
import loginBg from "../assets/Logo.png";
import { handleOTPChange, handleOTPKeyDown, handleOTPPaste } from "../utils/otpHelpers";

/* ── Shield Icon ────────────────────────────────────────── */
function ShieldIcon() {
  return (
    <svg
      className="tfa-shield-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
        stroke="url(#shieldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="url(#shieldGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="shieldGrad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Method Badge ───────────────────────────────────────── */
function MethodBadge({ method }) {
  const config = {
    authenticator: { icon: "🔑", label: "Authenticator App" },
    sms:           { icon: "📱", label: "SMS" },
    email:         { icon: "✉️", label: "Email" },
  };
  const { icon, label } = config[method] || config.authenticator;
  return (
    <div className="tfa-method-badge">
      <span className="tfa-method-icon">{icon}</span>
      <span className="tfa-method-label">{label}</span>
    </div>
  );
}

/* ── Resend Timer ───────────────────────────────────────── */
function ResendTimer({ onResend }) {
  const [seconds, setSeconds] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleResend = () => {
    if (!canResend) return;
    setSeconds(30);
    setCanResend(false);
    onResend?.();
  };

  return (
    <div className="tfa-resend-row">
      <span className="tfa-resend-label">Didn't receive the code?</span>
      {canResend ? (
        <button className="tfa-resend-btn" onClick={handleResend}>
          Resend Code
        </button>
      ) : (
        <span className="tfa-resend-countdown">
          Resend in <strong>{seconds}s</strong>
        </span>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function TwoFactorAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  // method can be passed via router state; default to "authenticator"
  const method = location.state?.method || "authenticator";
  const username = location.state?.username || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const otpRefs = useRef([]);

  // Auto-focus first box on mount
  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setError("");
    setIsVerifying(true);
    setInvalid(false);

    // No backend yet — accept any complete 6-digit code
    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
      // Show success screen briefly then enter the app
      setTimeout(() => navigate("/app"), 2000);
    }, 900);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    } else {
      handleOTPKeyDown(index, e, otp, otpRefs);
    }
  };

  // Clear invalid state as soon as user starts retyping
  const handleOTPChangeWithReset = (index, value, currentOtp, setCurrentOtp, refs) => {
    if (invalid) {
      setInvalid(false);
      setError("");
    }
    handleOTPChange(index, value, currentOtp, setCurrentOtp, refs);
  };

  const handleResend = () => {
    // Stub: would call API to resend
    console.log("Resending 2FA code to:", username);
  };

  const handleBack = () => {
    navigate("/login");
  };

  /* ── Success State ─── */
  if (verified) {
    return (
      <div className="login-root">
        <div className="top-left-app-name">
          <img src={loginBg} alt="BeyondChat Logo" className="app-logo" />
          <span>BeyondChat</span>
        </div>
        <div className="login-wrapper">
          <div className="login-card tfa-success-card">
            <div className="tfa-success-ring">
              <svg viewBox="0 0 24 24" fill="none" className="tfa-success-check">
                <circle cx="12" cy="12" r="10" stroke="url(#successGrad)" strokeWidth="1.5" />
                <path d="M8 12L11 15L16 9" stroke="url(#successGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="successGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="tfa-success-title">Verified!</h2>
            <p className="tfa-success-sub">Identity confirmed. Welcome back{username ? `, ${username}` : ""}.</p>
            <span className="footer-text">Encrypted • Real-time • Limitless</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main 2FA View ─── */
  return (
    <div className="login-root">
      {/* Top-left branding */}
      <div className="top-left-app-name">
        <img src={loginBg} alt="BeyondChat Logo" className="app-logo" />
        <span>BeyondChat</span>
      </div>

      <div className="login-wrapper">
        <div className="login-card tfa-card">
          {/* Shield icon */}
          <div className="tfa-icon-wrap">
            <ShieldIcon />
          </div>

          <h1 className="logo tfa-title">Verify It's You</h1>
          <p className="tagline tfa-tagline">Two-factor authentication</p>

          {/* Method badge */}
          <MethodBadge method={method} />

          {/* Context message */}
          <p className="tfa-instruction">
            {method === "authenticator"
              ? "Enter the 6-digit code from your authenticator app."
              : method === "sms"
              ? <>A 6-digit code was sent to your registered phone.</>
              : <>A 6-digit code was sent to your email.</>}
          </p>

          {/* OTP boxes */}
          <div className={`otp-container tfa-otp-container ${invalid ? "otp-shake" : ""}`}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) =>
                  handleOTPChangeWithReset(index, e.target.value, otp, setOtp, otpRefs)
                }
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? (e) => handleOTPPaste(e, setOtp, otpRefs) : undefined}
                className={`otp-box ${
                  invalid ? "otp-box--invalid" : digit ? "otp-box--filled" : ""
                }`}
                disabled={isVerifying}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {/* Error */}
          {error && <div className="error-message tfa-error">{error}</div>}

          {/* Resend (only for non-authenticator methods) */}
          {method !== "authenticator" && (
            <ResendTimer onResend={handleResend} />
          )}

          {/* Verify button */}
          <button
            className={`connect-btn tfa-verify-btn ${isVerifying ? "tfa-verifying" : ""}`}
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <span className="tfa-spinner-row">
                <span className="tfa-spinner" />
                Verifying…
              </span>
            ) : (
              "VERIFY"
            )}
          </button>

          {/* Back link */}
          <button className="tfa-back-link" onClick={handleBack}>
            ← Back to Login
          </button>

          <span className="footer-text">Encrypted • Real-time • Limitless</span>
        </div>
      </div>
    </div>
  );
}
