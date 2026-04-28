import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import API from "../../api/axios";   // ✅ centralized axios instance
import "../../styles/admin.css";

export default function AdminLeaveRequest() {
  const [leaves, setLeaves] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [user, setUser] = useState(null);

  // Fetch current user profile to display in sidebar
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
    // Logout handler (connected to backend)
  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  // 🔹 Fetch leaves from backend
  const fetchLeaves = async () => {
    try {
      const res = await API.get("/admin/leaves");
      // backend returns { success, statusCode, leaves }
      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setLeaves([]);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // 🔹 Filter leaves (only pending)
  const filteredLeaves = leaves.filter((l) => {
    const fullName = `${l.employee?.name || ""} ${l.employee?.lastName || ""}`.toLowerCase();
    const q = query.toLowerCase();
    return (
      l.status === "pending" && (   // ✅ only pending requests
        fullName.includes(q) ||
        (l.leaveType || "").toLowerCase().includes(q) ||
        (l.status || "").toLowerCase().includes(q)
      )
    );
  });

  // 🔹 Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / pageSize));
  const paginatedLeaves = filteredLeaves.slice((page - 1) * pageSize, page * pageSize);

  // 🔹 Modal controls
  const openModal = (leave) => {
    setSelectedLeave(leave);
    setRemarks("");
  };
  const closeModal = () => {
    setSelectedLeave(null);
    setRemarks("");
  };

  // 🔹 Approve/Reject via backend
  const updateLeaveStatus = async (id, status) => {
    try {
      await API.patch(`/admin/leaves/${id}/status`, { status, remarks });
      alert(`Leave ${status} successfully`);
      fetchLeaves(); // refresh list
      closeModal();
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
          <img src="https://i.pravatar.cc/40" alt="Profile" className="profile-pic" />
          <div>
            <p className="profile-name">{user?.name} {user?.lastName}</p>
            <p className="profile-role">{user?.role}</p>
          </div>
          {/* Static Logout button */}
          <button className="btn close" style={{ marginTop: "10px" }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="main">
        <header className="header">
          <div>
            <h1>All Leave Requests</h1>
            <p className="subtitle">Review, approve, or reject employee leave requests</p>
          </div>
          <div className="header-right">
            <input
              className="search"
              placeholder="Search by name, type, or status..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </header>

        <section className="table-section">
          <h3>Leave Requests</h3>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
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
                    <td>{leave.employee?.employeeId}</td>
                    <td>{leave.employee?.name} {leave.employee?.lastName}</td>
                    <td>{leave.employee?.department}</td>
                    <td>{leave.employee?.position}</td>
                    <td>{leave.leaveType}</td>
                    <td>
                      {new Date(leave.startDate).toLocaleDateString()} –{" "}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td>{leave.duration} days</td>
                    <td>
                      <span className={`status ${leave.status}`}>{leave.status}</span>
                    </td>
                    <td>{leave.reason}</td>
                    <td>{leave.employee?.contact}</td>
                    <td>
                      <button className="btn view" onClick={() => openModal(leave)}>View</button>
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

          {/* Pagination unchanged */}
        </section>

        {/* Modal */}
        {selectedLeave && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Leave Request Details</h2>
              <p><strong>Employee:</strong> {selectedLeave.employee?.name} {selectedLeave.employee?.lastName}</p>
              <p><strong>Department:</strong> {selectedLeave.employee?.department}</p>
              <p><strong>Position:</strong> {selectedLeave.employee?.position}</p>
              <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
              <p><strong>Dates:</strong> {selectedLeave.startDate} – {selectedLeave.endDate}</p>
              <p><strong>Duration:</strong> {selectedLeave.duration} days</p>
              <p><strong>Status:</strong> {selectedLeave.status}</p>
              <p><strong>Reason:</strong> {selectedLeave.reason}</p>
              <p><strong>Contact:</strong> {selectedLeave.employee?.contact}</p>
              <p><strong>Created At:</strong> {selectedLeave.createdAt}</p>
              <p><strong>Updated At:</strong> {selectedLeave.updatedAt}</p>

              <textarea
                placeholder="Add remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="btn approve" onClick={() => updateLeaveStatus(selectedLeave._id, "approved")}>Approve</button>
                <button className="btn reject" onClick={() => updateLeaveStatus(selectedLeave._id, "rejected")}>Reject</button>
                <button className="btn close" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
