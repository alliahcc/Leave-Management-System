// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/employee.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

    if (response.ok && data.token) {
      // Save token
      localStorage.setItem("token", data.token);

      // Save user info (make sure backend returns role!)
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: data.user?.email || email,
          role: data.user?.role,   // <-- critical
        })
      );

      // Navigate based on role
      if (data.user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (data.user?.role === "employee") {
        navigate("/employee/dashboard", { replace: true });
      }
    } else {
      setError(data.message || "Login failed");
    }

    } catch (err) {
      console.error(err);
      setError("Cannot connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page auth-page--split">
      <div className="auth-hero">
        <div className="auth-hero__content">
          <span className="auth-hero__logo">SHIFTLY</span>
          <h2 className="auth-hero__title">Leave management, simplified.</h2>
          <p className="auth-hero__text">
            Request time off, track balances, and stay aligned with your team —
            all in one place.
          </p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-kicker">Welcome back</span>
            <h1>Sign in</h1>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <div className="auth-row">
              <label className="checkbox">
                <input type="checkbox" defaultChecked /> Keep me signed in
              </label>
              <Link to="/change-password" className="link">
                Forgot password?
              </Link>
            </div>
            {error ? <p className="error-msg">{error}</p> : null}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
