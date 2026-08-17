import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { readStoredUser } from "../../utils/authStorage";
import { getPostLoginPath } from "../../utils/authRoles";

/**
 * يمنع عرض صفحات الدخول/التسجيل لمن لديه جلسة مسبقاً.
 */
const ProtectedLogin = ({ children }) => {
  const { status, isAuthenticated } = useAuth();
  const storedUser = readStoredUser();
  const hasSession = isAuthenticated || Boolean(storedUser);

  if (status === "checking" && !hasSession) {
    return children;
  }

  if (hasSession) {
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const redirect = params?.get("redirect");
    const to = getPostLoginPath(storedUser, redirect);
    return <Navigate to={to} replace />;
  }

  return children;
};

export default ProtectedLogin;
