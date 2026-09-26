import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";
import "../styles/auth.css";
import loginBg from "../assets/Logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleKeyEvent = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const handleClick = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter your username and password.");
      return;
    }
    setLoginError("");
    // Stub: navigate to 2FA — replace with real API call once backend is ready
    navigate("/app");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className="login-root">
      {/* Top-left app name */}
      <div className="top-left-app-name">
        <img src={loginBg} alt="BeyondChat Logo" className="app-logo" />
        <span>BeyondChat</span>
      </div>

      {/* Wrapper for card + register */}
      <div className="login-wrapper">
        {/* Login card */}
        <div className="login-card">
          <h1 className="logo" style={{ marginBottom: '28px' }}>Login</h1>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            className={loginError && !username.trim() ? "input-error" : ""}
            autoFocus
          />

          {/* Password field */}
          <div className="password-wrapper">
            <div className="input-relative">
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyEvent}
                onKeyUp={handleKeyEvent}
                onClick={handleClick}
                onKeyPress={handleKeyPress}
                className={`password-input ${loginError && !password.trim() ? "input-error" : ""}`}
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

            {/* Caps lock warning with fixed height container */}
            <div className="caps-warning-container">
              {capsLockOn && <div className="caps-warning">Caps Lock is ON</div>}
            </div>
          </div>

          {loginError && (
            <div className="error-message" style={{ textAlign: "center", marginBottom: 8 }}>
              {loginError}
            </div>
          )}

          <div className="forgot-register">
            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          </div>

          <button className="connect-btn" onClick={handleLogin}>CONNECT</button>

          <span className="footer-text">Encrypted • Real-time • Limitless</span>
        </div>

        {/* Register section outside card */}
        <div className="register-outside">
            <span>Don't have an account?</span>
            <Link to="/register">
                <button className="register-btn">Join Us</button>
            </Link>
        </div>
      </div>
    </div>
  );
}
