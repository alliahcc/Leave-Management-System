// src/pages/EmployeeLeaveHistory.jsx
import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { labelForLeaveType, statusLabel, formatLeaveDuration } from "../../utils/leave";
import "../../styles/employee.css";

export default function LeaveHistoryPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) return; // ✅ guard against null user

      setLoading(true);
      setError("");
      try {
        const res = await API.get("/employee/leaves/my", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch leaves");
        }

        const list = res.data.leaves || [];
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

  return (
    <div className="page leave-history-page">
      <div className="page-intro">
        <h1>Leave history</h1>
        <span className="muted">
          All requests linked to your employee record.
        </span>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-msg">{error}</p>}

      <div className="card-list">
        {leaves.length === 0 && !loading ? (
          <p className="muted">No leave records yet.</p>
        ) : (
          leaves.map((leave, index) => (
            <article key={`${leave._id}-${index}`} className="history-card">
              <div className="history-top">
                <h3>{labelForLeaveType(leave.leaveType)}</h3>
                <span
                  className={`badge badge-${leave.status?.toLowerCase() || "pending"}`}
                >
                  {statusLabel(leave.status)}
                </span>
              </div>
              <p className="muted small">
                {formatLeaveDuration(leave.startDate, leave.endDate)}
              </p>
              <p>{leave.reason}</p>
              {leave.adminRemarks && (
                <p className="admin-remarks">
                  <span className="muted">Admin remarks:</span>{" "}
                  {leave.adminRemarks}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
