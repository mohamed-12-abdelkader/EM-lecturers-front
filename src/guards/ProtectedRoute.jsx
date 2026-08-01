/**
 * حارس المسارات المحمية — يعتمد على AuthProvider (كوكي HttpOnly + توكن بالذاكرة).
 * أثناء فحص الجلسة لا يُظهر شيئاً مزعجاً (الـ Splash يتكفل بالإقلاع).
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppSplashScreen from "../components/auth/AppSplashScreen";

export default function ProtectedRoute({ children, roles }) {
  const { status, user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return <AppSplashScreen />;
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
