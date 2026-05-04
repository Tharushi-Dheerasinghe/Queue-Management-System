import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccessRoute, getDefaultDashboardPath } from "../utils/permissions";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles specified, check if user has one of the allowed roles
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some((allowedRole) => hasRole(allowedRole));
    if (!hasAllowedRole) {
      return <Navigate to={getDefaultDashboardPath(role)} replace />;
    }
  }

  if (allowedRoles.length === 0 && !canAccessRoute(role, location.pathname)) {
    return <Navigate to={getDefaultDashboardPath(role)} replace />;
  }

  return children;
}
