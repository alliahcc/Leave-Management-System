import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import API from "../../api/axios";   // ✅ centralized axios instance
import "../../styles/admin.css";

export default function AdminTrashLeaveRecord() {
  const [trashRecords, setTrashRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [user, setUser] = useState(null);

  // Fetch current user profile to display in sidebar (also used in other admin pages, so we can consider moving this to a higher-level component or context)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
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

  // 🔹 Fetch trashed leave records from backend
const fetchTrashRecords = async () => {
  try {
    const res = await API.get("/admin/leaves/trashed"); // ✅ now valid
    setTrashRecords(res.data.leaves || []);
  } catch (err) {
    console.error("Error fetching trash leave records:", err);
    setTrashRecords([]);
  }
};

  useEffect(() => {
    fetchTrashRecords();
  }, []);

  // 🔹 Filter records by search query
  const filteredRecords = trashRecords.filter((rec) => {
    const q = query.toLowerCase();
    return (
      `${rec.employeeName} ${rec.employeeLastName}`.toLowerCase().includes(q) ||
      (rec.leaveType || "").toLowerCase().includes(q) ||
      (rec.status || "").toLowerCase().includes(q) ||
      (rec.reason && rec.reason.toLowerCase().includes(q))
    );
  });

  // 🔹 Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  // 🔹 Restore/Delete handlers connected to backend
  const handleRestore = async (id) => {
    try {
      await API.patch(`/admin/leaves/${id}/restore`);
      alert(`Leave record ${id} restored successfully`);
      fetchTrashRecords(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Error restoring leave record");
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/admin/leaves/${id}/permanent`);
      alert(`Leave record ${id} permanently deleted`);
      fetchTrashRecords(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting leave record");
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
          <button className="btn close" style={{ marginTop: "10px" }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main unchanged */}
      <main className="main">
        <header className="header">
          <div>
            <h1>Trash – Leave Records</h1>
            <p>Manage trashed leave requests. You can restore or permanently delete them.</p>
          </div>
          <input
            className="search"
            placeholder="Search by employee, type, status, or reason..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </header>

        <section className="table-section">
          <h3>Leave Records in Trash</h3>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Trashed At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => (
                  <tr key={rec._id}>
                    <td>{rec.employee?.employeeId}</td>
                    <td>{rec.employeeName} {rec.employeeLastName}</td>
                    <td>{rec.leaveType}</td>
                    <td>
                      {new Date(rec.startDate).toLocaleDateString()} –{" "}
                      {new Date(rec.endDate).toLocaleDateString()}
                    </td>
                    <td>{rec.duration} days</td>
                    <td>
                      <span className={`status ${rec.status}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>{rec.reason || "—"}</td>
                    <td>{rec.trashedAt || "—"}</td>
                    <td>
                      <button className="btn view" onClick={() => setSelectedRecord(rec)}>
                        View
                      </button>
                      <button className="btn approve" onClick={() => handleRestore(rec._id)}>
                        Restore
                      </button>
                      <button className="btn reject" onClick={() => handleDelete(rec._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No leave records in trash
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Modal unchanged */}
        {selectedRecord && (
          <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Leave Record Details</h2>
              <p><strong>Employee ID:</strong> {selectedRecord.employee?.employeeId}</p>
              <p><strong>Employee:</strong> {selectedRecord.employeeName} {selectedRecord.employeeLastName}</p>
              <p><strong>Leave Type:</strong> {selectedRecord.leaveType}</p>
              <p><strong>Dates:</strong> {selectedRecord.startDate} – {selectedRecord.endDate}</p>
              <p><strong>Duration:</strong> {selectedRecord.duration} days</p>
              <p><strong>Status:</strong> {selectedRecord.status}</p>
              <p><strong>Reason:</strong> {selectedRecord.reason || "—"}</p>
              <p><strong>Created At:</strong> {selectedRecord.createdAt}</p>
              <p><strong>Updated At:</strong> {selectedRecord.updatedAt}</p>
              <p><strong>Trashed At:</strong> {selectedRecord.trashedAt || "—"}</p>
              <p><strong>Deleted At:</strong> {selectedRecord.deletedAt || "—"}</p>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="btn approve" onClick={() => handleRestore(selectedRecord._id)}>
                  Restore
                </button>
                <button className="btn reject" onClick={() => handleDelete(selectedRecord._id)}>
                  Delete
                </button>
                <button className="btn close" onClick={() => setSelectedRecord(null)}>
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
