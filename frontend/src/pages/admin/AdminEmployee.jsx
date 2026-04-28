import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import API from "../../api/axios";   // ✅ centralized axios instance with baseURL and token
import "../../styles/admin.css";

export default function AdminEmployee() {
  // 🔹 State
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [user, setUser] = useState(null);
  // Fetch current user profile
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
  // 🔹 Fetch employees from backend
  const fetchEmployees = async () => {
    try {
      const res = await API.get("/admin/employees");
      // Your backend returns { success, statusCode, employees }
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 🔹 Filter employees by search query
  const filteredEmployees = employees.filter((emp) => {
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
  // Add this inside AdminEmployee, above the return()
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await API.post("/admin/users", newEmployee);
      alert("Employee added successfully");
      setShowAddModal(false);
      setNewEmployee({
        name: "",
        lastName: "",
        department: "",
        position: "",
        contact: "",
        email: "",
        password: "",
        role: "employee",
        leaveBalance: 20,
      });
      fetchEmployees(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Error adding employee");
    }
  };
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    lastName: "",
    department: "",
    position: "",
    contact: "",
    email: "",
    password: "",
    role: "employee",
    leaveBalance: 20,
  });

  // 🔹 Trash handler
const handleTrash = async (id, role) => {
  try {
    if (role === "admin") {
      alert("You cannot trash an admin account.");
      return;
    }

    await API.patch(`/admin/employees/${id}/trash`);
    alert(`Employee ${id} moved to trash successfully`);
    fetchEmployees(); // refresh list
  } catch (err) {
    alert(err.response?.data?.message || "Error trashing employee");
  }
};

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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

      {/* Main */}
      <main className="main">
        <header className="header">
          <div>
            <h1>Employee Records</h1>
            <p>View and manage personal records of all employees</p>
          </div>
          <div className="header-right">
            <input
              type="text"
              placeholder="Search employees..."
              className="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="btn close" onClick={() => setQuery("")}>
                Clear
              </button>
            )}
            <button className="btn primary" style={{ marginLeft: "10px" }} onClick={() => setShowAddModal(true)}>
              + Add Employee
            </button>
          </div>
        </header>

        <section className="table-section">
          <h3>All Employees</h3>
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
                <th>Created At</th>
                <th>Updated At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id || emp._id}>
                    <td>{emp.employeeId}</td>
                    <td>{emp.name} {emp.lastName}</td>
                    <td>{emp.department}</td>
                    <td>{emp.position}</td>
                    <td>{emp.email}</td>
                    <td>{emp.contact}</td>
                    <td>{emp.role}</td>
                    <td>{emp.leaveBalance} days</td>
                    <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(emp.updatedAt).toLocaleDateString()}</td>
                    <td>{emp.isDeleted ? "Deleted" : emp.isTrashed ? "Trashed" : "Active"}</td>
                    <td>
                      <button className="btn view" onClick={() => setShowViewModal(emp)}>View Profile</button>
                      <button className="btn edit" onClick={() => setShowEditModal(emp)}>Edit</button>
                      <button className="btn trash" onClick={() => handleTrash(emp._id)}>Trash</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>No employees found</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Modals remain unchanged */}
        {/* 🔹 Add Employee Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Employee</h2>
              <form onSubmit={handleAddEmployee}>
                <input
                  placeholder="First Name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  required
                />
                <input
                  placeholder="Last Name"
                  value={newEmployee.lastName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                  required
                />
                <input
                  placeholder="Department"
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                />
                <input
                  placeholder="Position"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                />
                <input
                  placeholder="Contact"
                  value={newEmployee.contact}
                  onChange={(e) => setNewEmployee({ ...newEmployee, contact: e.target.value })}
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  required
                />
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  type="number"
                  placeholder="Leave Balance"
                  value={newEmployee.leaveBalance}
                  onChange={(e) => setNewEmployee({ ...newEmployee, leaveBalance: Number(e.target.value) })}
                />
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button type="submit" className="btn approve">Add</button>
                  <button type="button" className="btn close" onClick={() => setShowAddModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🔹 View Profile Modal */}
        {showViewModal && (
          <div className="modal-overlay" onClick={() => setShowViewModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Employee Profile</h2>
              <p><strong>Name:</strong> {showViewModal.name} {showViewModal.lastName}</p>
              <p><strong>Department:</strong> {showViewModal.department}</p>
              <p><strong>Position:</strong> {showViewModal.position}</p>
              <p><strong>Email:</strong> {showViewModal.email}</p>
              <p><strong>Contact:</strong> {showViewModal.contact}</p>
              <p><strong>Role:</strong> {showViewModal.role}</p>
              <p><strong>Leave Balance:</strong> {showViewModal.leaveBalance} days</p>
              <p><strong>Created At:</strong> {new Date(showViewModal.createdAt).toLocaleDateString()}</p>
              <p><strong>Updated At:</strong> {new Date(showViewModal.updatedAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> 
                {showViewModal.isDeleted ? "Deleted" : showViewModal.isTrashed ? "Trashed" : "Active"}
              </p>
              <div style={{ marginTop: 12 }}>
                <button className="btn close" onClick={() => setShowViewModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* 🔹 Edit Employee Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Employee</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await API.patch(`/admin/employees/${showEditModal._id}`, {
                      name: showEditModal.name,
                      lastName: showEditModal.lastName,
                      department: showEditModal.department,
                      position: showEditModal.position,
                      contact: showEditModal.contact,
                      email: showEditModal.email,
                      password: showEditModal.password, // optional: only send if changed 
                      role: showEditModal.role,
                      leaveBalance: showEditModal.leaveBalance,
                    });
                    alert("Employee updated successfully");
                    setShowEditModal(null);
                    fetchEmployees(); // refresh list
                  } catch (err) {
                    alert(err.response?.data?.message || "Error updating employee");
                  }
                }}
              >

                <input
                  placeholder="First Name"
                  value={showEditModal.name}
                  onChange={(e) => setShowEditModal({ ...showEditModal, name: e.target.value })}
                />
                <input
                  placeholder="Last Name"
                  value={showEditModal.lastName}
                  onChange={(e) => setShowEditModal({ ...showEditModal, lastName: e.target.value })}
                />
                <input
                  placeholder="Department"
                  value={showEditModal.department}
                  onChange={(e) => setShowEditModal({ ...showEditModal, department: e.target.value })}
                />
                <input
                  placeholder="Position"
                  value={showEditModal.position}
                  onChange={(e) => setShowEditModal({ ...showEditModal, position: e.target.value })}
                />
                <input
                  placeholder="Contact"
                  value={showEditModal.contact}
                  onChange={(e) => setShowEditModal({ ...showEditModal, contact: e.target.value })}
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={showEditModal.email}
                  onChange={(e) => setShowEditModal({ ...showEditModal, email: e.target.value })}
                />
                <select
                  value={showEditModal.role}
                  onChange={(e) => setShowEditModal({ ...showEditModal, role: e.target.value })}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  type="password"
                  placeholder="Password (leave blank to keep unchanged)"
                  value={showEditModal.password || ""}
                  onChange={(e) => setShowEditModal({ ...showEditModal, password: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Leave Balance"
                  value={showEditModal.leaveBalance}
                  onChange={(e) => setShowEditModal({ ...showEditModal, leaveBalance: Number(e.target.value) })}
                />
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button type="submit" className="btn approve">Save</button>
                  <button type="button" className="btn close" onClick={() => setShowEditModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
