import { Outlet } from "react-router-dom";
import HomeLogin from "../homeLogin/HomeLogin";
import TeacherDashboardHome from "../home/TeacherDashboardHome";
import HomePage from "../homePage/HomePage";
import TenantPublicLanding from "./TenantPublicLanding";
import ProtectedRoute from "../../components/protectedRoute/ProtectedRoute";
import UserType from "../../Hooks/auth/userType";
import { getTenantSubdomain } from "../../utils/tenantHost";

/**
 * على نطاق المستأجر: غلاف `/` — للمدرّس المسجّل يعرض HomeLogin ويمرّر المحتوى للـ Outlet؛ وإلا يمرّر الفهرس للّاندنج.
 */
export function TenantRootLayout() {
  const [, , isTeacher, student] = UserType();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if ((isTeacher || student) && token) {
    return (
      <ProtectedRoute auth={isTeacher || student}>
        <HomeLogin />
      </ProtectedRoute>
    );
  }
  return <Outlet />;
}

/** محتوى الفهرس لمسار `/` على نطاق المستأجر */
export function TenantRootIndex() {
  const [, , isTeacher, student] = UserType();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const subdomain = getTenantSubdomain();

  if (isTeacher && token) {
    return <TeacherDashboardHome />;
  }
  if (student && token) {
    return <HomePage />;
  }
  return <TenantPublicLanding subdomain={subdomain} />;
}
