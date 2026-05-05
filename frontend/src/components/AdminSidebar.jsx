import { NavLink } from "react-router-dom";
import API from "../api/axios";

export default function AdminSidebar({ user }) {
  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Error logging out:", err);
    } finally {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  return (
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
        <div className="profile-pic">
          {user?.name?.[0] || "A"}{user?.lastName?.[0] || ""}
        </div>
        <div>
          <p className="profile-name">{user?.name} {user?.lastName}</p>
          <p className="profile-role">{user?.role}</p>
        </div>
        <button className="btn close" style={{ marginTop: "10px" }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
