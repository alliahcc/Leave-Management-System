import { useState, useEffect } from "react";
import API from "../../api/axios";
import AdminSidebar from "../../components/AdminSidebar";
import { useAdminUser } from "../../hooks/useAdminUser";
import "../../styles/admin.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminAuditLogs() {
  const user = useAdminUser();
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 🔹 Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const res = await API.get("/admin/audit-logs"); 
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // 🔹 Filter logs
  const filteredLogs = logs.filter((log) => {
    const q = query.toLowerCase();
    return (
      (log.action || "").toLowerCase().includes(q) ||
      (log.targetType || "").toLowerCase().includes(q) ||
      (log.performedByName || "").toLowerCase().includes(q) ||
      (log.details || "").toLowerCase().includes(q)
    );
  });

  // 🔹 Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  // ✅ Export PDF handler
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("System Audit Logs", 14, 15);

      const tableColumn = [
        "Timestamp",
        "Action",
        "Target ID",
        "Performed By",
        "Role",
        "Method",
        "URL",
        "Status",
        "Details",
      ];

      const tableRows = filteredLogs.map((log) => [
        new Date(log.createdAt).toLocaleString(),
        log.action || "—",
        log.targetId || "—",
        log.performedByName || log.performedBy || "—",
        log.performedByRole || "—",
        log.requestMethod || "—",
        log.requestUrl || "—",
        log.status || "—",
        log.details || "—",
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8 },
      });

      doc.save("audit_logs.pdf");
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Failed to export PDF. Check console for details.");
    }
  };

  return (
    <div className="dashboard-container">
      <AdminSidebar user={user} />

      <main className="main">
        <header className="header">
          <div>
            <h1>Audit Logs</h1>
            <p>Track all admin actions for accountability and compliance.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              className="search"
              placeholder="Search logs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn" onClick={handleExportPDF}>
              Export PDF
            </button>
          </div>
        </header>

        <section className="table-section">
          <h3>System Audit Logs</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Target ID</th>
                  <th>Performed By</th>
                  <th>Role</th>
                  <th>Method</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log._id}>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.action}</td>
                      <td>{log.targetId}</td>
                      <td>{log.performedByName || log.performedBy}</td>
                      <td>{log.performedByRole}</td>
                      <td>{log.requestMethod}</td>
                      <td>{log.requestUrl}</td>
                      <td>{log.status}</td>
                      <td>{log.details || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center" }}>
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
              Next
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
