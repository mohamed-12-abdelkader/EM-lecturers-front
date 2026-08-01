/**
 * حارس صفحات الضيوف (تسجيل الدخول / إنشاء الحساب):
 * المستخدم المسجّل لا يرى صفحة الدخول — يُحوَّل مباشرة للمنصة.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function GuestRoute({ children, redirectTo = "/" }) {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  // أثناء الفحص اعرض الصفحة عادي — الـ Splash عند الإقلاع يمنع الوميض أصلاً
  if (status !== "checking" && isAuthenticated) {
    const params = new URLSearchParams(location.search);
    const redirectParam = params.get("redirect");
    const destination =
      redirectParam && redirectParam.startsWith("/") ? redirectParam : redirectTo;
    return <Navigate to={destination} replace />;
  }

  return children ?? <Outlet />;
}
