import { Outlet } from "react-router-dom";
import HomeLogin from "../homeLogin/HomeLogin";
import TeacherDashboardHome from "../home/TeacherDashboardHome";
import HomePage from "../homePage/HomePage";
import TenantPublicLanding from "./TenantPublicLanding";
import ProtectedRoute from "../../components/protectedRoute/ProtectedRoute";
import UserType from "../../Hooks/auth/userType";
import { getTenantSubdomain } from "../../utils/tenantHost";
import {
  clearExpiredAuthQuietly,
  hasValidAuthSession,
} from "../../utils/authStorage";

/**
 * على نطاق المستأجر: غلاف `/` — للمدرّس/الطالب بجلسة صالحة فقط؛
 * وإلا اللاندنج العام (مهم: التوكن المنتهي ما يفتحش لوحة بيضا/معلّقة).
 */
export function TenantRootLayout() {
  // امسح الجلسات المنتهية فورًا قبل قرار العرض
  clearExpiredAuthQuietly();

  const [, , isTeacher, student] = UserType();
  const loggedIn = hasValidAuthSession() && (isTeacher || student);

  if (loggedIn) {
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
  clearExpiredAuthQuietly();

  const [, , isTeacher, student] = UserType();
  const subdomain = getTenantSubdomain();
  const loggedIn = hasValidAuthSession();

  if (loggedIn && isTeacher) {
    return <TeacherDashboardHome />;
  }
  if (loggedIn && student) {
    return <HomePage />;
  }
  return <TenantPublicLanding subdomain={subdomain} />;
}
