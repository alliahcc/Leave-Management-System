// src/pages/employee/EmployeeApplyLeave.jsx
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const STEPS = ["Type", "Details", "Review"];

const OPTIONS = [
  { label: "Vacation Leave", value: "vacation", description: "Annual" },
  { label: "Sick Leave", value: "sick", description: "Sick" },
  { label: "Emergency Leave", value: "personal", description: "Personal" },
];

export default function EmployeeApplyLeave() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [leaveType, setLeaveType] = useState("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function next() {
    setError("");
    if (step === 1) {
      if (!startDate || !endDate || !reason.trim()) {
        setError("Please fill in dates and reason.");
        return;
      }
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e < s) {
        setError("End date must be on or after start date.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setError("");
    setLoading(true);
    const token = localStorage.getItem("token");
    const finalReason = urgent ? `[URGENT] ${reason.trim()}` : reason.trim();

    try {
      const response = await API.post("/employee/leaves", {
        leaveType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason: finalReason,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        localStorage.setItem("newLeave", JSON.stringify(response.data.leave));
        navigate("/employee/dashboard");
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Could not submit leave request");
    } finally {
      setLoading(false);
    }
  }

  const selected = OPTIONS.find((o) => o.value === leaveType);

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
            <span className="current">Apply for leave</span>
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
      <div className="stepper-container">
        <div className="stepper">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`step-item ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
            >
              <div className="step-circle">{i + 1}</div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="page-title">Apply for leave</div>
      
      {/* Step 0: Type */}
      {step === 0 && (
        <>
          <div className="page-subtitle">Choose the type of your leave request.</div>
          <div className="leave-type-options">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`leave-type-card ${leaveType === opt.value ? "selected" : ""}`}
                onClick={() => setLeaveType(opt.value)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.description}</span>
              </button>
            ))}
          </div>
          <div className="action-buttons">
            <button type="button" className="btn btn-primary" onClick={next}>
              Continue
            </button>
          </div>
        </>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="form-card">
          <div className="form-row">
            <div className="field">
              <label>Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Reason</label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for your leave..."
            />
          </div>
          <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <input
              type="checkbox"
              id="urgent"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="urgent" style={{ margin: 0, cursor: 'pointer' }}>Mark as urgent</label>
          </div>
          
          {error && <p className="error-msg">{error}</p>}
          
          <div className="action-buttons">
            <button type="button" className="btn btn-ghost" onClick={back}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={next}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="form-card">
          <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Review Request</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <span className="stat-label">Leave Type</span>
            <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              {selected?.label} {urgent && <span className="badge badge-urgent" style={{ marginLeft: '8px' }}>Urgent</span>}
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <span className="stat-label">Duration</span>
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>
              {startDate} to {endDate}
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <span className="stat-label">Reason</span>
            <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
              {urgent ? `[URGENT] ${reason}` : reason}
            </div>
          </div>
          
          {error && <p className="error-msg">{error}</p>}
          
          <div className="action-buttons">
            <button type="button" className="btn btn-ghost" onClick={back}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
