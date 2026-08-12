import { useRef } from "react";
import { Navigate } from "react-router-dom";
import { safeLocalGet } from "../../utils/safeStorage";
import { getPostLoginPath } from "../../utils/authRoles";

function readStoredUser() {
  try {
    const raw = safeLocalGet("user");
    if (raw == null || raw === "") return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * يمنع عرض صفحات الدخول/التسجيل لمن لديه جلسة مسبقاً.
 */
const ProtectedLogin = ({ auth, children }) => {
  const wasAuthOnMount = useRef(Boolean(auth));

  if (wasAuthOnMount.current) {
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const redirect = params?.get("redirect");
    const to = getPostLoginPath(readStoredUser(), redirect);
    return <Navigate to={to} replace />;
  }

  return children;
};

export default ProtectedLogin;
