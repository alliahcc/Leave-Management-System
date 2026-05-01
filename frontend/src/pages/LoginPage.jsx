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
          <p className="auth-hero__title">Streamline your team's time off.</p>
          <p className="auth-hero__text">
            The modern standard for leave management. Efficient, transparent, and built for high-performance teams.
          </p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-kicker">Sign In</span>
            <h1>Welcome back</h1>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
              />
            </label>
            <div className="auth-row">
              <label className="checkbox">
                <input type="checkbox" defaultChecked /> Remember me
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
              style={{ marginTop: '10px' }}
            >
              {loading ? "Loading..." : "Sign In to Dashboard"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
