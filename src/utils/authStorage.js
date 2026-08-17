/**
 * واجهة الجلسة الموحّدة (Facade) — نفس الدوال القديمة لكن:
 * - الـ Access Token في الذاكرة فقط (services/tokenStore) — لا يُكتب على القرص أبداً.
 * - بيانات المستخدم (بروفايل بدون أسرار) في localStorage **معزولة لكل subdomain**.
 * - الـ Refresh Token في كوكي HttpOnly يديره الخادم بالكامل.
 */
import {
  safeLocalRemove,
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
import {
  enrichUserWithTenant,
  getAuthScopeSubdomain,
  inferTenantMetaFromHost,
  readScopedAuthItem,
  readStoredTenantMeta,
  removeScopedAuthItem,
  sessionMatchesCurrentTenant,
  writeScopedAuthItem,
  writeStoredTenantMeta,
} from "./tenantAuthStorage";
import { normalizeAuthUser } from "./authRoles";

export const AUTH_STORAGE_UPDATE_EVENT = "auth-storage-update";

function dispatchAuthStorageUpdate(user) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(AUTH_STORAGE_UPDATE_EVENT, {
      detail: user ? { user } : undefined,
    }),
  );
}

function extractUserFromLoginPayload(inner) {
  if (!inner || typeof inner !== "object") return null;
  if (inner.user && typeof inner.user === "object") return inner.user;
  if (inner.Data && typeof inner.Data === "object") return inner.Data;
  const data = inner.data;
  if (data && typeof data === "object") {
    if (data.user && typeof data.user === "object") return data.user;
    if ("role" in data || "id" in data || "email" in data || "phone" in data) {
      return data;
    }
  }
  return null;
}

export function normalizeAuthToken(raw) {
  return normalizeJwt(raw);
}

function readStoredUserRaw() {
  try {
    const raw = readScopedAuthItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * حفظ نتيجة تسجيل الدخول/التسجيل: التوكن + المستخدم → localStorage (معزول + legacy user).
 */
export function persistLoginSession(payload, { broadcast = true } = {}) {
  if (!payload || typeof payload !== "object") return null;

  const inner =
    payload.data != null &&
    typeof payload.data === "object" &&
    ("token" in payload.data || "user" in payload.data)
      ? payload.data
      : payload;

  const token = normalizeAuthToken(inner.token);
  const tenantMeta = inferTenantMetaFromHost(inner.tenant ?? null);
  const rawUser = extractUserFromLoginPayload(inner);
  const user =
    rawUser != null && typeof rawUser === "object"
      ? normalizeAuthUser(enrichUserWithTenant(rawUser, tenantMeta), { token })
      : null;

  if (token) {
    setAccessToken(token, { broadcast: false });
  }

  if (user) {
    writeScopedAuthItem("user", JSON.stringify(user));
  }

  if (tenantMeta) {
    writeStoredTenantMeta(tenantMeta);
  }

  if ("employee_data" in inner) {
    writeScopedAuthItem("employee_data", JSON.stringify(inner.employee_data));
  } else {
    removeScopedAuthItem("employee_data");
  }

  if ("employee_permissions" in inner) {
    writeScopedAuthItem("employee_permissions", JSON.stringify(inner.employee_permissions));
  } else {
    removeScopedAuthItem("employee_permissions");
  }

  dispatchAuthStorageUpdate(user);

  if (broadcast) {
    postAuthMessage({
      type: "login",
      token: token || getAccessToken(),
      user,
      tenant: getAuthScopeSubdomain(),
    });
  }

  return user;
}

export function clearAuthSession({ broadcast = false } = {}) {
  clearAccessToken({ broadcast: false });
  removeScopedAuthItem("user");
  removeScopedAuthItem("employee_data");
  removeScopedAuthItem("employee_permissions");
  removeScopedAuthItem("tenant");
  if (getAuthScopeSubdomain()) {
    purgeLegacyGlobalAuthKeys();
  }
  if (typeof window !== "undefined") {
    dispatchAuthStorageUpdate(null);
  }
  if (broadcast) {
    postAuthMessage({ type: "logout", tenant: getAuthScopeSubdomain() });
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

export function readStoredUser() {
  const user = readStoredUserRaw();
  if (!user) return null;
  const tenantMeta = readStoredTenantMeta();
  if (!sessionMatchesCurrentTenant(user, tenantMeta)) return null;
  return normalizeAuthUser(enrichUserWithTenant(user, tenantMeta));
}

/** يحفظ/يحدّث بيانات المستخدم في localStorage */
export function persistStoredUser(user, { broadcast = true } = {}) {
  if (!user || typeof user !== "object") return null;
  const tenantMeta = readStoredTenantMeta();
  const normalized = normalizeAuthUser(enrichUserWithTenant(user, tenantMeta));
  writeScopedAuthItem("user", JSON.stringify(normalized));
  dispatchAuthStorageUpdate(normalized);
  if (broadcast) {
    postAuthMessage({
      type: "user",
      user: normalized,
      tenant: getAuthScopeSubdomain(),
    });
  }
  return normalized;
}

/**
 * جلسة صالحة للدخول للوحة التحكم على المنصة الحالية.
 */
export function hasValidAuthSession() {
  const token = readAuthToken();
  if (token && !isJwtExpired(token)) return true;
  return Boolean(readStoredUser());
}

export function clearExpiredAuthQuietly() {
  return false;
}

export function markSessionExpired({ broadcast = true } = {}) {
  let redirect = "/login";
  try {
    const user = readStoredUser();
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
    postAuthMessage({ type: "session-expired", tenant: getAuthScopeSubdomain() });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

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

export { sessionMatchesCurrentTenant, enrichUserWithTenant, readStoredTenantMeta };
