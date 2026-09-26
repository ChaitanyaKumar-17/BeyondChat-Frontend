import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import "../styles/ForgotPassword.css";
import loginBg from "../assets/Logo.png";
import { validateEmail } from "../utils/registerValidation";
import { handleOTPChange, handleOTPKeyDown, handleOTPPaste } from "../utils/otpHelpers";

/* ── Step Indicator ─────────────────────────────────────── */
function FPStepIndicator({ currentStep }) {
  const steps = ["Email", "Verify", "New Password"];
  return (
    <div className="fp-step-indicator">
      {steps.map((label, i) => {
        const num = i + 1;
        const isCompleted = num < currentStep;
        const isActive = num === currentStep;
        return (
          <div key={num} className="fp-step-row">
            <div className={`fp-step-item ${isCompleted ? "completed" : isActive ? "active" : ""}`}>
              <div className="fp-step-circle">
                {isCompleted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span>{num}</span>
                )}
              </div>
              <span className="fp-step-label">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`fp-step-line ${isCompleted ? "completed" : ""}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Password Strength Indicator ────────────────────────── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#f87171", "#fb923c", "#facc15", "#34d399"];

  return (
    <div className="fp-strength-wrap">
      <div className="fp-strength-bars">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="fp-strength-bar"
            style={{ background: i <= score ? colors[score] : "rgba(255,255,255,0.06)" }}
          />
        ))}
      </div>
      <span className="fp-strength-label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}

/* ── Eye Toggle Button ──────────────────────────────────── */
function EyeToggle({ visible, onToggle }) {
  return (
    <button type="button" className="eye-btn" onClick={onToggle} aria-label="Toggle password visibility">
      {visible ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94C16.19 19.19 14.13 20 12 20c-7 0-11-8-11-8 1.43-2.19 3.51-4.06 5.94-5.47"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      )}
    </button>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [email, setEmail] = useState("");

  // Step 2
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);

  // Step 3
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newVisible, setNewVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-focus first OTP box on step 2
  useEffect(() => {
    if (step === 2) setTimeout(() => otpRefs.current[0]?.focus(), 50);
  }, [step]);

  /* ── Step 1: Send OTP ── */
  const handleSendOTP = () => {
    if (!validateEmail(email, setErrors)) return;
    setIsLoading(true);
    // Stub: simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      setErrors({});
      setStep(2);
    }, 700);
  };

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOTP = () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setErrors({ otp: "Please enter all 6 digits." });
      return;
    }
    setIsLoading(true);
    // Stub: accept any 6-digit code
    setTimeout(() => {
      setIsLoading(false);
      setErrors({});
      setStep(3);
    }, 700);
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerifyOTP();
    } else if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  /* ── Step 3: Reset Password ── */
  const handleResetPassword = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = "New password is required.";
    } else if (newPassword.length < 12) {
      newErrors.newPassword = "Password must be at least 12 characters.";
    } else {
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasLower = /[a-z]/.test(newPassword);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      if (!hasUpper || !hasLower || !hasSpecial) {
        newErrors.newPassword = "Must contain uppercase, lowercase, and special characters.";
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    // Stub: simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      setErrors({});
      setSuccess(true);
      // Auto-redirect to login
      setTimeout(() => navigate("/login"), 2500);
    }, 800);
  };

  const handleKeyPress = (e, fn) => {
    if (e.key === "Enter") { e.preventDefault(); fn(); }
  };

  const handleBack = () => { setErrors({}); setStep(s => s - 1); };

  /* ── Success State ── */
  if (success) {
    return (
      <div className="login-root">
        <div className="top-left-app-name">
          <img src={loginBg} alt="BeyondChat Logo" className="app-logo"/>
          <span>BeyondChat</span>
        </div>
        <div className="login-wrapper">
          <div className="login-card tfa-success-card">
            <div className="tfa-success-ring">
              <svg viewBox="0 0 24 24" fill="none" className="tfa-success-check">
                <circle cx="12" cy="12" r="10" stroke="url(#fpSuccessGrad)" strokeWidth="1.5"/>
                <path d="M8 12L11 15L16 9" stroke="url(#fpSuccessGrad)" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="fpSuccessGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#34d399"/>
                    <stop offset="100%" stopColor="#10b981"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="tfa-success-title">Password Reset!</h2>
            <p className="tfa-success-sub">Your password has been updated.<br/>Redirecting to login…</p>
            <span className="footer-text">Encrypted • Real-time • Limitless</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-root">
      <div className="top-left-app-name">
        <img src={loginBg} alt="BeyondChat Logo" className="app-logo"/>
        <span>BeyondChat</span>
      </div>

      <div className="login-wrapper">
        <div className="login-card fp-card">

          <h1 className="logo fp-title">Reset Password</h1>
          <p className="tagline fp-tagline">
            {step === 1 && "Enter your email to receive a reset code."}
            {step === 2 && "Check your inbox for the 6-digit code."}
            {step === 3 && "Create a strong new password."}
          </p>

          <FPStepIndicator currentStep={step}/>

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={e => handleKeyPress(e, handleSendOTP)}
                className={errors.email ? "input-error" : ""}
                autoFocus
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
              <div className="fp-spacer"/>
              <button className="connect-btn" onClick={handleSendOTP} disabled={isLoading}>
                {isLoading
                  ? <span className="tfa-spinner-row"><span className="tfa-spinner"/> Sending…</span>
                  : "SEND RESET CODE"}
              </button>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <>
              <p className="otp-message">
                Code sent to <strong>{email}</strong>
              </p>
              <div className="otp-container tfa-otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOTPChange(index, e.target.value, otp, setOtp, otpRefs)}
                    onKeyDown={e => handleOTPKeyDown(index, e)}
                    onPaste={index === 0 ? e => handleOTPPaste(e, setOtp, otpRefs) : undefined}
                    className={`otp-box ${errors.otp ? "otp-box--invalid" : digit ? "otp-box--filled" : ""}`}
                    disabled={isLoading}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              {errors.otp && <div className="error-message tfa-error">{errors.otp}</div>}
              <button className="connect-btn" onClick={handleVerifyOTP} disabled={isLoading}>
                {isLoading
                  ? <span className="tfa-spinner-row"><span className="tfa-spinner"/> Verifying…</span>
                  : "VERIFY CODE"}
              </button>
              <button className="back-btn" onClick={handleBack}>Back</button>
            </>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <>
              <div className="password-wrapper">
                <div className="input-relative">
                  <input
                    type={newVisible ? "text" : "password"}
                    placeholder="New Password (min 12 characters)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    onKeyPress={e => handleKeyPress(e, handleResetPassword)}
                    className={`password-input ${errors.newPassword ? "input-error" : ""}`}
                    autoFocus
                  />
                  <EyeToggle visible={newVisible} onToggle={() => setNewVisible(v => !v)}/>
                </div>
              </div>
              {errors.newPassword
                ? <div className="error-message">{errors.newPassword}</div>
                : <PasswordStrength password={newPassword}/>
              }

              <div className="fp-spacer"/>

              <div className="password-wrapper">
                <div className="input-relative">
                  <input
                    type={confirmVisible ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyPress={e => handleKeyPress(e, handleResetPassword)}
                    className={`password-input ${errors.confirmPassword ? "input-error" : ""}`}
                  />
                  <EyeToggle visible={confirmVisible} onToggle={() => setConfirmVisible(v => !v)}/>
                </div>
              </div>
              {errors.confirmPassword && (
                <div className="error-message">{errors.confirmPassword}</div>
              )}

              <div className="fp-spacer"/>

              <button className="connect-btn" onClick={handleResetPassword} disabled={isLoading}>
                {isLoading
                  ? <span className="tfa-spinner-row"><span className="tfa-spinner"/> Resetting…</span>
                  : "RESET PASSWORD"}
              </button>
              <button className="back-btn" onClick={handleBack}>Back</button>
            </>
          )}

          <span className="footer-text">Encrypted • Real-time • Limitless</span>
        </div>

        <div className="register-outside">
          <span>Remember your password?</span>
          <Link to="/login">
            <button className="register-btn">Sign In</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
