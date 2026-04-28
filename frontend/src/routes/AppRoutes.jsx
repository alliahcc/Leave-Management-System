// src/routes/AppRoutes.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import ChangePasswordPage from "../pages/ChangePassword";
import ProtectedRoute from "../components/ProtectedRoute";

// Employee pages
import DashboardPage from "../pages/employee/EmployeeDashboard";
import ApplyLeavePage from "../pages/employee/EmployeeApplyLeave";
import LeaveHistoryPage from "../pages/employee/EmployeeLeaveHistory";
import ProfilePage from "../pages/employee/EmployeeProfile";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminLeaveRequest from "../pages/admin/AdminLeaveRequest";
import AdminEmployee from "../pages/admin/AdminEmployee";
import AdminLeaveHistory from "../pages/admin/AdminLeaveHistory";
import AdminTrashEmployee from "../pages/admin/AdminTrashEmployee";
import AdminTrashLeaveRecord from "../pages/admin/AdminTrashLeaveRecord";
import AdminAuditLogs from "../pages/admin/AdminAuditLogs";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leave-request"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLeaveRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employee"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminEmployee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leave-history"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLeaveHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/trash/employee"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminTrashEmployee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/trash/leave-record"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminTrashLeaveRecord />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAuditLogs />
            </ProtectedRoute>
          }
        />


        {/* Employee routes */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/apply-leave"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <ApplyLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave-history"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <LeaveHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
