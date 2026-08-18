/**
 * Authentication — localStorage فقط (user + token) لكل origin/subdomain.
 */
import {
  safeLocalGet,
  safeLocalRemove,
  safeLocalSet,
} from "./safeStorage";
import {
  normalizeAuthToken as normalizeJwt,
  getJwtPayload as decodeJwtPayload,
  isJwtExpired,
} from "./jwt";
import {
  enrichUserWithTenant,
  getAuthScopeSubdomain,
  purgeLegacyAuthKeys,
  sessionMatchesCurrentTenant,
} from "./tenantAuthStorage";
import { normalizeAuthUser } from "./authRoles";

export const USER_KEY = "user";
export const TOKEN_KEY = "token";
export const AUTH_STORAGE_UPDATE_EVENT = "auth-storage-update";
export const SESSION_EXPIRED_EVENT = "session-expired";

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
    const raw = safeLocalGet(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function readAuthToken() {
  return normalizeAuthToken(safeLocalGet(TOKEN_KEY));
}

export function readStoredUser() {
  const token = readAuthToken();
  const user = readStoredUserRaw();
  if (!token || !user) return null;

  const tenantMeta =
    user.tenant && typeof user.tenant === "object" ? user.tenant : null;
  if (!sessionMatchesCurrentTenant(user, tenantMeta)) return null;

  return normalizeAuthUser(enrichUserWithTenant(user, tenantMeta), { token });
}

export function hasValidAuthSession() {
  return Boolean(readStoredUser() && readAuthToken());
}

/** Login / Register — localStorage.setItem("user") + localStorage.setItem("token") */
export function saveAuthSession(payload) {
  if (!payload || typeof payload !== "object") return null;

  purgeLegacyAuthKeys();

  const inner =
    payload.data != null &&
    typeof payload.data === "object" &&
    ("token" in payload.data || "user" in payload.data)
      ? payload.data
      : payload;

  const token = normalizeAuthToken(inner.token);
  const scope = getAuthScopeSubdomain();
  let tenantMeta = inner.tenant ?? null;
  if (scope) {
    tenantMeta = {
      ...(tenantMeta && typeof tenantMeta === "object" ? tenantMeta : {}),
      subdomain: scope,
    };
  }

  const rawUser = extractUserFromLoginPayload(inner);
  let user =
    rawUser != null && typeof rawUser === "object"
      ? normalizeAuthUser(enrichUserWithTenant(rawUser, tenantMeta), { token })
      : null;

  if (user && inner.employee_data != null) {
    user = { ...user, employee_data: inner.employee_data };
  }
  if (user && inner.employee_permissions != null) {
    user = { ...user, employee_permissions: inner.employee_permissions };
  }

  if (token) safeLocalSet(TOKEN_KEY, token);
  if (user) safeLocalSet(USER_KEY, JSON.stringify(user));

  dispatchAuthStorageUpdate(user);
  return user;
}

export function persistStoredUser(user) {
  if (!user || typeof user !== "object") return null;
  const normalized = normalizeAuthUser(user);
  safeLocalSet(USER_KEY, JSON.stringify(normalized));
  dispatchAuthStorageUpdate(normalized);
  return normalized;
}

/** Logout — يحذف user + token من origin الحالي فقط */
export function clearAuthSession() {
  safeLocalRemove(USER_KEY);
  safeLocalRemove(TOKEN_KEY);
  dispatchAuthStorageUpdate(null);
}

export function getJwtPayload(rawToken) {
  return decodeJwtPayload(rawToken ?? readAuthToken());
}

export function isAuthTokenExpired(rawToken) {
  return isJwtExpired(rawToken ?? readAuthToken());
}

export function clearExpiredAuthQuietly() {
  const token = readAuthToken();
  if (!token || !isJwtExpired(token)) return false;
  clearAuthSession();
  return true;
}

function resolveLoginRedirect(user) {
  const role = String(user?.role || "").toLowerCase();
  if (role === "teacher") return "/teacher-login";
  return "/login";
}

/** 401 — ينظف جلسة origin الحالي فقط */
export function markSessionExpired() {
  const redirect = resolveLoginRedirect(readStoredUser());
  safeLocalRemove("examAnswers");
  safeLocalRemove("examTimeLeft");
  clearAuthSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { redirect } }),
    );
  }
}

/** @deprecated استخدم saveAuthSession */
export const persistLoginSession = saveAuthSession;

export function forceLogoutToLogin(loginPath) {
  safeLocalRemove("examAnswers");
  safeLocalRemove("examTimeLeft");
  clearAuthSession();
  if (typeof window !== "undefined") {
    window.location.href = loginPath || "/login";
  }
}

export { sessionMatchesCurrentTenant, enrichUserWithTenant };
