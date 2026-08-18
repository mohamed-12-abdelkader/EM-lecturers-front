/**
 * AuthProvider — يقرأ user/token من localStorage للـ origin الحالي فقط.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import {
  AUTH_STORAGE_UPDATE_EVENT,
  hasValidAuthSession,
  readStoredUser,
  USER_KEY,
  TOKEN_KEY,
} from "../utils/authStorage";
import { performLogout } from "../utils/performLogout";
import { fetchMe } from "../services/authService";

export default function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);

  const syncFromStorage = useCallback(() => {
    const next = readStoredUser();
    if (next && hasValidAuthSession()) {
      setUser(next);
      setStatus("authenticated");
      return next;
    }
    setUser(null);
    setStatus("guest");
    return null;
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onAuthUpdate = () => syncFromStorage();
    const onStorage = (event) => {
      if (event.key === USER_KEY || event.key === TOKEN_KEY || event.key === null) {
        syncFromStorage();
      }
    };

    window.addEventListener(AUTH_STORAGE_UPDATE_EVENT, onAuthUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(AUTH_STORAGE_UPDATE_EVENT, onAuthUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncFromStorage]);

  const logout = useCallback(async () => {
    await performLogout();
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = readStoredUser();
    if (!stored) {
      syncFromStorage();
      return null;
    }
    try {
      const fresh = await fetchMe();
      if (fresh) {
        setUser(fresh);
        setStatus("authenticated");
        return fresh;
      }
    } catch {
      // offline
    }
    setUser(stored);
    setStatus("authenticated");
    return stored;
  }, [syncFromStorage]);

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === "authenticated" && Boolean(user),
      isAuthLoading: status === "checking",
      refreshUser,
      logout,
    }),
    [status, user, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
