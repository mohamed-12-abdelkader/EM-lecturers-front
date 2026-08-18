/**
 * AuthService — localStorage فقط. لا cookies ولا refresh مشترك بين subdomains.
 */
import authHttp from "../api/authHttp";
import {
  clearAuthSession,
  enrichUserWithTenant,
  persistStoredUser,
  readAuthToken,
  readStoredUser,
  sessionMatchesCurrentTenant,
} from "../utils/authStorage";
import { safeLocalGet } from "../utils/safeStorage";
import { normalizeAuthUser } from "../utils/authRoles";
import { clearLocalAuthSession } from "../utils/sessionGuard";

function bearerConfig() {
  const token = readAuthToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

function normalizeMeResponse(response) {
  const user = response?.data?.user ?? response?.data ?? null;
  const tenant = response?.data?.tenant ?? null;
  if (!user) return null;

  const enriched = normalizeAuthUser(enrichUserWithTenant(user, tenant));
  if (!sessionMatchesCurrentTenant(enriched, tenant)) {
    return { mismatch: true };
  }
  return { user: enriched, tenant };
}

export async function fetchMe() {
  const response = await authHttp.get("api/auth/me", bearerConfig());
  const result = normalizeMeResponse(response);
  if (result?.mismatch) {
    clearLocalAuthSession();
    return null;
  }
  if (result?.user) {
    persistStoredUser(result.user);
  }
  return result?.user ?? null;
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

/** إقلاع من localStorage — بدون cookie refresh */
export function bootstrapSession() {
  const token = readAuthToken();
  const user = readStoredUser();

  if (token && user) {
    return { user };
  }

  if (token || safeLocalGet("user")) {
    clearAuthSession();
  }

  return { user: null };
}
