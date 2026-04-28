import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import API from "../../api/axios";   // ✅ centralized axios instance
import "../../styles/admin.css";

export default function AdminTrashEmployee() {
  const [trashEmployees, setTrashEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [user, setUser] = useState(null);

  // Fetch current user profile to display in sidebar
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

  // 🔹 Fetch trashed employees from backend
const fetchTrashEmployees = async () => {
  try {
    const res = await API.get("/admin/employees/trashed"); 
    // backend returns { success, statusCode, employees }
    setTrashEmployees(res.data.employees || []);
  } catch (err) {
    console.error("Error fetching trash employees:", err);
    setTrashEmployees([]);
  }
};

  useEffect(() => {
    fetchTrashEmployees();
  }, []);

  // 🔹 Filter employees by search query
  const filteredEmployees = trashEmployees.filter((emp) => {
    const q = query.toLowerCase();
    return (
      `${emp.name} ${emp.lastName}`.toLowerCase().includes(q) ||
      (emp.position || "").toLowerCase().includes(q) ||
      (emp.department || "").toLowerCase().includes(q) ||
      (emp.email || "").toLowerCase().includes(q) ||
      (emp.contact || "").toLowerCase().includes(q) ||
      (emp.role || "").toLowerCase().includes(q)
    );
  });

  // 🔹 Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);

  // 🔹 Restore/Delete handlers connected to backend
  const handleRestore = async (id) => {
    try {
      await API.patch(`/admin/employees/${id}/restore`);
      alert(`Employee ${id} restored successfully`);
      fetchTrashEmployees(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Error restoring employee");
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/admin/employees/${id}/permanent`);
      alert(`Employee ${id} permanently deleted`);
      fetchTrashEmployees(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting employee");
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
            <h1>Trash – Employee Records</h1>
            <p>Manage deleted employee records. You can restore or permanently delete them.</p>
          </div>
          <input
            className="search"
            placeholder="Search employees..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </header>

        <section className="table-section">
          <h3>Employee Records in Trash</h3>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Leave Balance</th>
                <th>Trashed At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => (
                  <tr key={emp._id}>
                    <td>{emp.employeeId}</td>
                    <td>{emp.name} {emp.lastName}</td>
                    <td>{emp.department}</td>
                    <td>{emp.position}</td>
                    <td>{emp.email}</td>
                    <td>{emp.contact}</td>
                    <td>{emp.role}</td>
                    <td>{emp.leaveBalance} days</td>
                    <td>{emp.trashedAt || "—"}</td>
                    <td>{emp.isDeleted ? "Deleted" : emp.isTrashed ? "Trashed" : "Active"}</td>
                    <td>
                      <button className="btn view" onClick={() => setSelectedEmployee(emp)}>
                        View
                      </button>
                      <button className="btn approve" onClick={() => handleRestore(emp._id)}>
                        Restore
                      </button>
                      <button className="btn reject" onClick={() => handleDelete(emp._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center" }}>
                    No employee records in trash
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Modal unchanged */}
        {selectedEmployee && (
          <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Employee Details</h2>
              <p><strong>Name:</strong> {selectedEmployee.name} {selectedEmployee.lastName}</p>
              <p><strong>Department:</strong> {selectedEmployee.department}</p>
              <p><strong>Position:</strong> {selectedEmployee.position}</p>
              <p><strong>Email:</strong> {selectedEmployee.email}</p>
              <p><strong>Contact:</strong> {selectedEmployee.contact}</p>
              <p><strong>Role:</strong> {selectedEmployee.role}</p>
              <p><strong>Leave Balance:</strong> {selectedEmployee.leaveBalance} days</p>
              <p><strong>Created At:</strong> {selectedEmployee.createdAt}</p>
              <p><strong>Updated At:</strong> {selectedEmployee.updatedAt}</p>
              <p><strong>Trashed At:</strong> {selectedEmployee.trashedAt || "—"}</p>
              <p><strong>Deleted At:</strong> {selectedEmployee.deletedAt || "—"}</p>
              <p><strong>Status:</strong> {selectedEmployee.isDeleted ? "Deleted" : selectedEmployee.isTrashed ? "Trashed" : "Active"}</p>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="btn approve" onClick={() => handleRestore(selectedEmployee._id)}>
                  Restore
                </button>
                <button className="btn reject" onClick={() => handleDelete(selectedEmployee._id)}>
                  Delete
                </button>
                <button className="btn close" onClick={() => setSelectedEmployee(null)}>
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
