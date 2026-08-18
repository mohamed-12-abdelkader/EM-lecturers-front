/**
 * API calls للمستخدم الحالي — Bearer من localStorage.token.
 */
import authHttp from "../api/authHttp";
import {
  clearAuthSession,
  enrichUserWithTenant,
  persistStoredUser,
  readAuthToken,
  sessionMatchesCurrentTenant,
} from "../utils/authStorage";
import { normalizeAuthUser } from "../utils/authRoles";

function bearerConfig() {
  const token = readAuthToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function fetchMe() {
  const response = await authHttp.get("api/auth/me", bearerConfig());
  const user = response?.data?.user ?? response?.data ?? null;
  const tenant = response?.data?.tenant ?? null;
  if (!user) return null;

  const enriched = normalizeAuthUser(enrichUserWithTenant(user, tenant));
  if (!sessionMatchesCurrentTenant(enriched, tenant)) {
    clearAuthSession();
    return null;
  }

  persistStoredUser(enriched);
  return enriched;
}

export async function logoutRequest() {
  try {
    await authHttp.post("api/auth/logout", null, bearerConfig());
    return true;
  } catch {
    return false;
  }
}

export async function logoutAllRequest() {
  const response = await authHttp.post("api/auth/logout-all", null, bearerConfig());
  return response?.data;
}
