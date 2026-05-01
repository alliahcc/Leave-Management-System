// src/pages/employee/EmployeeLeaveHistory.jsx
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { labelForLeaveType, statusLabel, formatLeaveDuration } from "../../utils/leave";

export default function EmployeeLeaveHistory() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await API.get("/employee/leaves/my", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        // Removed strict res.data.success check as backend might just return the leaves array/object
        const list = res.data.leaves || (Array.isArray(res.data) ? res.data : []);
        if (!cancelled) setLeaves(list);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const sortedLeaves = [...leaves].sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
  const filteredLeaves = sortedLeaves.filter((leave) => {
    if (filterStatus !== "all" && leave.status?.toLowerCase() !== filterStatus) return false;
    if (filterType !== "all" && leave.leaveType?.toLowerCase() !== filterType) return false;
    return true;
  });

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
            <span className="current">Leave History</span>
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
      <div className="page-title">Leave History</div>
      <div className="page-subtitle">All requests linked to your employee record.</div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', justifyContent: 'flex-end' }}>
        <select 
          className="filter-dropdown"
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select 
          className="filter-dropdown"
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Leave Types</option>
          <option value="vacation">Vacation Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="personal">Emergency Leave</option>
          <option value="other">Other Leave</option>
        </select>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="history-list">
        {filteredLeaves.length === 0 && !loading ? (
          <p className="muted">No leave records match your filter.</p>
        ) : (
          filteredLeaves.map((leave, index) => (
            <article key={`${leave._id}-${index}`} className="history-card">
              <div className="history-card-header">
                <div>
                  <div className="history-card-title">{labelForLeaveType(leave.leaveType)}</div>
                  <div className="history-card-dates">
                    {formatLeaveDuration(leave.startDate, leave.endDate)}
                  </div>
                </div>
                <span className={`badge badge-${leave.status?.toLowerCase() || "pending"}`}>
                  {statusLabel(leave.status)}
                </span>
              </div>
              
              <div className="history-card-reason">
                {leave.reason}
              </div>
              
              {leave.adminRemarks && (
                <div className="admin-remarks">
                  <strong>Admin remarks:</strong> {leave.adminRemarks}
                </div>
              )}
            </article>
          ))
        )}
      </div>
        </div>
      </main>
    </div>
  );
}
