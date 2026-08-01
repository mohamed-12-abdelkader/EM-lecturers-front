/**
 * واجهة الجلسة الموحّدة (Facade) — نفس الدوال القديمة لكن:
 * - الـ Access Token في الذاكرة فقط (services/tokenStore) — لا يُكتب على القرص أبداً.
 * - بيانات المستخدم (بروفايل بدون أسرار) تبقى في localStorage لتوافق الكود القديم.
 * - الـ Refresh Token في كوكي HttpOnly يديره الخادم بالكامل.
 */
import {
  safeLocalGet,
  safeLocalRemove,
  safeLocalSet,
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from "./safeStorage";
import {
  normalizeAuthToken as normalizeJwt,
  getJwtPayload as decodeJwtPayload,
  isJwtExpired,
} from "./jwt";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../services/tokenStore";
import { postAuthMessage } from "../services/authChannel";

export function normalizeAuthToken(raw) {
  return normalizeJwt(raw);
}

/**
 * حفظ نتيجة تسجيل الدخول: التوكن → الذاكرة، المستخدم → localStorage.
 * يدعم الشكل المسطّح { token, user, ... } أو الغلاف { data: { token, user } }.
 */
export function persistLoginSession(payload, { broadcast = true } = {}) {
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
    setAccessToken(token, { broadcast: false });
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

  if (broadcast) {
    postAuthMessage({
      type: "login",
      token: token || getAccessToken(),
      user: user != null && typeof user === "object" ? user : null,
    });
  }
}

export function clearAuthSession({ broadcast = false } = {}) {
  clearAccessToken({ broadcast: false });
  safeLocalRemove("user");
  safeLocalRemove("employee_data");
  safeLocalRemove("employee_permissions");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-storage-update"));
  }
  if (broadcast) {
    postAuthMessage({ type: "logout" });
  }
}

/** يقرأ التوكن الحالي من الذاكرة (بدون بادئة Bearer). */
export function readAuthToken() {
  return getAccessToken();
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
  return decodeJwtPayload(rawToken ?? readAuthToken());
}

/** true لو التوكن موجود وانتهت صلاحية exp */
export function isAuthTokenExpired(rawToken) {
  return isJwtExpired(rawToken ?? readAuthToken());
}

/**
 * جلسة صالحة للدخول للوحة التحكم.
 * ملاحظة: مع نظام الكوكي، انتهاء الـ Access Token لا يعني انتهاء الجلسة —
 * لذا نعتمد على وجود مستخدم محفوظ أو توكن حي في الذاكرة.
 */
export function hasValidAuthSession() {
  const token = readAuthToken();
  if (token && !isJwtExpired(token)) return true;
  // التوكن يعيش في الذاكرة فقط؛ وجود user محفوظ يعني أن AuthProvider
  // إما استعاد الجلسة بالفعل أو سيستعيدها عبر كوكي الـ refresh.
  try {
    const raw = safeLocalGet("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * (توافق قديم) — كان يمسح التوكن المنتهي على الصفحات العامة.
 * مع نظام الـ refresh بالكوكي، انتهاء الـ Access Token طبيعي ويُجدَّد تلقائياً،
 * لذا لم يعد هناك ما يُمسح هنا.
 */
export function clearExpiredAuthQuietly() {
  return false;
}

/**
 * يعلّم انتهاء الجلسة نهائياً (فشل الـ refresh)، يمسح بيانات الدخول،
 * وينبّه الواجهة + بقية التبويبات.
 */
export function markSessionExpired({ broadcast = true } = {}) {
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
  if (broadcast) {
    postAuthMessage({ type: "session-expired" });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

/** تسجيل خروج إجباري بعد انتهاء الجلسة */
export function forceLogoutToLogin(loginPath) {
  const redirect =
    loginPath || safeSessionGet("auth_logout_redirect") || "/login";
  clearSessionExpiredFlag();
  clearAuthSession({ broadcast: true });
  safeLocalRemove("examAnswers");
  safeLocalRemove("examTimeLeft");
  if (typeof window !== "undefined") {
    window.location.href = redirect;
  }
}
