/**
 * SessionProvider — جلسات الأجهزة النشطة (GET /auth/sessions).
 * يُحمَّل كسولاً: القائمة تُجلب فقط عند أول استدعاء لـ loadSessions.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { fetchDeviceSessions } from "../services/sessionService";
import { logoutAllRequest } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

const SessionContext = createContext({
  sessions: [],
  isLoading: false,
  loadSessions: async () => [],
  logoutAllDevices: async () => null,
});

export function useDeviceSessions() {
  return useContext(SessionContext);
}

export default function SessionProvider({ children }) {
  const { isAuthenticated, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!isAuthenticated) return [];
    setIsLoading(true);
    try {
      const list = await fetchDeviceSessions();
      setSessions(list);
      return list;
    } catch {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const logoutAllDevices = useCallback(async () => {
    const result = await logoutAllRequest();
    await logout();
    return result;
  }, [logout]);

  const value = useMemo(
    () => ({ sessions, isLoading, loadSessions, logoutAllDevices }),
    [sessions, isLoading, loadSessions, logoutAllDevices],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
