/**
 * تخزين الجلسة — مفاتيح بسيطة user / token في localStorage.
 * كل منصة (subdomain) = origin منفصل → المتصفح يعزل التخزين تلقائياً.
 */
import {
  getTenantSubdomain,
  normalizeTenantSlug,
  resolveTenantSubdomain,
} from "./tenantHost";
import { safeLocalGet, safeLocalRemove, safeLocalSet } from "./safeStorage";

const AUTH_KEYS = ["user", "token", "tenant", "employee_data", "employee_permissions"];
const LEGACY_PREFIX = "em-auth:";

/** Subdomain الحالي (للتحقق من تطابق الجلسة فقط) */
export function getAuthScopeSubdomain() {
  const fromHost = normalizeTenantSlug(getTenantSubdomain());
  if (fromHost) return fromHost;

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return null;
  }

  return normalizeTenantSlug(resolveTenantSubdomain());
}

/** مفتاح التخزين — دائماً user / token مباشرة */
export function tenantAuthStorageKey(baseKey) {
  return baseKey;
}

export function extractSessionTenantSubdomain(user, tenantMeta) {
  return normalizeTenantSlug(
    tenantMeta?.subdomain ??
      user?.tenant_subdomain ??
      user?.tenant?.subdomain ??
      null,
  );
}

export function inferTenantMetaFromHost(tenantMeta) {
  if (tenantMeta != null && typeof tenantMeta === "object") return tenantMeta;
  const subdomain =
    normalizeTenantSlug(getTenantSubdomain()) || getAuthScopeSubdomain();
  if (!subdomain) return null;
  return { subdomain };
}

export function enrichUserWithTenant(user, tenantMeta) {
  if (!user || typeof user !== "object") return user;
  const effectiveTenant = inferTenantMetaFromHost(tenantMeta);
  const subdomain = extractSessionTenantSubdomain(user, effectiveTenant);
  const tenantId = effectiveTenant?.id ?? user.tenant_id ?? null;
  return {
    ...user,
    ...(tenantId != null ? { tenant_id: tenantId } : {}),
    ...(subdomain ? { tenant_subdomain: subdomain } : {}),
  };
}

/** هل الجلسة تخص المنصة الحالية؟ */
export function sessionMatchesCurrentTenant(user, tenantMeta = null) {
  const current = getAuthScopeSubdomain();
  if (!current) return true;
  if (!user || typeof user !== "object") return false;

  const effectiveTenant =
    tenantMeta != null && typeof tenantMeta === "object" ? tenantMeta : null;
  const sessionTenant = extractSessionTenantSubdomain(user, effectiveTenant);

  if (sessionTenant) {
    if (sessionTenant === "default") {
      const hostTenant = normalizeTenantSlug(getTenantSubdomain());
      return Boolean(hostTenant && hostTenant === current);
    }
    return sessionTenant === current;
  }

  const metaSubdomain = normalizeTenantSlug(effectiveTenant?.subdomain);
  if (metaSubdomain) return metaSubdomain === current;

  const hostTenant = normalizeTenantSlug(getTenantSubdomain());
  return Boolean(hostTenant && hostTenant === current);
}

export function readScopedAuthItem(baseKey) {
  return safeLocalGet(baseKey);
}

export function writeScopedAuthItem(baseKey, value) {
  safeLocalSet(baseKey, value);
}

export function removeScopedAuthItem(baseKey) {
  safeLocalRemove(baseKey);
}

function readTenantMetaRaw() {
  const raw = safeLocalGet("tenant");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getEffectiveTenantMeta() {
  return readTenantMetaRaw() ?? inferTenantMetaFromHost(null);
}

export function readStoredTenantMeta() {
  return getEffectiveTenantMeta();
}

export function writeStoredTenantMeta(tenant) {
  const effective = inferTenantMetaFromHost(tenant);
  if (effective == null || typeof effective !== "object") {
    removeScopedAuthItem("tenant");
    return;
  }
  writeScopedAuthItem("tenant", JSON.stringify(effective));
}

/** يمسح مفاتيح النظام القديم em-auth:* */
export function purgeLegacyPrefixedAuthKeys() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(LEGACY_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => safeLocalRemove(key));
  } catch {
    // ignore
  }
}

/** @deprecated — للتوافق مع الاستدعاءات القديمة */
export function purgeLegacyGlobalAuthKeys() {
  purgeLegacyPrefixedAuthKeys();
}

export function clearScopedAuthSession() {
  AUTH_KEYS.forEach((key) => removeScopedAuthItem(key));
}

export function getTenantStorageKey(baseKey) {
  return tenantAuthStorageKey(baseKey);
}

export function clearTenantAuth() {
  clearScopedAuthSession();
  purgeLegacyPrefixedAuthKeys();
}

export function getAuthChannelName() {
  const scope = getAuthScopeSubdomain() || "main";
  return `em-auth-v1:${scope}`;
}

/** تنظيف النظام القديم عند الإقلاع */
export function migrateLegacyAuthSession() {
  purgeLegacyPrefixedAuthKeys();
}
