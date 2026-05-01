// src/pages/employee/EmployeeDashboard.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        const userRes = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.data.success && !cancelled) {
          if (setUser) setUser((prev) => ({ ...prev, ...userRes.data.user }));
        }

        const leaveRes = await API.get("/employee/leaves/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Remove strict leaveRes.data.success check
        let fetchedLeaves = leaveRes.data.leaves || (Array.isArray(leaveRes.data) ? leaveRes.data : []);

          // Merge new leave if present
          const newLeave = localStorage.getItem("newLeave");
          if (newLeave) {
            fetchedLeaves = [JSON.parse(newLeave), ...fetchedLeaves];
            localStorage.removeItem("newLeave");
          }

          setLeaves(fetchedLeaves);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [navigate, setUser]);

  const sortedLeaves = [...leaves].sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
  const recent = sortedLeaves.slice(0, 5);
  const used = leaves.filter((l) => l.status?.toLowerCase() === "approved").length;

  return (
    <div className="employee-layout">
      {/* Sidebar */}
      <aside className="employee-sidebar">
        <div className="logo">
          <h2>SHIFTLY</h2>
          <span>Leave Management</span>
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
            <span className="current">Dashboard</span>
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
      <div className="page-title">
        Hello, {user ? user.name : "Employee"}
      </div>
      <div className="page-subtitle">
        Here is your leave overview.
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="stat-cards-wrapper">
        <div className="stat-card">
          <span className="stat-label">Total available (all types)</span>
          <div className="stat-value">
            <span className="stat-num">{user?.leaveBalance || 0}</span>
            <span className="stat-unit">days</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Used this year (approved)</span>
          <div className="stat-value">
            <span className="stat-num">{used}</span>
            <span className="stat-unit">days</span>
          </div>
        </div>
      </div>

      <Link to="/employee/apply-leave" className="apply-leave-banner">
        + Apply for leave
      </Link>

      <h2 className="section-title">Recent leave requests</h2>
      <div className="history-list">
        {recent.length === 0 ? (
          <p className="muted">No requests yet.</p>
        ) : (
          recent.map((leave, index) => (
            <article key={`${leave._id}-${index}`} className="history-card">
              <div className="history-card-header">
                <div>
                  <div className="history-card-title">{leave.leaveType || "Leave"}</div>
                  <div className="history-card-dates">
                    Applied {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : "—"}
                  </div>
                </div>
                <span className={`badge badge-${(leave.status || "pending").toLowerCase()}`}>
                  {leave.status || "Pending"}
                </span>
              </div>
              <div className="history-card-reason">
                {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : "—"} – {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : "—"}
              </div>
              <div className="history-card-reason" style={{ color: 'var(--text-muted)' }}>
                {leave.reason}
              </div>
            </article>
          ))
        )}
      </div>
        </div>
      </main>
    </div>
  );
}
