/**
 * يوحّد شكل التوكن قبل التخزين/الإرسال:
 * - يشيل Bearer المكرر
 * - يشيل علامات الاقتباس الزائدة
 * - يرفض قيم null/undefined كنص
 */
import {
  safeLocalGet,
  safeLocalRemove,
  safeLocalSet,
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from "./safeStorage";

export function normalizeAuthToken(raw) {
  if (raw == null) return "";
  let token = String(raw).trim();
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }
  token = token.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === "null" || token === "undefined") return "";
  return token;
}

/**
 * حفظ نتيجة تسجيل الدخول في localStorage بشكل موحّد.
 * يدعم الشكل المسطّح { token, user, employee_data, employee_permissions }
 * أو الغلاف الشائع { data: { token, user, ... } }.
 */
export function persistLoginSession(payload) {
  if (!payload || typeof payload !== "object") return;

  const inner =
    payload.data != null &&
    typeof payload.data === "object" &&
    ("token" in payload.data || "user" in payload.data)
      ? payload.data
      : payload;

  const token = normalizeAuthToken(inner.token);
  const user = inner.user ?? inner.Data ?? inner.data;

  if (token) {
    safeLocalSet("token", token);
  }

  if (user != null && typeof user === "object") {
    safeLocalSet("user", JSON.stringify(user));
  }

  if ("employee_data" in inner) {
    safeLocalSet("employee_data", JSON.stringify(inner.employee_data));
  } else {
    safeLocalRemove("employee_data");
  }

  if ("employee_permissions" in inner) {
    safeLocalSet("employee_permissions", JSON.stringify(inner.employee_permissions));
  } else {
    safeLocalRemove("employee_permissions");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-storage-update"));
  }
}

export function clearAuthSession() {
  safeLocalRemove("token");
  safeLocalRemove("user");
  safeLocalRemove("employee_data");
  safeLocalRemove("employee_permissions");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-storage-update"));
  }
}

/** يقرأ توكن صالح من التخزين (بدون بادئة Bearer). */
export function readAuthToken() {
  return normalizeAuthToken(safeLocalGet("token", ""));
}

export const SESSION_EXPIRED_FLAG = "auth_session_expired";
export const SESSION_EXPIRED_EVENT = "session-expired";

export function isSessionExpiredFlagSet() {
  return safeSessionGet(SESSION_EXPIRED_FLAG) === "1";
}

export function clearSessionExpiredFlag() {
  safeSessionRemove(SESSION_EXPIRED_FLAG);
  safeSessionRemove("auth_logout_redirect");
}

/** يفك payload الـ JWT بدون مكتبات خارجية */
export function getJwtPayload(rawToken) {
  const token = normalizeAuthToken(rawToken ?? readAuthToken());
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** true لو التوكن موجود وانتهت صلاحية exp */
export function isAuthTokenExpired(rawToken) {
  const token = normalizeAuthToken(rawToken ?? readAuthToken());
  if (!token) return false;
  const payload = getJwtPayload(token);
  if (!payload || payload.exp == null) return false;
  const expMs = Number(payload.exp) * 1000;
  if (!Number.isFinite(expMs)) return false;
  return Date.now() >= expMs - 5000;
}

/** جلسة صالحة للدخول للوحة التحكم (توكن موجود وغير منتهي) */
export function hasValidAuthSession() {
  const token = readAuthToken();
  if (!token) return false;
  if (isAuthTokenExpired(token)) return false;
  return true;
}

/**
 * على الصفحات العامة: امسح التوكن المنتهي بهدوء بدون مودال.
 * يمنع فتح لوحة الطالب/المدرس على أجهزة فيها جلسة قديمة.
 */
export function clearExpiredAuthQuietly() {
  const token = readAuthToken();
  if (!token) return false;
  if (!isAuthTokenExpired(token)) return false;
  clearSessionExpiredFlag();
  clearAuthSession();
  safeLocalRemove("examAnswers");
  safeLocalRemove("examTimeLeft");
  return true;
}

/**
 * يعلّم انتهاء الجلسة، يمسح بيانات الدخول، وينبّه الواجهة لعرض المودال.
 */
export function markSessionExpired() {
  let redirect = "/login";
  try {
    const user = JSON.parse(safeLocalGet("user", "null") || "null");
    if (user?.role === "teacher") redirect = "/teacher-login";
  } catch {
    // ignore
  }
  safeSessionSet(SESSION_EXPIRED_FLAG, "1");
  safeSessionSet("auth_logout_redirect", redirect);
  safeLocalRemove("examAnswers");
  safeLocalRemove("examTimeLeft");
  clearAuthSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

/** تسجيل خروج إجباري بعد انتهاء الجلسة */
export function forceLogoutToLogin(loginPath) {
  const redirect =
    loginPath || safeSessionGet("auth_logout_redirect") || "/login";
  clearSessionExpiredFlag();
  clearAuthSession();
  safeLocalRemove("examAnswers");
  safeLocalRemove("examTimeLeft");
  if (typeof window !== "undefined") {
    window.location.href = redirect;
  }
}
