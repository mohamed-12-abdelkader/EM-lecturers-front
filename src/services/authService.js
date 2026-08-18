/**
 * AuthService — نداءات المصادقة + تدفق الإقلاع (Bootstrap).
 *
 * عزل المنصات: جلسة منصة A لا تُقبل على منصة B — يُمسح الكوكي المشترك.
 */

import authHttp from "../api/authHttp";
import { isJwtExpired } from "../utils/jwt";
import {
  enrichUserWithTenant,
  persistStoredUser,
  readStoredUser,
  sessionMatchesCurrentTenant,
} from "../utils/authStorage";
import { normalizeAuthUser } from "../utils/authRoles";
import {
  getAccessToken,
  requestTokenFromPeers,
} from "./tokenStore";
import { refreshSession } from "./refreshManager";
import { writeStoredTenantMeta, getAuthScopeSubdomain } from "../utils/tenantAuthStorage";
import { rejectForeignTenantSession } from "../utils/sessionGuard";

function isEndpointMissing(error) {
  const status = error?.response?.status;
  return status === 404 || status === 405;
}

function bearerConfig() {
  const token = getAccessToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

async function rejectForeignTenantSessionAndReturnNull() {
  await rejectForeignTenantSession();
  return null;
}

function normalizeMeResponse(response) {
  const user = response?.data?.user ?? response?.data ?? null;
  const tenant = response?.data?.tenant ?? null;
  if (!user) return null;
  const stored = readStoredUser();
  const enriched = normalizeAuthUser(enrichUserWithTenant(user, tenant), {
    fallbackUser: stored,
  });
  if (!sessionMatchesCurrentTenant(enriched, tenant)) {
    return { mismatch: true };
  }
  return { user: enriched, tenant };
}

/** GET /auth/me — يرجع بيانات المستخدم أو null عند عدم التطابق */
export async function fetchMe() {
  const response = await authHttp.get("api/auth/me", bearerConfig());
  const result = normalizeMeResponse(response);
  if (result?.mismatch) {
    return rejectForeignTenantSessionAndReturnNull();
  }
  if (result?.tenant) {
    writeStoredTenantMeta(result.tenant);
  }
  if (result?.user) {
    persistStoredUser(result.user, { broadcast: false });
  }
  return result?.user ?? null;
}

/** POST /auth/logout — يمسح كوكي الـ refresh ويلغي جلسة الجهاز الحالي */
export async function logoutRequest() {
  try {
    await authHttp.post("api/auth/logout", null, bearerConfig());
    return true;
  } catch {
    return false;
  }
}

/** POST /auth/logout-all — يلغي كل جلسات المستخدم على كل الأجهزة */
export async function logoutAllRequest() {
  const response = await authHttp.post("api/auth/logout-all", null, bearerConfig());
  return response?.data;
}

function isAuthRejection(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403;
}

/** استعادة جلسة محلية للـ tenant الحالي من التخزين */
function restoreLocalSession() {
  const stored = readStoredUser();
  return stored ? { user: stored } : { user: null };
}

export async function bootstrapSession() {
  const tenantScope = getAuthScopeSubdomain();
  let token = getAccessToken();
  const localUser = readStoredUser();

  if (!token || isJwtExpired(token)) {
    token = await requestTokenFromPeers(300);
  }

  if (token && !isJwtExpired(token)) {
    try {
      const user = await fetchMe();
      if (user) return { user };
      return restoreLocalSession();
    } catch (error) {
      if (isEndpointMissing(error)) {
        return restoreLocalSession();
      }
      if (!isAuthRejection(error)) throw error;
      return restoreLocalSession();
    }
  }

  // على subdomain المدرس: لا نستعيد جلسة من كوكي مشترك بدون جلسة محلية
  if (tenantScope && !localUser) {
    return { user: null };
  }

  let refreshed;
  try {
    refreshed = await refreshSession();
  } catch (error) {
    throw error;
  }

  if (!refreshed) {
    return restoreLocalSession();
  }

  try {
    const user = await fetchMe();
    if (user) return { user };
    return restoreLocalSession();
  } catch (error) {
    if (isEndpointMissing(error)) {
      return restoreLocalSession();
    }
    if (isAuthRejection(error)) return restoreLocalSession();
    throw error;
  }
}
