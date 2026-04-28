// src/pages/ChangePasswordPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/employee.css";

export default function ChangePasswordPage() {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !newPassword || !confirm) {
      setError("Fill in all fields.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await API.put("/auth/change-password", { email: email.trim(), newPassword });

      // If the email matches the logged-in user, update context
      if (user?.email && email.trim().toLowerCase() === user.email.toLowerCase()) {
        setUser({ ...user, mustChangePassword: false });
      }

      setMessage("Password updated. You can log in with the new password.");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page auth-page--simple">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-kicker">Account</span>
          <h1>Change password</h1>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>

          {error && <p className="error-msg">{error}</p>}
          {message && <p className="success-msg">{message}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Saving…" : "Change password"}
          </button>

          <p className="auth-footer">
            <Link to="/login">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
