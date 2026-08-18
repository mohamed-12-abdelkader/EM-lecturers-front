/**
 * AuthProvider — HttpOnly Cookies + توken في الذاكرة + عزل لكل subdomain.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { AuthContext } from "../contexts/AuthContext";
import { bootstrapSession, fetchMe } from "../services/authService";
import { subscribeAuthMessages } from "../services/authChannel";
import {
  clearAuthSession,
  markSessionExpired,
  readStoredUser,
  persistStoredUser,
  AUTH_STORAGE_UPDATE_EVENT,
  hasValidAuthSession,
} from "../utils/authStorage";
import { performLogout } from "../utils/performLogout";
import { isBrowserOnline } from "../utils/network";
import { getTenantSubdomain } from "../utils/tenantHost";

function storeUser(user) {
  if (user != null && typeof user === "object") {
    persistStoredUser(user, { broadcast: false });
  }
}

function isPublicPath(pathname = "") {
  const path = String(pathname).toLowerCase();
  if (
    path === "/login" ||
    path === "/signup" ||
    path === "/teacher-login" ||
    path === "/landing" ||
    path.startsWith("/forgot") ||
    path.startsWith("/reset") ||
    path.startsWith("/welcome")
  ) {
    return true;
  }
  if (getTenantSubdomain()) {
    if (
      path === "/" ||
      path === "/teacher" ||
      path === "/courses" ||
      path.startsWith("/course/") ||
      path.startsWith("/free-lesson") ||
      path === "/search" ||
      path.startsWith("/subjects")
    ) {
      return true;
    }
  }
  return false;
}

function loginPathForUser(user) {
  return user?.role === "teacher" ? "/teacher-login" : "/login";
}

function tryRestoreFromStorage() {
  return readStoredUser();
}

export default function AuthProvider({ children }) {
  const initialStored = useMemo(() => readStoredUser(), []);
  const [status, setStatus] = useState(initialStored ? "authenticated" : "checking");
  const [user, setUser] = useState(initialStored);
  const bootstrapStartedRef = useRef(false);
  const bootstrapGenerationRef = useRef(0);

  const applyAuthenticated = useCallback((nextUser) => {
    if (nextUser) {
      storeUser(nextUser);
      setUser(nextUser);
    }
    setStatus("authenticated");
  }, []);

  const applyGuest = useCallback(() => {
    setUser(null);
    setStatus("guest");
  }, []);

  useEffect(() => {
    if (bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;

    const runBootstrap = async () => {
      const generation = ++bootstrapGenerationRef.current;
      try {
        const { user: sessionUser } = await bootstrapSession();
        if (generation !== bootstrapGenerationRef.current) return;

        if (sessionUser) {
          applyAuthenticated(sessionUser);
        } else {
          const stored = tryRestoreFromStorage();
          if (stored) {
            applyAuthenticated(stored);
          } else {
            applyGuest();
          }
        }
      } catch {
        if (generation !== bootstrapGenerationRef.current) return;
        if (!isBrowserOnline() && typeof window !== "undefined") {
          const onOnline = () => {
            window.removeEventListener("online", onOnline);
            runBootstrap();
          };
          window.addEventListener("online", onOnline);
          return;
        }
        if (hasValidAuthSession()) {
          const stored = readStoredUser();
          if (stored) {
            applyAuthenticated(stored);
            return;
          }
        }
        applyGuest();
      }
    };

    runBootstrap();
  }, [applyAuthenticated, applyGuest]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onAuthUpdate = (event) => {
      bootstrapGenerationRef.current += 1;
      const fromEvent = event?.detail?.user;
      if (fromEvent) {
        setUser(fromEvent);
        setStatus("authenticated");
        return;
      }
      const next = readStoredUser();
      if (next && hasValidAuthSession()) {
        setUser(next);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("guest");
      }
    };
    window.addEventListener(AUTH_STORAGE_UPDATE_EVENT, onAuthUpdate);
    return () => window.removeEventListener(AUTH_STORAGE_UPDATE_EVENT, onAuthUpdate);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuthMessages((msg) => {
      if (msg.type === "login") {
        bootstrapGenerationRef.current += 1;
        if (msg.user) storeUser(msg.user);
        setUser(msg.user || readStoredUser());
        setStatus("authenticated");
      } else if (msg.type === "user") {
        if (msg.user) {
          storeUser(msg.user);
          setUser(msg.user);
        }
      } else if (msg.type === "logout") {
        const redirect = loginPathForUser(readStoredUser());
        clearAuthSession();
        setUser(null);
        setStatus("guest");
        if (
          typeof window !== "undefined" &&
          !isPublicPath(window.location.pathname)
        ) {
          window.location.replace(redirect);
        }
      } else if (msg.type === "session-expired") {
        markSessionExpired({ broadcast: false });
        setUser(null);
        setStatus("guest");
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onOnline = () => {
      toast.success("تم استعادة الاتصال.", { toastId: "net-restored" });
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const logout = useCallback(async () => {
    performLogout();
  }, []);

  const isAuthLoading = status === "checking";

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await fetchMe();
      if (nextUser) {
        applyAuthenticated(nextUser);
        return nextUser;
      }
      const stored = readStoredUser();
      if (stored) {
        applyAuthenticated(stored);
        return stored;
      }
      applyGuest();
      return null;
    } catch {
      const stored = readStoredUser();
      if (stored) {
        applyAuthenticated(stored);
        return stored;
      }
      return null;
    }
  }, [applyAuthenticated, applyGuest]);

  const storedSessionUser = useMemo(() => readStoredUser(), [user, status]);

  const value = useMemo(
    () => ({
      status,
      user: user ?? storedSessionUser,
      isAuthenticated:
        status === "authenticated" || Boolean(user ?? storedSessionUser),
      isAuthLoading,
      refreshUser,
      logout,
    }),
    [status, user, storedSessionUser, isAuthLoading, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
