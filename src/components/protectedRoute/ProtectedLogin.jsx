import { Navigate, Outlet } from "react-router-dom";

const ProtectedLogin = ({ auth, children }) => {
  if (auth) {
    // يؤخر التوجيه إلى الرئيسية لمدة 2 ثانية

    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedLogin;
