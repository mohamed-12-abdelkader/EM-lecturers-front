/**
 * حارس المسارات المحمية — يعتمد على AuthProvider + التخزين المعزول لكل منصة.
 */
import { Center, Spinner } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getTenantSubdomain } from "../../utils/tenantHost";

function AuthCheckingFallback() {
  return (
    <Center minH="50vh">
      <Spinner size="lg" color="blue.500" thickness="3px" />
    </Center>
  );
}

export default function ProtectedRoute({ auth, children }) {
  const { status, isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();
  const tenant = getTenantSubdomain();
  const redirectPath = tenant ? "/welcome" : "/login";
  const hasSession = isAuthenticated;

  const loginRedirect = (
    <Navigate
      to={`${redirectPath}?redirect=${encodeURIComponent(
        location.pathname + location.search + location.hash,
      )}`}
      replace
    />
  );

  if (isAuthLoading || status === "checking") {
    return <AuthCheckingFallback />;
  }

  if (!hasSession) {
    return loginRedirect;
  }

  if (auth === false) {
    if (hasSession) {
      return <Navigate to="/home" replace />;
    }
    return loginRedirect;
  }

  return children ?? <Outlet />;
}
