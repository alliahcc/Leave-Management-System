// src/pages/employee/EmployeeProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function EmployeeProfile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch profile");
        }

        const data = res.data.user;
        if (!cancelled) {
          setDetail(data);
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
    <div className="employee-layout">
      {/* Sidebar */}
      <aside className="employee-sidebar">
        <div className="logo">
          <h2>SHIFTLY</h2>
          <span>Leave</span>
        </div>
        <nav className="employee-nav">
          <NavLink to="/employee/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
          <NavLink to="/employee/apply-leave" className={({ isActive }) => (isActive ? "active" : "")}>Apply for Leave</NavLink>
          <NavLink to="/employee/leave-history" className={({ isActive }) => (isActive ? "active" : "")}>Leave History</NavLink>
          <NavLink to="/employee/profile" className={({ isActive }) => (isActive ? "active" : "")}>Profile</NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="employee-main">
        {/* Top Header */}
        <header className="employee-header">
          <div className="breadcrumbs">
            <span>Home</span>
            <span>&gt;</span>
            <span className="current">Profile</span>
          </div>

          <div className="header-actions">
            {/* User Profile Info */}
            <div className="header-user-info">
              <div className="header-avatar">
                {user?.name?.[0] || "U"}{user?.lastName?.[0] || ""}
              </div>
              <span className="header-name">
                {user ? `${user.name} ${user.lastName}` : "Employee"}
              </span>
            </div>

            {/* Notification Bell */}
            <button 
              className={`header-icon-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="notifications-dropdown show">
                <div className="notifications-header">
                  <h4>Notifications</h4>
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowNotifications(false); }}>Mark all read</a>
                </div>
                <div className="notifications-list">
                  <div className="notification-item">
                    <p>No new notifications</p>
                    <span>You're all caught up!</span>
                  </div>
                </div>
                <div className="notifications-footer">
                  <NavLink to="/employee/leave-history" onClick={() => setShowNotifications(false)}>
                    View leave history
                  </NavLink>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="page-content">
      <div className="page-title">Profile</div>
      <div className="page-subtitle">Your account and leave balances</div>

      {error && <p className="error-msg">{error}</p>}

      {d && (
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-banner">
              <div className="profile-avatar-large">
                {d.name?.[0]}{d.lastName?.[0]}
              </div>
            </div>
            
            <div className="profile-body">
              <div className="profile-emp-id">
                Employee ID · {String(d._id).slice(-8).toUpperCase()}
              </div>

              <div className="profile-details">
                <div className="profile-detail-row">
                  <div className="profile-detail-label">Full Name</div>
                  <div className="profile-detail-value">{d.name} {d.lastName}</div>
                </div>
                <div className="profile-detail-row">
                  <div className="profile-detail-label">Email</div>
                  <div className="profile-detail-value">{d.email}</div>
                </div>
                <div className="profile-detail-row">
                  <div className="profile-detail-label">Role</div>
                  <div className="profile-detail-value" style={{textTransform: 'capitalize'}}>{d.role}</div>
                </div>
                <div className="profile-detail-row">
                  <div className="profile-detail-label">Department</div>
                  <div className="profile-detail-value">{d.department || "—"}</div>
                </div>
                <div className="profile-detail-row">
                  <div className="profile-detail-label">Position</div>
                  <div className="profile-detail-value">{d.position || "—"}</div>
                </div>
                <div className="profile-detail-row">
                  <div className="profile-detail-label">Contact</div>
                  <div className="profile-detail-value">{d.contact || "—"}</div>
                </div>
                <div className="profile-detail-row">
                  <div className="profile-detail-label">Leave Balances</div>
                  <div className="profile-detail-value">
                    Total Available: {d.leaveBalance || 0}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
