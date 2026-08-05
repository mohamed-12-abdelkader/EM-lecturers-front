import { useRef } from "react";
import { Navigate } from "react-router-dom";

/**
 * يمنع عرض صفحات الدخول/التسجيل لمن لديه جلسة مسبقاً.
 * مهم: لا يعيد التوجيه إذا أصبح المستخدم مسجّلاً أثناء وجوده على الصفحة
 * (بعد login/signup) — الصفحة نفسها تتكفل بتنقّل واحد بدون reload متكرر.
 */
const ProtectedLogin = ({ auth, children }) => {
  const wasAuthOnMount = useRef(Boolean(auth));

  if (wasAuthOnMount.current) {
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const redirect = params?.get("redirect");
    const to =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/home";
    return <Navigate to={to} replace />;
  }

  return children;
};

export default ProtectedLogin;
