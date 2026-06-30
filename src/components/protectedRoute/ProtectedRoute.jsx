import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ auth, children }) => {
  const [redirected, setRedirected] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let timer;
    // لا نوجّه إلا عندما تكون الصلاحية معروفة وغير مسموحة (false). لو لا تزال undefined = جاري التحميل
    if (auth === false && !redirected) {
      timer = setTimeout(() => {
        setRedirected(true);
      }, 100);
    }

    return () => clearTimeout(timer);
  }, [auth, redirected]);

  return redirected ? (
    <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`} replace />
  ) : children ? (
    children
  ) : (
    <Outlet />
  );
};

export default ProtectedRoute;
