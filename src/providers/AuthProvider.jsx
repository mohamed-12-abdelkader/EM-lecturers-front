/**
 * AuthProvider — قلب نظام المصادقة الجديد (HttpOnly Cookies + توكن في الذاكرة).
 *
 * عند الإقلاع:
 *   GET /auth/me → (401 → POST /auth/refresh → GET /auth/me) → دخول أو ضيف.
 * فشل الـ refresh لا يُظهر أي خطأ — المستخدم يُعامل كضيف وتتكفل الحراسات بالتحويل.
 *
 * متعدد التبويبات: مزامنة (login / logout / token / user) عبر BroadcastChannel.
 * أوفلاين عند الإقلاع: يُعاد الفحص تلقائياً فور عودة الاتصال.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { AuthContext } from "../contexts/AuthContext";
import { bootstrapSession, fetchMe } from "../services/authService";
import { subscribeAuthMessages } from "../services/authChannel";
import { clearAuthSession, markSessionExpired, readStoredUser, persistStoredUser, AUTH_STORAGE_UPDATE_EVENT } from "../utils/authStorage";
import { performLogout } from "../utils/performLogout";
import { isBrowserOnline } from "../utils/network";
import { getTenantSubdomain } from "../utils/tenantHost";

function storeUser(user) {
  if (user != null && typeof user === "object") {
    persistStoredUser(user, { broadcast: false });
  }
}

/** صفحات لا يُعاد توجيه الضيف منها عند خروجه من تبويب آخر */
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

export default function AuthProvider({ children }) {
  const initialUser = useMemo(() => readStoredUser(), []);

  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(initialUser);
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

  /* ----------------------------- الإقلاع ----------------------------- */
  // ملاحظة: بدون علم إلغاء في الـ cleanup — StrictMode يعيد تشغيل الـ effect
  // والحارس bootstrapStartedRef يمنع فحصاً ثانياً، والمزوّد لا يُفكّ أبداً من الجذر.
  useEffect(() => {
    if (bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;

    const runBootstrap = async () => {
      const generation = ++bootstrapGenerationRef.current;
      try {
        const { user: sessionUser } = await bootstrapSession();
        if (generation !== bootstrapGenerationRef.current) return;

        const stored = readStoredUser();
        if (sessionUser) {
          applyAuthenticated(sessionUser);
        } else if (stored) {
          applyAuthenticated(stored);
        } else {
          applyGuest();
        }
      } catch {
        if (generation !== bootstrapGenerationRef.current) return;
        // خطأ شبكة: أعد المحاولة تلقائياً فور عودة الاتصال
        if (!isBrowserOnline() && typeof window !== "undefined") {
          const onOnline = () => {
            window.removeEventListener("online", onOnline);
            runBootstrap();
          };
          window.addEventListener("online", onOnline);
          return;
        }
        const stored = readStoredUser();
        if (stored) {
          applyAuthenticated(stored);
        } else {
          applyGuest();
        }
      }
    };

    runBootstrap();
  }, [applyAuthenticated, applyGuest]);

  /* -------------- مزامنة نفس التبويب (بعد login/signup) -------------- */
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onAuthUpdate = (event) => {
      bootstrapGenerationRef.current += 1;
      const next =
        event?.detail?.user ??
        readStoredUser();
      if (next) {
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

  /* ----------------------- مزامنة بقية التبويبات ---------------------- */
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
        // التبويب الآخر فشل refresh عنده — أظهر نفس المعالجة هنا
        markSessionExpired({ broadcast: false });
        setUser(null);
        setStatus("guest");
      }
    });
    return unsubscribe;
  }, []);

  /* --------------------- إشعار عودة/انقطاع الاتصال -------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onOnline = () => {
      toast.success("تم استعادة الاتصال.", { toastId: "net-restored" });
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  /* ------------------------------ أفعال ------------------------------ */
  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await fetchMe();
      if (nextUser) {
        applyAuthenticated(nextUser);
        return nextUser;
      }
      return null;
    } catch {
      return null;
    }
  }, [applyAuthenticated]);

  const logout = useCallback(async () => {
    performLogout();
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === "authenticated",
      refreshUser,
      logout,
    }),
    [status, user, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
