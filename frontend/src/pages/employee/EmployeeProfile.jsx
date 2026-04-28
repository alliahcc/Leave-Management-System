// src/pages/EmployeeProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "../../styles/employee.css";

export default function ProfilePage() {
  // ✅ AuthContext now exposes setUser (make sure you added it in AuthContext.Provider)
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        // ✅ backend returns { success, user }
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch profile");
        }

        const data = res.data.user;
        if (!cancelled) {
          setDetail(data);
          // ✅ update global auth context
          if (setUser) {
            setUser((prev) => ({ ...prev, ...data, password: undefined }));
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load profile");
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  const d = detail || user;

  return (
    <div className="page profile-page">
      <div className="page-intro">
        <h1>Profile</h1>
        <span className="muted">Personal Information</span>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {d && (
        <div className="profile-card">
          <div className="profile-card__banner" aria-hidden />
          <div className="profile-avatar" aria-hidden>
            {d.name?.[0]}
            {d.lastName?.[0]}
          </div>
          <div className="profile-card__body">
            <p className="emp-id">
              Employee ID · {String(d._id).slice(-8).toUpperCase()}
            </p>
            <dl className="profile-dl">
              <div>
                <dt>Full name</dt>
                <dd>{d.name} {d.lastName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{d.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{d.role}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{d.department || "—"}</dd>
              </div>
              <div>
                <dt>Position</dt>
                <dd>{d.position || "—"}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{d.contact || "—"}</dd>
              </div>
            </dl>

            <div style={{ marginTop: "1.1rem" }}>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
