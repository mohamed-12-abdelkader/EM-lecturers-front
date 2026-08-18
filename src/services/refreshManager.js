/**
 * RefreshManager — تجديد الجلسة عبر كوكي الـ HttpOnly.
 */

import authHttp from "../api/authHttp";
import { isJwtExpired } from "../utils/jwt";
import {
  enrichUserWithTenant,
  readStoredUser,
  sessionMatchesCurrentTenant,
  AUTH_STORAGE_UPDATE_EVENT,
} from "../utils/authStorage";
import { normalizeAuthUser } from "../utils/authRoles";
import {
  getAccessToken,
  hasFreshAccessToken,
  setAccessToken,
} from "./tokenStore";
import { postAuthMessage } from "./authChannel";
import {
  getAuthScopeSubdomain,
  readStoredTenantMeta,
  writeScopedAuthItem,
} from "../utils/tenantAuthStorage";
import { rejectForeignTenantSession } from "../utils/sessionGuard";

const REFRESH_LOCK_PREFIX = "em-auth-refresh";

let inflight = null;

function refreshLockName() {
  return `${REFRESH_LOCK_PREFIX}:${getAuthScopeSubdomain() || "main"}`;
}

function persistRefreshedUser(user, apiTenant = null) {
  if (user == null || typeof user !== "object") return;
  const tenantMeta = apiTenant ?? readStoredTenantMeta();
  const stored = readStoredUser();
  const enriched = normalizeAuthUser(enrichUserWithTenant(user, tenantMeta), {
    fallbackUser: stored,
  });
  if (!sessionMatchesCurrentTenant(enriched, tenantMeta)) return;
  writeScopedAuthItem("user", JSON.stringify(enriched));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(AUTH_STORAGE_UPDATE_EVENT, { detail: { user: enriched } }),
    );
  }
  postAuthMessage({ type: "user", user: enriched, tenant: getAuthScopeSubdomain() });
}

async function performRefresh() {
  try {
    const response = await authHttp.post("api/auth/refresh");
    const token = response?.data?.token;
    if (!token) return null;

    const apiTenant = response?.data?.tenant ?? null;
    const user = response?.data?.user;
    const enriched =
      user != null && typeof user === "object"
        ? enrichUserWithTenant(user, apiTenant)
        : null;

    if (getAuthScopeSubdomain()) {
      if (!enriched || !sessionMatchesCurrentTenant(enriched, apiTenant)) {
        await rejectForeignTenantSession();
        return null;
      }
    }

    setAccessToken(token);
    persistRefreshedUser(user, apiTenant);
    return getAccessToken();
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) return null;
    if (status === 404 || status === 405) return null;
    throw error;
  }
}

async function refreshWithCrossTabLock(staleToken) {
  const run = async () => {
    const current = getAccessToken();
    if (current && current !== staleToken && !isJwtExpired(current)) {
      return current;
    }
    return performRefresh();
  };

  const lockName = refreshLockName();
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(lockName, run);
  }
  return run();
}

export function refreshSession() {
  if (inflight) return inflight;
  const staleToken = getAccessToken();
  inflight = refreshWithCrossTabLock(staleToken).finally(() => {
    inflight = null;
  });
  return inflight;
}

export function isRefreshing() {
  return inflight != null;
}

export { hasFreshAccessToken };
