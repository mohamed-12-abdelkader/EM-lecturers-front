import { Outlet } from "react-router-dom";
import HomeLogin from "../homeLogin/HomeLogin";
import TeacherDashboardHome from "../home/TeacherDashboardHome";
import HomePage from "../homePage/HomePage";
import TenantPublicLanding from "./TenantPublicLanding";
import ProtectedRoute from "../../components/protectedRoute/ProtectedRoute";
import UserType from "../../Hooks/auth/userType";
import { getTenantSubdomain } from "../../utils/tenantHost";
import { useAuth } from "../../contexts/AuthContext";
import { hasValidAuthSession, readStoredUser } from "../../utils/authStorage";
import { normalizeAuthUser, resolveAuthRoles } from "../../utils/authRoles";
import { Center, Spinner } from "@chakra-ui/react";

function useEffectiveSessionUser() {
  const { user: authUser, isAuthenticated } = useAuth();
  const storedUser = readStoredUser();
  const user = normalizeAuthUser(authUser ?? storedUser, {
    fallbackUser: storedUser ?? authUser,
  });
  const hasSession = isAuthenticated || hasValidAuthSession();
  const roles = resolveAuthRoles(user);
  return { user, hasSession, roles };
}

/**
 * على نطاق المستأجر: غلاف `/` — للمدرّس/الطالب بجلسة صالحة فقط.
 */
export function TenantRootLayout() {
  const { isAuthLoading } = useAuth();
  const { hasSession, roles } = useEffectiveSessionUser();
  const [, , isTeacher, student] = UserType();
  const loggedIn =
    hasSession &&
    !roles.isAdmin &&
    (isTeacher || student || roles.isTeacher || roles.student);

  if (isAuthLoading) {
    return (
      <Center minH="50vh">
        <Spinner size="lg" color="blue.500" thickness="3px" />
      </Center>
    );
  }

  if (loggedIn) {
    return (
      <ProtectedRoute auth={isTeacher || student || roles.isTeacher || roles.student}>
        <HomeLogin />
      </ProtectedRoute>
    );
  }
  return <Outlet />;
}

/** محتوى الفهرس لمسار `/` على نطاق المستأجر */
export function TenantRootIndex() {
  const { isAuthLoading } = useAuth();
  const { user, hasSession, roles } = useEffectiveSessionUser();
  const subdomain = getTenantSubdomain();

  if (isAuthLoading) {
    return (
      <Center minH="50vh">
        <Spinner size="lg" color="blue.500" thickness="3px" />
      </Center>
    );
  }

  if (hasSession && user && !roles.isAdmin) {
    if (roles.isTeacher && !roles.isAcademyTeacher) {
      return <TeacherDashboardHome />;
    }
    if (roles.isAcademy) {
      return <HomePage />;
    }
    if (roles.isAcademyTeacher) {
      return <TeacherDashboardHome />;
    }
    return <HomePage />;
  }

  return <TenantPublicLanding subdomain={subdomain} />;
}
