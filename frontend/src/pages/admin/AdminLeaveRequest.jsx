import { useState, useEffect } from "react";
import API from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import { useAdminUser } from "../../hooks/useAdminUser";
import "../../styles/admin.css";

export default function AdminLeaveRequest() {
  const user = useAdminUser();
  const [leaves, setLeaves] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
      <AdminSidebar user={user} />
      {/* Main */}
      <main className="main">
        <header className="header">
          <div>
            <h1>All Leave Requests</h1>
            <p>Review, approve, or reject employee leave requests</p>
          </div>
          <div className="header-right">
            <input
              className="search"
              placeholder="Search name, type, or status"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </header>

        <section className="table-section">
          <h3>Leave Requests</h3>
          <div className="table-wrapper">
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
                <th className="wrap-text">Reason</th>
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
                    <td className="wrap-text">{leave.reason}</td>
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
          </div>

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
