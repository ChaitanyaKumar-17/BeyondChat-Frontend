import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import "../styles/Register.css";
import loginBg from "../assets/Logo.png";
import {
  validateEmail,
  validateOTP,
  validateDetails,
  validateCredentials,
  sanitizeName
} from "../utils/registerValidation";
import { handleOTPChange, handleOTPKeyDown, handleOTPPaste } from "../utils/otpHelpers";
import { countryPhoneData, getMaxLengthForCountry } from "../utils/countryPhoneData";

/* ── Custom Select Dropdown ─────────────────────────────── */
function CustomSelect({ options, value, onChange, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) searchRef.current.focus();
  }, [isOpen]);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.value.includes(search)
  );

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className={`custom-select ${className}`} ref={ref}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => { setIsOpen(!isOpen); setSearch(""); }}
      >
        <span className="custom-select-value">{value}</span>
        <svg className={`custom-select-chevron ${isOpen ? "rotated" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && (
        <div className="custom-select-dropdown">
          <div className="custom-select-search-wrap">
            <input
              ref={searchRef}
              type="text"
              className="custom-select-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="custom-select-options">
            {filtered.length > 0 ? filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`custom-select-option ${opt.value === value ? "selected" : ""}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(""); }}
              >
                <span>{opt.label}</span>
                {opt.value === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            )) : (
              <div className="custom-select-empty">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Custom Date Picker ─────────────────────────────────── */
function CustomDatePicker({ value, onChange, maxDate, hasError }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + "T00:00:00");
    if (maxDate) return new Date(maxDate + "T00:00:00");
    return new Date();
  });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const maxD = maxDate ? new Date(maxDate + "T00:00:00") : null;
  const selectedStr = value || "";

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => {
    const next = new Date(year, month + 1, 1);
    if (maxD && next.getFullYear() * 12 + next.getMonth() > maxD.getFullYear() * 12 + maxD.getMonth()) return;
    setViewDate(next);
  };
  const prevYear = () => setViewDate(new Date(year - 1, month, 1));
  const nextYear = () => {
    const next = new Date(year + 1, month, 1);
    if (maxD && next.getFullYear() * 12 + next.getMonth() > maxD.getFullYear() * 12 + maxD.getMonth()) return;
    setViewDate(next);
  };

  const isNextMonthDisabled = maxD && (year * 12 + month + 1) > (maxD.getFullYear() * 12 + maxD.getMonth());
  const isNextYearDisabled = maxD && ((year + 1) * 12 + month) > (maxD.getFullYear() * 12 + maxD.getMonth());

  const selectDay = (day) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${year}-${m}-${d}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const isDisabled = (day) => {
    if (!maxD) return false;
    return new Date(year, month, day) > maxD;
  };

  const isSelected = (day) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}` === selectedStr;
  };

  const formatDisplay = (val) => {
    if (!val) return "";
    const parts = val.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className={`custom-datepicker ${hasError ? "input-error" : ""}`} ref={ref}>
      <button
        type="button"
        className={`custom-datepicker-trigger ${isOpen ? "open" : ""} ${!value ? "placeholder" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value ? formatDisplay(value) : "Date of Birth"}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>
      {isOpen && (
        <div className="custom-datepicker-dropdown">
          <div className="custom-datepicker-header">
            <button type="button" onClick={prevYear} className="dp-nav-btn" title="Previous year">«</button>
            <button type="button" onClick={prevMonth} className="dp-nav-btn" title="Previous month">‹</button>
            <span className="dp-month-year">{months[month]} {year}</span>
            <button type="button" onClick={nextMonth} className={`dp-nav-btn ${isNextMonthDisabled ? "disabled" : ""}`} disabled={isNextMonthDisabled} title="Next month">›</button>
            <button type="button" onClick={nextYear} className={`dp-nav-btn ${isNextYearDisabled ? "disabled" : ""}`} disabled={isNextYearDisabled} title="Next year">»</button>
          </div>
          <div className="custom-datepicker-weekdays">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="custom-datepicker-grid">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <span key={`e${i}`} className="dp-empty"/>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  className={`dp-day ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                  onClick={() => !disabled && selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Step Indicator ─────────────────────────────────────── */
function StepIndicator({ currentStep }) {
  const steps = [
    { label: "Email"   },
    { label: "Verify"  },
    { label: "Details" },
    { label: "Account" },
    { label: "2FA"     },
  ];

  return (
    <div className="reg-step-indicator">
      {steps.map(({ label }, i) => {
        const num = i + 1;
        const isCompleted = num < currentStep;
        const isActive = num === currentStep;
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
            {i < steps.length - 1 && (
              <div className={`reg-step-line ${isCompleted ? "completed" : ""}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);


  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});

  const otpRefs = useRef([]);

  // Step handlers
  const handleEmailSubmit = () => {
    if (validateEmail(email, setErrors)) {
      setErrors({});
      setStep(2);
    }
  };

  const handleOTPSubmit = () => {
    if (validateOTP(otp, setErrors)) {
      setErrors({});
      setStep(3);
    }
  };

  const handleDetailsSubmit = () => {
    if (validateDetails(firstName, lastName, phone, dob, countryCode, setErrors)) {
      setStep(4);
    }
  };

  const handleCredentialsSubmit = () => {
    if (validateCredentials(username, password, setErrors)) {
      // Navigate to 2FA setup — on success it redirects to /app
      navigate("/2fa-setup", { state: { email, phone, countryCode } });
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep(step - 1);
  };

  // Handle Enter key press for standard inputs
  const handleKeyPress = (e, submitFunction) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitFunction();
    }
  };

  // Get max date for DOB (18 years ago)
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="register-root">
      <div className="top-left-app-name">
        <img src={loginBg} alt="BeyondChat Logo" className="app-logo" />
        <span>BeyondChat</span>
      </div>

      <div className="register-wrapper">
        <div className="register-card">
          <StepIndicator currentStep={step}/>

          {/* Step 1: Email */}
          {step === 1 && (
            <>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleEmailSubmit)}
                className={errors.email ? "input-error" : ""}
                autoFocus
              />
              {errors.email && <div className="error-message">{errors.email}</div>}

              <div className="button-spacer"></div>

              <button className="connect-btn" onClick={handleEmailSubmit}>
                CONTINUE
              </button>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <>
              <p className="otp-message">
                OTP has been sent to <strong>{email}</strong>
              </p>

              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value, otp, setOtp, otpRefs)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleOTPSubmit();
                      } else {
                        handleOTPKeyDown(index, e, otp, otpRefs);
                      }
                    }}
                    onPaste={index === 0 ? (e) => handleOTPPaste(e, setOtp, otpRefs) : undefined}
                    className={`otp-box ${errors.otp ? "input-error" : ""}`}
                  />
                ))}
              </div>
              {errors.otp && <div className="error-message">{errors.otp}</div>}

              <button className="connect-btn" onClick={handleOTPSubmit}>
                VERIFY OTP
              </button>
              <button className="back-btn" onClick={handleBack}>
                Back
              </button>
            </>
          )}

          {/* Step 3: Personal Details */}
          {step === 3 && (
            <>
              <div className="name-group">
                <div className="name-field first-name-field">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(sanitizeName(e.target.value))}
                    onKeyPress={(e) => handleKeyPress(e, handleDetailsSubmit)}
                    className={errors.firstName ? "input-error" : ""}
                    autoFocus
                  />
                  {errors.firstName && <div className="error-message">{errors.firstName}</div>}
                </div>

                <div className="name-field last-name-field">
                  <input
                    type="text"
                    placeholder="Last Name (Optional)"
                    value={lastName}
                    onChange={(e) => setLastName(sanitizeName(e.target.value))}
                    onKeyPress={(e) => handleKeyPress(e, handleDetailsSubmit)}
                    className={errors.lastName ? "input-error" : ""}
                  />
                  {errors.lastName && <div className="error-message">{errors.lastName}</div>}
                </div>
              </div>

              <div className="section-spacer"></div>

              <div className="phone-group">
                <CustomSelect
                  className="country-code-custom"
                  options={countryPhoneData.map(c => ({ value: c.code, label: `${c.code}` }))}
                  value={countryCode}
                  onChange={(val) => { setCountryCode(val); setPhone(""); }}
                />

                <input
                  type="tel"
                  placeholder={`Phone (${getMaxLengthForCountry(countryCode)} digits)`}
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const maxLength = getMaxLengthForCountry(countryCode);
                    if (value.length <= maxLength) setPhone(value);
                  }}
                  onKeyPress={(e) => handleKeyPress(e, handleDetailsSubmit)}
                  className={`phone-input ${errors.phone ? "input-error" : ""}`}
                />
              </div>
              {errors.phone && <div className="error-message">{errors.phone}</div>}

              <div className="section-spacer"></div>

              <CustomDatePicker
                value={dob}
                onChange={(val) => setDob(val)}
                maxDate={getMaxDate()}
                hasError={!!errors.dob}
              />
              {errors.dob && <div className="error-message">{errors.dob}</div>}

              <button className="connect-btn" onClick={handleDetailsSubmit}>
                CONTINUE
              </button>
              <button className="back-btn" onClick={handleBack}>
                Back
              </button>
            </>
          )}

          {/* Step 4: Credentials */}
          {step === 4 && (
            <>
              <input
                type="text"
                placeholder="Username (min 8 characters)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleCredentialsSubmit)}
                className={errors.username ? "input-error" : ""}
                autoFocus
              />
              {errors.username && <div className="error-message">{errors.username}</div>}

              <div className="password-wrapper">
                <div className="input-relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Password (min 12 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleCredentialsSubmit)}
                    className={`password-input ${errors.password ? "input-error" : ""}`}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    aria-label="Toggle password visibility"
                  >
                    {passwordVisible ? (
                      <svg
                         xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         strokeWidth="2"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                       >
                         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                         <circle cx="12" cy="12" r="3" />
                       </svg>
                    ) : (
                      <svg
                         xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         strokeWidth="2"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                       >
                         <path d="M17.94 17.94C16.19 19.19 14.13 20 12 20c-7 0-11-8-11-8 1.43-2.19 3.51-4.06 5.94-5.47"/>
                         <line x1="1" y1="1" x2="23" y2="23"/>
                       </svg>
                    )}
                  </button>
                </div>
              </div>
              {errors.password && <div className="error-message">{errors.password}</div>}

              <div className="password-requirements">
                <small>Password must contain:</small>
                <small>• At least 12 characters</small>
                <small>• Uppercase and lowercase letters</small>
                <small>• Special characters (!@#$%...)</small>
              </div>

              <button className="connect-btn" onClick={handleCredentialsSubmit}>
                CREATE ACCOUNT
              </button>
              <button className="back-btn" onClick={handleBack}>
                Back
              </button>
            </>
          )}

          <span className="footer-text">Encrypted • Real-time • Limitless</span>
        </div>

        <div className="login-link-section">
          <span>Already have an account?</span>
          <Link to="/login">
            <button className="login-btn">Sign In</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
