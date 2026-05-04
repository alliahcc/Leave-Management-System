import { useState, useEffect } from "react";
import API from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import { useAdminUser } from "../../hooks/useAdminUser";
import "../../styles/admin.css";

export default function AdminLeaveHistory() {
  const user = useAdminUser();
  const [leaves, setLeaves] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState("");
  const pageSize = 10;

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
    fetchLeaves();
  }, []);

  // 🔹 Filter leaves
  const filteredLeaves = leaves.filter((l) => {
    const fullName = `${l.employee?.name || ""} ${l.employee?.lastName || ""}`.toLowerCase();
    const q = query.toLowerCase();
    return (
      fullName.includes(q) ||
      (l.leaveType || "").toLowerCase().includes(q) ||
      (l.status || "").toLowerCase().includes(q)
    );
  });

  // 🔹 Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / pageSize));
  const paginatedLeaves = filteredLeaves.slice((page - 1) * pageSize, page * pageSize);

  // 🔹 Modal handlers
  const openModal = (leave) => {
    setSelectedLeave(leave);
    setRemarks("");
  };
  const closeModal = () => {
    setSelectedLeave(null);
    setRemarks("");
  };

  // 🔹 Backend actions
  const handleTrash = async (id) => {
    try {
      await API.patch(`/admin/leaves/${id}/trash`);
      alert(`Leave ${id} moved to trash`);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || "Error trashing leave");
    }
  };

  const handleRestore = async (id) => {
    try {
      await API.patch(`/admin/leaves/${id}/restore`);
      alert(`Leave ${id} restored`);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || "Error restoring leave");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await API.patch(`/admin/leaves/${id}/status`, { status, remarks });
      alert(`Leave ${id} updated to ${status}`);
      fetchLeaves();
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
            <h1>Leave History</h1>
            <p>Manage and track all employee leave records</p>
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
          <h3>Leave Records</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th className="wrap-text">Reason</th>
                  <th className="wrap-text">Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.length > 0 ? (
                  paginatedLeaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>{leave.employee?.employeeId}</td>
                      <td>{leave.employee?.name} {leave.employee?.lastName}</td>
                      <td>{leave.leaveType}</td>
                      <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td>{leave.duration} days</td>
                      <td><span className={`status ${leave.status}`}>{leave.status}</span></td>
                      <td className="wrap-text">{leave.reason}</td>
                      <td className="wrap-text">{leave.remarks || "—"}</td>
                      <td>
                        <button className="btn view" onClick={() => openModal(leave)}>View</button>
                        <button className="btn trash" style={{ marginLeft: 8 }} onClick={() => handleTrash(leave._id)}>Trash</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>No leave records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>


        {/* Modal */}
        {selectedLeave && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Leave Record Details</h2>
              <p><strong>Employee:</strong> {selectedLeave.employee?.name} {selectedLeave.employee?.lastName}</p>
              <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
              <p><strong>Start Date:</strong> {selectedLeave.startDate}</p>
              <p><strong>End Date:</strong> {selectedLeave.endDate}</p>
              <p><strong>Duration:</strong> {selectedLeave.duration} days</p>
              <p><strong>Status:</strong> {selectedLeave.status}</p>
              <p><strong>Reason:</strong> {selectedLeave.reason}</p>
              <p><strong>Trashed:</strong> {selectedLeave.isTrashed ? "Yes" : "No"}</p>
              <textarea
                placeholder="Add remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="btn approve" onClick={() => handleUpdateStatus(selectedLeave._id, "approved")}>Approve</button>
                <button className="btn reject" onClick={() => handleUpdateStatus(selectedLeave._id, "rejected")}>Reject</button>
                <button className="btn close" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
