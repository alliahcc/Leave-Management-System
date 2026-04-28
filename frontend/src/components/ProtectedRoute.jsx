// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let parsedUser = null;
  if (userString) {
    try {
      parsedUser = JSON.parse(userString);
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
    }
  }

  // If allowedRoles is provided, check role
  if (allowedRoles?.length && (!parsedUser || !allowedRoles.includes(parsedUser.role))) {
    // If role is missing, send back to login
    return <Navigate to="/login" replace />;
  }

  return children;
}
