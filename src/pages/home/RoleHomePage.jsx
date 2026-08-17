import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { readStoredUser } from "../../utils/authStorage";
import { normalizeAuthUser, resolveAuthRoles } from "../../utils/authRoles";

/**
 * الصفحة الرئيسية حسب دور المستخدم — AuthProvider + التخزين (ليس UserType فقط).
 */
export default function RoleHomePage({
  AdminDashboardHome,
  TeacherDashboardHome,
  HomePage,
}) {
  const { user: authUser } = useAuth();
  const storedUser = readStoredUser();
  const user = normalizeAuthUser(authUser ?? storedUser, {
    fallbackUser: storedUser ?? authUser,
  });
  const roles = resolveAuthRoles(user);

  if (roles.isAdmin) {
    return <AdminDashboardHome />;
  }
  if (roles.isAcademy) {
    return <Navigate to="/academy" replace />;
  }
  if (roles.isAcademyTeacher) {
    return <Navigate to="/academy/me" replace />;
  }
  if (roles.isTeacher) {
    return <TeacherDashboardHome />;
  }
  return <HomePage />;
}
