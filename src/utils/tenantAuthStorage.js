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
const MAIN_SCOPE = "__main__";

function legacyPrefixedKey(baseKey, subdomain) {
  const scope = subdomain || MAIN_SCOPE;
  return `${LEGACY_PREFIX}${scope}:${baseKey}`;
}

function parseLegacyPrefixedKey(key) {
  if (!key || !key.startsWith(LEGACY_PREFIX)) return null;
  const rest = key.slice(LEGACY_PREFIX.length);
  const colonIdx = rest.indexOf(":");
  if (colonIdx <= 0) return null;
  return {
    scope: rest.slice(0, colonIdx),
    baseKey: rest.slice(colonIdx + 1),
  };
}

function scopeMatchesCurrentTenant(scope) {
  const current = getAuthScopeSubdomain();
  if (!current) return scope === MAIN_SCOPE;
  return scope === current;
}

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

  const effectiveTenant =
    tenantMeta != null && typeof tenantMeta === "object" ? tenantMeta : null;
  const subdomain = extractSessionTenantSubdomain(user, effectiveTenant);
  const tenantId = effectiveTenant?.id ?? user.tenant_id ?? null;
  return {
    ...user,
    ...(tenantId != null ? { tenant_id: tenantId } : {}),
    ...(subdomain ? { tenant_subdomain: subdomain } : {}),
  };
}

function isMainSiteOnlyRole(user) {
  const role = String(user?.role || user?.user_role || "").toLowerCase();
  return role === "admin" || role === "super_admin";
}

/** هل الجلسة تخص المنصة الحالية؟ */
export function sessionMatchesCurrentTenant(user, tenantMeta = null) {
  const current = getAuthScopeSubdomain();
  if (!current) return true;
  if (!user || typeof user !== "object") return false;

  if (isMainSiteOnlyRole(user)) return false;

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

  return false;
}

export function readScopedAuthItem(baseKey) {
  const plain = safeLocalGet(baseKey);
  if (plain != null && plain !== "") return plain;

  const current = getAuthScopeSubdomain();
  if (current) {
    const scoped = safeLocalGet(legacyPrefixedKey(baseKey, current));
    if (scoped != null && scoped !== "") return scoped;
  }

  if (!current) {
    const mainScoped = safeLocalGet(legacyPrefixedKey(baseKey, MAIN_SCOPE));
    if (mainScoped != null && mainScoped !== "") return mainScoped;
  }

  return null;
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

/** ينقل em-auth:scope:* → user/token ثم يمسح المفاتيح القديمة */
export function migrateLegacyAuthSession() {
  if (typeof window === "undefined") return;

  const legacyValues = new Map();

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      const parsed = parseLegacyPrefixedKey(key);
      if (!parsed || !AUTH_KEYS.includes(parsed.baseKey)) continue;
      if (!scopeMatchesCurrentTenant(parsed.scope)) continue;

      const value = safeLocalGet(key);
      if (value != null && value !== "" && !legacyValues.has(parsed.baseKey)) {
        legacyValues.set(parsed.baseKey, value);
      }
    }
  } catch {
    // ignore
  }

  for (const baseKey of AUTH_KEYS) {
    const existing = safeLocalGet(baseKey);
    if (existing != null && existing !== "") continue;

    const migrated = legacyValues.get(baseKey);
    if (migrated != null && migrated !== "") {
      safeLocalSet(baseKey, migrated);
    }
  }

  purgeLegacyPrefixedAuthKeys();
}
