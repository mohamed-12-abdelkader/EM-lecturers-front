/**
 * AuthProvider — قلب نظام المصادقة الجديد (HttpOnly Cookies + توكن في الذاكرة).
 *
 * عند الإقلاع:
 *   Splash → GET /auth/me → (401 → POST /auth/refresh → GET /auth/me) → دخول أو ضيف.
 * فشل الـ refresh لا يُظهر أي خطأ — المستخدم يُعامل كضيف وتتكفل الحراسات بالتحويل.
 *
 * متعدد التبويبات: مزامنة (login / logout / token / user) عبر BroadcastChannel.
 * أوفلاين عند الإقلاع: يُعاد الفحص تلقائياً فور عودة الاتصال.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { AuthContext } from "../contexts/AuthContext";
import AppSplashScreen from "../components/auth/AppSplashScreen";
import { bootstrapSession, fetchMe, logoutRequest } from "../services/authService";
import { subscribeAuthMessages } from "../services/authChannel";
import { clearAuthSession, markSessionExpired } from "../utils/authStorage";
import { safeLocalGet, safeLocalSet } from "../utils/safeStorage";
import { isBrowserOnline } from "../utils/network";
import { getTenantSubdomain } from "../utils/tenantHost";

function readStoredUser() {
  try {
    const raw = safeLocalGet("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  if (user != null && typeof user === "object") {
    safeLocalSet("user", JSON.stringify(user));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-storage-update"));
    }
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
  // وجود مستخدم محفوظ = غالباً جلسة سارية → نعرض Splash بدل وميض صفحات الضيف
  const blockUiWhileChecking = Boolean(initialUser);

  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(initialUser);
  const bootstrapStartedRef = useRef(false);

  const applyAuthenticated = useCallback((nextUser) => {
    if (nextUser) {
      storeUser(nextUser);
      setUser(nextUser);
    }
    setStatus("authenticated");
  }, []);

  const applyGuest = useCallback(({ hadSession = false } = {}) => {
    if (hadSession) {
      clearAuthSession();
    }
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
      try {
        const { user: sessionUser } = await bootstrapSession();
        if (sessionUser) {
          applyAuthenticated(sessionUser);
        } else {
          // لا جلسة — بدون أي رسالة خطأ للمستخدم
          applyGuest({ hadSession: Boolean(readStoredUser()) });
        }
      } catch {
        // خطأ شبكة: أعد المحاولة تلقائياً فور عودة الاتصال
        if (!isBrowserOnline() && typeof window !== "undefined") {
          const onOnline = () => {
            window.removeEventListener("online", onOnline);
            runBootstrap();
          };
          window.addEventListener("online", onOnline);
          return;
        }
        // خادم متعطل أو خطأ غير متوقع: لا تحبس المستخدم على الـ Splash
        if (readStoredUser()) {
          // اعتبره داخلاً مؤقتاً — الطلبات الفعلية ستتكفل بالتصحيح
          setStatus("authenticated");
        } else {
          setStatus("guest");
        }
      }
    };

    runBootstrap();
  }, [applyAuthenticated, applyGuest]);

  /* -------------- مزامنة نفس التبويب (بعد login/signup) -------------- */
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onAuthUpdate = () => {
      const next = readStoredUser();
      if (next) {
        setUser(next);
        setStatus("authenticated");
      }
    };
    window.addEventListener("auth-storage-update", onAuthUpdate);
    return () => window.removeEventListener("auth-storage-update", onAuthUpdate);
  }, []);

  /* ----------------------- مزامنة بقية التبويبات ---------------------- */
  useEffect(() => {
    const unsubscribe = subscribeAuthMessages((msg) => {
      if (msg.type === "login") {
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
    const redirect = loginPathForUser(user || readStoredUser());
    try {
      await logoutRequest(); // يمسح كوكي الـ refresh على الخادم
    } catch {
      // الخروج محلياً يتم في كل الأحوال
    }
    ["examAnswers", "examTimeLeft"].forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
    clearAuthSession({ broadcast: true });
    setUser(null);
    setStatus("guest");
    if (typeof window !== "undefined") {
      window.location.href = redirect;
    }
  }, [user]);

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

  if (status === "checking" && blockUiWhileChecking) {
    return <AppSplashScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
