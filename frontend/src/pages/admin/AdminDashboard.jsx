import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import API from "../../api/axios";   // ✅ centralized axios instance
import "../../styles/admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalEmployees: 0, pendingLeaves: 0, approvedLeaves: 0 });
  const [leaves, setLeaves] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [user, setUser] = useState(null);

// 🔹 Fetch current user profile
useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await API.get("/auth/me"); // backend returns { success, user }
      setUser(res.data.user);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };
  fetchUser();
}, []);

// 🔹 Logout handler (connected to backend)
const handleLogout = async () => {
  try {
    await API.post("/auth/logout");
    localStorage.removeItem("token");
    window.location.href = "/login";
  } catch (err) {
    console.error("Error logging out:", err);
  }
};

// 🔹 Fetch stats from backend
const fetchStats = async () => {
  try {
    const res = await API.get("/admin/stats");
    setStats(res.data.stats || { totalEmployees: 0, pendingLeaves: 0, approvedLeaves: 0 });
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
};

// 🔹 Fetch leaves from backend
const fetchLeaves = async () => {
  try {
    const res = await API.get("/admin/leaves");
    setLeaves(res.data.leaves || []);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    setLeaves([]);
  }
};

useEffect(() => {
  fetchStats();
  fetchLeaves();
}, []);

// 🔹 Filter leaves by search query
const filteredLeaves = leaves
  .filter((l) => l.status !== "cancelled")   // ✅ remove cancelled
  .filter((l) => {
    const fullName = `${l.employee?.name || ""} ${l.employee?.lastName || ""}`.toLowerCase();
    const q = query.toLowerCase();
    return (
      fullName.includes(q) ||
      (l.leaveType || "").toLowerCase().includes(q) ||
      (l.status || "").toLowerCase().includes(q)
    );
  });

// 🔹 Sort by pending → approved → rejected
const statusOrder = { pending: 1, approved: 2, rejected: 3 };

const sortedLeaves = [...filteredLeaves].sort((a, b) => {
  const orderA = statusOrder[a.status] || 99; // default for other statuses
  const orderB = statusOrder[b.status] || 99;
  return orderA - orderB;
});


// 🔹 Pagination
const totalPages = Math.max(1, Math.ceil(sortedLeaves.length / pageSize));
const paginatedLeaves = sortedLeaves.slice((page - 1) * pageSize, page * pageSize);

// 🔹 Approve/Reject leave
const updateLeaveStatus = async (id, status) => {
  try {
    const payload = { status };

    if (status === "rejected") {
      if (!remarks.trim()) {
        alert("Remarks are required when rejecting a leave.");
        return;
      }
      payload.remarks = remarks.trim();
    }

    await API.patch(`/admin/leaves/${id}/status`, payload);
    alert(`Leave ${status} successfully`);
    fetchLeaves();
    setSelectedLeave(null);
    setRemarks("");
  } catch (err) {
    alert(err.response?.data?.message || "Error updating leave status");
  }
};


  return (
    <div className="dashboard-container">
      {/* Sidebar unchanged */}
    <aside className="sidebar">
      <div className="logo">
        <h2>SHIFTLY</h2>
        <span>Admin Portal</span>
      </div>

      <nav className="nav">
        <NavLink to="/admin">Dashboard</NavLink>
        <NavLink to="/admin/employee">Employees</NavLink>
        <NavLink to="/admin/leave-request">Leave Requests</NavLink>
        <NavLink to="/admin/leave-history">Leave History</NavLink>
        <div className="nav-section">Trash</div>
        <NavLink to="/admin/trash/employee">Employee</NavLink>
        <NavLink to="/admin/trash/leave-record">Leave Record</NavLink>
        <NavLink to="/admin/audit-logs">Audit Logs</NavLink>
      </nav>

      <div className="sidebar-footer">
        <img
          src="https://i.pravatar.cc/40"
          alt="Profile"
          className="profile-pic"
        />
        <div>
          <p className="profile-name">{user?.name} {user?.lastName}</p>
          <p className="profile-role">{user?.role}</p>
        </div>
        <button className="btn close" style={{ marginTop: "10px" }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>

      {/* Main */}
      <main className="main">
        <header className="header">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Manage and track all employee leave requests</p>
          </div>
          <input
            className="search"
            placeholder="Search by name, type, or status..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </header>

        {/* Stats from backend */}
        <div className="stats">
          <div className="card">
            <h4>Total Employees</h4>
            <p>{stats.totalEmployees}</p>
          </div>
          <div className="card pending">
            <h4>Pending Leaves</h4>
            <p>{stats.pendingLeaves}</p>
          </div>
          <div className="card approved">
            <h4>Approved Leaves</h4>
            <p>{stats.approvedLeaves}</p>
          </div>
          <div className="card rejected">
            <h4>Rejected Leaves</h4>
            <p>{leaves.filter(l => l.status === "rejected").length}</p>
          </div>
        </div>

        {/* Leave requests table */}
        <section className="table-section">
          <h3>Leave Requests</h3>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeaves.length > 0 ? (
                paginatedLeaves.map((leave) => (
                  <tr key={leave._id}>
                    <td>{leave.employee?.name} {leave.employee?.lastName}</td>
                    <td>{leave.employee?.department || "—"}</td>
                    <td>{leave.employee?.position || "—"}</td>
                    <td>{leave.leaveType}</td>
                    <td>
                      {new Date(leave.startDate).toLocaleDateString()} –{" "}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td>{leave.duration} days</td>
                    <td><span className={`status ${leave.status}`}>{leave.status}</span></td>
                    <td>{leave.reason || "—"}</td>
                    <td>{leave.employee?.contact || "—"}</td>
                    <td>
                      {/* Only View button in table */}
                      <button className="btn view" onClick={() => setSelectedLeave(leave)}>View</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center" }}>No leave requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Modal */}
        {selectedLeave && (
          <div className="modal-overlay" onClick={() => setSelectedLeave(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Leave Details</h2>
              <p><strong>Employee:</strong> {selectedLeave.employee?.name} {selectedLeave.employee?.lastName}</p>
              <p><strong>Department:</strong> {selectedLeave.employee?.department || "—"}</p>
              <p><strong>Position:</strong> {selectedLeave.employee?.position || "—"}</p>
              <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
              <p><strong>Dates:</strong> {new Date(selectedLeave.startDate).toLocaleDateString()} – {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
              <p><strong>Duration:</strong> {selectedLeave.duration} days</p>
              <p><strong>Status:</strong> {selectedLeave.status}</p>
              <p><strong>Reason:</strong> {selectedLeave.reason || "—"}</p>
              <p><strong>Contact:</strong> {selectedLeave.employee?.contact || "—"}</p>
              <p><strong>Created At:</strong> {selectedLeave.createdAt}</p>
              <p><strong>Updated At:</strong> {selectedLeave.updatedAt}</p>

              {/* Remarks only shown when rejecting */}
              {selectedLeave.status === "pending" && (
                <textarea
                  placeholder="Add remarks (required for rejection)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              )}

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                {/* Show Approve/Reject only if status is pending */}
                {selectedLeave.status === "pending" && (
                  <>
                    <button className="btn approve" onClick={() => updateLeaveStatus(selectedLeave._id, "approved")}>Approve</button>
                    <button className="btn reject" onClick={() => updateLeaveStatus(selectedLeave._id, "rejected")}>Reject</button>
                  </>
                )}

                {/* Always show Close button */}
                <button className="btn close" onClick={() => { 
                  setSelectedLeave(null); 
                  setRemarks(""); 
                }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
