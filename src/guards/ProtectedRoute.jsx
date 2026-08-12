/**
 * حارس المسارات المحمية — يعتمد على AuthProvider (كوكي HttpOnly + توكن بالذاكرة).
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { status, user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return children ?? <Outlet />;
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(
      location.pathname + location.search + location.hash,
    );
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (Array.isArray(roles) && roles.length > 0) {
    const role = user?.role || "student";
    if (!roles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children ?? <Outlet />;
}
