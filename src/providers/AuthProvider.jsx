/**
 * AuthProvider — localStorage (user + token) للـ origin الحالي فقط.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../contexts/AuthContext";
import { fetchMe } from "../services/authService";
import {
  AUTH_STORAGE_UPDATE_EVENT,
  hasValidAuthSession,
  readStoredUser,
  persistStoredUser,
  USER_KEY,
  TOKEN_KEY,
} from "../utils/authStorage";
import { performLogout } from "../utils/performLogout";
import { bootstrapSession } from "../services/authService";

function readSessionFromStorage() {
  const { user } = bootstrapSession();
  return user;
}

export default function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);

  const applyAuthenticated = useCallback((nextUser) => {
    if (nextUser) persistStoredUser(nextUser);
    setUser(nextUser ?? readStoredUser());
    setStatus(nextUser || readStoredUser() ? "authenticated" : "guest");
  }, []);

  const applyGuest = useCallback(() => {
    setUser(null);
    setStatus("guest");
  }, []);

  useEffect(() => {
    const stored = readSessionFromStorage();
    if (stored) {
      setUser(stored);
      setStatus("authenticated");
      fetchMe().then((fresh) => {
        if (fresh) {
          setUser(fresh);
        }
      }).catch(() => {
        // offline أو API غير متاح — نبقى على localStorage
      });
    } else {
      applyGuest();
    }
  }, [applyGuest]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncFromStorage = () => {
      const next = readStoredUser();
      if (next && hasValidAuthSession()) {
        setUser(next);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("guest");
      }
    };

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
    await performLogout();
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = readStoredUser();
    if (!stored) {
      applyGuest();
      return null;
    }
    try {
      const fresh = await fetchMe();
      if (fresh) {
        applyAuthenticated(fresh);
        return fresh;
      }
      applyAuthenticated(stored);
      return stored;
    } catch {
      applyAuthenticated(stored);
      return stored;
    }
  }, [applyAuthenticated, applyGuest]);

  const isAuthLoading = status === "checking";

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === "authenticated" && Boolean(user),
      isAuthLoading,
      refreshUser,
      logout,
    }),
    [status, user, isAuthLoading, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
