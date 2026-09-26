import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/auth.css";
import "../styles/TwoFactor.css";
import loginBg from "../assets/Logo.png";
import { handleOTPChange, handleOTPKeyDown, handleOTPPaste } from "../utils/otpHelpers";

/* ── QR Code Placeholder ────────────────────────────────── */
function QRPlaceholder() {
  return (
    <div className="tfs-qr-wrap">
      <div className="tfs-qr-box">
        <svg viewBox="0 0 100 100" className="tfs-qr-svg" xmlns="http://www.w3.org/2000/svg">
          {/* Top-left position square */}
          <rect x="10" y="10" width="22" height="22" rx="2" fill="none" stroke="#818cf8" strokeWidth="3"/>
          <rect x="15" y="15" width="12" height="12" rx="1" fill="#818cf8"/>
          {/* Top-right position square */}
          <rect x="68" y="10" width="22" height="22" rx="2" fill="none" stroke="#818cf8" strokeWidth="3"/>
          <rect x="73" y="15" width="12" height="12" rx="1" fill="#818cf8"/>
          {/* Bottom-left position square */}
          <rect x="10" y="68" width="22" height="22" rx="2" fill="none" stroke="#818cf8" strokeWidth="3"/>
          <rect x="15" y="73" width="12" height="12" rx="1" fill="#818cf8"/>
          {/* Data dots */}
          {[
            [40,10],[46,10],[52,10],[58,10],
            [40,16],[52,16],[58,16],
            [40,22],[46,22],[58,22],
            [40,28],[52,28],
            [40,34],[46,34],[52,34],[58,34],
            [10,40],[16,40],[22,40],[28,40],[34,40],[40,40],[46,40],[58,40],[64,40],[70,40],[76,40],[82,40],[88,40],
            [10,46],[28,46],[40,46],[52,46],[64,46],[76,46],[88,46],
            [10,52],[16,52],[22,52],[34,52],[46,52],[52,52],[58,52],[70,52],[82,52],[88,52],
            [10,58],[28,58],[40,58],[52,58],[70,58],[76,58],
            [10,64],[16,64],[22,64],[34,64],[40,64],[46,64],[58,64],[64,64],[76,64],[88,64],
            [34,68],[40,68],[52,68],[58,68],[70,68],[82,68],
            [34,74],[46,74],[52,74],[64,74],[70,74],[76,74],[88,74],
            [34,80],[40,80],[46,80],[64,80],[76,80],[82,80],
            [34,86],[52,86],[58,86],[64,86],[70,86],[88,86],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="4" height="4" rx="0.5" fill="#6366f1" opacity="0.7"/>
          ))}
        </svg>
      </div>
      <p className="tfs-qr-hint">Scan with your authenticator app</p>
      <p className="tfs-qr-apps">Google Authenticator · Authy · 1Password</p>
    </div>
  );
}

/* ── Secret Key Display ─────────────────────────────────── */
const FAKE_SECRET = "JBSW Y3DP EHPK 3PXP NBSW Y3TP";

function SecretKey() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(FAKE_SECRET.replace(/\s/g, "")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tfs-secret-wrap">
      <span className="tfs-secret-label">Or enter manually</span>
      <div className="tfs-secret-row">
        <code className="tfs-secret-key">{FAKE_SECRET}</code>
        <button className="tfs-copy-btn" onClick={handleCopy} title="Copy key">
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function TwoFactorSetup() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  const otpRefs = useRef([]);

  // Auto-focus first OTP box on mount
  useEffect(() => {
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, []);

  const handleConfirm = () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setError("");
    setInvalid(false);
    setIsConfirming(true);

    // No backend yet — accept any complete 6-digit code and proceed to the app
    setTimeout(() => {
      setIsConfirming(false);
      setSuccess(true);
      // Show success screen briefly, then redirect to the chat app
      setTimeout(() => navigate("/app"), 2000);
    }, 900);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Enter") { e.preventDefault(); handleConfirm(); }
    else handleOTPKeyDown(index, e, otp, otpRefs);
  };

  const handleOTPChangeWithReset = (index, value, currentOtp, setCurrentOtp, refs) => {
    if (invalid) { setInvalid(false); setError(""); }
    handleOTPChange(index, value, currentOtp, setCurrentOtp, refs);
  };

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
                <circle cx="12" cy="12" r="10" stroke="url(#setupSuccessGrad)" strokeWidth="1.5"/>
                <path d="M8 12L11 15L16 9" stroke="url(#setupSuccessGrad)" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="setupSuccessGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#34d399"/>
                    <stop offset="100%" stopColor="#10b981"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="tfa-success-title">2FA Enabled!</h2>
            <p className="tfa-success-sub">Your account is now secured. Redirecting to your account…</p>
            <span className="footer-text">Encrypted • Real-time • Limitless</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-root">
      <div className="top-left-app-name">
        <img src={loginBg} alt="BeyondChat Logo" className="app-logo"/>
        <span>BeyondChat</span>
      </div>

      <div className="register-wrapper">
        <div className="register-card tfa-card tfs-card">

          {/* 5-step journey indicator — step 5 active */}
          <div className="reg-step-indicator tfs-step-indicator">
            {["Email","Verify","Details","Account","2FA"].map((label, i) => {
              const num = i + 1;
              const isCompleted = num < 5;
              const isActive = num === 5;
              return (
                <div key={num} className="reg-step-row">
                  <div className={`reg-step-item ${isCompleted ? "completed" : isActive ? "active" : ""}`}>
                    <div className="reg-step-circle">
                      {isCompleted ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          width="13" height="13">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <span>{num}</span>
                      )}
                    </div>
                    <span className="reg-step-label">{label}</span>
                  </div>
                  {i < 4 && (
                    <div className={`reg-step-line ${isCompleted ? "completed" : ""}`}/>
                  )}
                </div>
              );
            })}
          </div>

          <h1 className="logo tfa-title">Secure Your Account</h1>
          <p className="tagline tfa-tagline">Scan the QR code with your authenticator app</p>

          {/* QR code */}
          <QRPlaceholder/>

          {/* Secret key */}
          <SecretKey/>

          {/* OTP confirm entry */}
          <p className="tfa-instruction" style={{ marginTop: 12, marginBottom: 12 }}>
            Enter the 6-digit code from your app to confirm setup.
          </p>

          <div className={`otp-container tfa-otp-container ${invalid ? "otp-shake" : ""}`}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => (otpRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOTPChangeWithReset(index, e.target.value, otp, setOtp, otpRefs)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={index === 0 ? e => handleOTPPaste(e, setOtp, otpRefs) : undefined}
                className={`otp-box ${invalid ? "otp-box--invalid" : digit ? "otp-box--filled" : ""}`}
                disabled={isConfirming}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {error && <div className="error-message tfa-error">{error}</div>}

          <button
            className={`connect-btn tfa-verify-btn ${isConfirming ? "tfa-verifying" : ""}`}
            onClick={handleConfirm}
            disabled={isConfirming}
            style={{ marginTop: 8 }}
          >
            {isConfirming ? (
              <span className="tfa-spinner-row">
                <span className="tfa-spinner"/> Verifying…
              </span>
            ) : "ENABLE 2FA"}
          </button>

          <span className="footer-text" style={{ marginTop: 12 }}>Encrypted • Real-time • Limitless</span>
        </div>
      </div>
    </div>
  );
}
