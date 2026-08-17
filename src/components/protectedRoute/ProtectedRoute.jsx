/**
 * حارس المسارات المحمية — يعتمد على AuthProvider + التخزين المعزول لكل منصة.
 *
 * - auth (legacy): boolean من UserType — false = دور غير مسموح أو لم يُحمَّل بعد
 * - بدون auth: يكفي وجود جلسة صالحة
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { readStoredUser } from "../../utils/authStorage";

export default function ProtectedRoute({ auth, children }) {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();
  const storedUser = readStoredUser();
  const hasSession = isAuthenticated || Boolean(storedUser);

  const loginRedirect = (
    <Navigate
      to={`/login?redirect=${encodeURIComponent(
        location.pathname + location.search + location.hash,
      )}`}
      replace
    />
  );

  // انتظر فحص الجلسة عند الإقلاع — بدون توجيه سريع
  if (status === "checking" && !hasSession) {
    return children ?? <Outlet />;
  }

  if (!hasSession) {
    return loginRedirect;
  }

  // UserType يقول «لا دور» — لكن الجلسة موجودة (تأخر sync أو مسار فرعي بدور محدد)
  if (auth === false) {
    if (status === "checking") {
      return children ?? <Outlet />;
    }
    // جلسة صالحة لكن الدور لا يطابق (مثلاً طالب على مسار admin) → الرئيسية
    if (hasSession) {
      return <Navigate to="/home" replace />;
    }
    return loginRedirect;
  }

  return children ?? <Outlet />;
}
