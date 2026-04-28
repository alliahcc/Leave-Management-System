// src/pages/EmployeeDashboard.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/employee.css";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        const userRes = await fetch("http://localhost:5000/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error("Session expired. Please login again.");
        const userJson = await userRes.json();
        setUserData(userJson.user);

        const leaveRes = await fetch("http://localhost:5000/api/v1/employee/leaves/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (leaveRes.ok) {
          const leaveJson = await leaveRes.json();
          let fetchedLeaves = leaveJson.leaves || [];

          // ✅ Merge new leave if present
          const newLeave = localStorage.getItem("newLeave");
          if (newLeave) {
            fetchedLeaves = [JSON.parse(newLeave), ...fetchedLeaves];
            localStorage.removeItem("newLeave"); // clear after use
          }

          setLeaves(fetchedLeaves);
        }
      } catch (e) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await fetch("http://localhost:5000/api/v1/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const recent = leaves.slice(0, 5);
  const used = leaves.filter((l) => l.status?.toLowerCase() === "approved").length;

  if (loading) {
    return (
      <div className="page dashboard-page">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <div className="page-intro">
        <h1>
          Hello, {userData ? `${userData.name} ${userData.lastName}` : "User"}!
        </h1>
        <span className="muted">Here is your leave overview.</span>
        <button
          onClick={handleLogout}
          className="btn btn-sm"
          style={{ marginLeft: "10px" }}
        >
          Logout
        </button>
      </div>

      {error ? <p className="error-msg">{error}</p> : null}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total available (all types)</span>
          <strong className="stat-num">{userData?.leaveBalance || 0}</strong>
          <span className="stat-unit">days</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Used this year (approved)</span>
          <strong className="stat-num">{used}</strong>
          <span className="stat-unit">days</span>
        </div>
      </div>

  <div className="nav-buttons" style={{ margin: "20px 0" }}>
    <Link to="/employee/dashboard" className="btn btn-light btn-block">
      🏠 Dashboard
    </Link>
    <Link to="/employee/apply-leave" className="btn btn-dark btn-block">
      ➕ Apply for Leave
    </Link>
    <Link to="/employee/leave-history" className="btn btn-light btn-block">
      📜 Leave History
    </Link>
    <Link to="/employee/profile" className="btn btn-light btn-block">
      👤 Profile
    </Link>
  </div>

      <h2 className="section-title">Recent leave requests</h2>
      <div className="card-list">
        {recent.length === 0 ? (
          <p className="muted">No requests yet.</p>
        ) : (
          recent.map((leave, index) => (
            <article 
              key={`${leave._id}-${index}`}   // ✅ unique key
              className="leave-card"
            >
              <div className="leave-card-top">
                <div>
                  <h3>{leave.leaveType || "Leave"}</h3>
                  <p className="muted small">
                    Applied{" "}
                    {leave.createdAt
                      ? new Date(leave.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <span
                  className={`badge badge-${(leave.status || "pending").toLowerCase()}`}
                >
                  {leave.status || "Pending"}
                </span>
              </div>
              <p className="leave-meta">
                {leave.startDate
                  ? new Date(leave.startDate).toLocaleDateString()
                  : "—"}{" "}
                –{" "}
                {leave.endDate
                  ? new Date(leave.endDate).toLocaleDateString()
                  : "—"}
              </p>
              <p className="leave-reason">{leave.reason}</p>
            </article>
          ))
        )}
      </div>

    </div>
  );
}
