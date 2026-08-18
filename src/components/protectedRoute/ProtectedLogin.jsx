import { Center, Spinner } from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { readStoredUser } from "../../utils/authStorage";
import { getPostLoginPath } from "../../utils/authRoles";

const ProtectedLogin = ({ children }) => {
  const { status, isAuthenticated, isAuthLoading } = useAuth();
  const hasSession = isAuthenticated;

  if (isAuthLoading || status === "checking") {
    return (
      <Center minH="40vh">
        <Spinner size="lg" color="blue.500" thickness="3px" />
      </Center>
    );
  }

  if (hasSession) {
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const redirect = params?.get("redirect");
    const storedUser = readStoredUser();
    const to = getPostLoginPath(storedUser, redirect);
    return <Navigate to={to} replace />;
  }

  return children;
};

export default ProtectedLogin;
