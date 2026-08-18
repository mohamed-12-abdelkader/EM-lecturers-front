/**

 * عزل جلسة المصادقة لكل منصة مدرس (subdomain).

 * كل مدرس له مفاتيح تخزين مستقلة — لا تنتقل الجلسة بين mohamed.localhost و omar.localhost.

 *

 * يُكتَب أيضاً في مفاتيح legacy (user, token, …) للتوافق مع الكود القديم.

 */

import {

  getTenantSubdomain,

  normalizeTenantSlug,

  resolveTenantSubdomain,

} from "./tenantHost";

import { safeLocalGet, safeLocalRemove, safeLocalSet } from "./safeStorage";



const AUTH_NS = "em-auth";

const MAIN_SCOPE = "__main__";

const LEGACY_AUTH_KEYS = new Set([

  "user",

  "token",

  "employee_data",

  "employee_permissions",

  "tenant",

]);



/** يكتب مفتاح legacy — معطّل: لا ن mirrored keys عامة بين tenants على نفس origin */
function mirrorLegacyAuthKey(_baseKey, _value) {
  // intentionally no-op — localStorage bridge + scoped keys only
}



/** يمسح مفتاح legacy مباشرة — بدون المرور بجسر localStorage (يتجنب recursion) */

function removeLegacyAuthKey(key) {

  try {

    if (typeof window === "undefined") return;

    Storage.prototype.removeItem.call(window.localStorage, key);

  } catch {

    // ignore

  }

}



/** Subdomain الحالي لنطاق التخزين (hostname → query → session) */

export function getAuthScopeSubdomain() {

  const fromHost = normalizeTenantSlug(getTenantSubdomain());

  if (fromHost) return fromHost;



  if (typeof window !== "undefined") {

    const host = window.location.hostname.toLowerCase();

    // localhost بدون subdomain — لا نربط الجلسة بـ tenant قديم في sessionStorage

    if (host === "localhost" || host === "127.0.0.1") {

      return null;

    }

  }



  return normalizeTenantSlug(resolveTenantSubdomain());

}



/** يملأ tenant من hostname إذا الـ API لم يرسله (مثل التسجيل) */

export function inferTenantMetaFromHost(tenantMeta) {

  if (tenantMeta != null && typeof tenantMeta === "object") return tenantMeta;

  const subdomain =

    normalizeTenantSlug(getTenantSubdomain()) || getAuthScopeSubdomain();

  if (!subdomain) return null;

  return { subdomain };

}



export function tenantAuthStorageKey(baseKey, subdomain = getAuthScopeSubdomain()) {

  const scope = subdomain || MAIN_SCOPE;

  return `${AUTH_NS}:${scope}:${baseKey}`;

}



export function extractSessionTenantSubdomain(user, tenantMeta) {

  return normalizeTenantSlug(

    tenantMeta?.subdomain ??

      user?.tenant_subdomain ??

      user?.tenant?.subdomain ??

      null,

  );

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



/**

 * هل الجلسة تخص المنصة الحالية؟

 * على الموقع الرئيسي (بدون subdomain) — أي جلسة مقبولة.

 */

export function sessionMatchesCurrentTenant(user, tenantMeta = null) {

  const current = getAuthScopeSubdomain();

  if (!current) return true;



  if (!user || typeof user !== "object") return false;



  const effectiveTenant = tenantMeta != null && typeof tenantMeta === "object" ? tenantMeta : null;

  const sessionTenant = extractSessionTenantSubdomain(user, effectiveTenant);



  if (sessionTenant) {

    if (sessionTenant === "default") {

      const hostTenant = normalizeTenantSlug(getTenantSubdomain());

      return Boolean(hostTenant && hostTenant === current);

    }

    return sessionTenant === current;

  }



  const metaSubdomain = normalizeTenantSlug(effectiveTenant?.subdomain);

  if (metaSubdomain) {

    return metaSubdomain === current;

  }



  // تنسيق قديم: user/token بدون tenant_subdomain — على subdomain المدرس نفس الـ origin

  const hostTenant = normalizeTenantSlug(getTenantSubdomain());

  if (hostTenant && hostTenant === current) {

    return true;

  }



  return false;

}



function parseStoredUserRaw(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readTenantMetaRaw(subdomain = getAuthScopeSubdomain()) {
  const scoped = safeLocalGet(tenantAuthStorageKey("tenant", subdomain));
  if (scoped) {
    try {
      const parsed = JSON.parse(scoped);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // ignore
    }
  }
  const legacy = safeLocalGet("tenant");
  if (!legacy) return null;
  try {
    const parsed = JSON.parse(legacy);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getEffectiveTenantMeta(subdomain = getAuthScopeSubdomain()) {
  return readTenantMetaRaw(subdomain) ?? inferTenantMetaFromHost(null);
}

function migrateLegacyUserToScoped(legacyRaw, subdomain = getAuthScopeSubdomain()) {
  if (!legacyRaw || !subdomain) return;
  const scopedKey = tenantAuthStorageKey("user", subdomain);
  safeLocalSet(scopedKey, legacyRaw);
}

function resolveUserStorageRaw(subdomain = getAuthScopeSubdomain()) {
  const scopedKey = tenantAuthStorageKey("user", subdomain);
  const scopedRaw = safeLocalGet(scopedKey);
  const legacyRaw = safeLocalGet("user");
  const tenantMeta = getEffectiveTenantMeta(subdomain);

  const scopedUser = parseStoredUserRaw(scopedRaw);
  const legacyUser = parseStoredUserRaw(legacyRaw);
  const scopedOk =
    scopedUser && sessionMatchesCurrentTenant(scopedUser, tenantMeta);
  const legacyOk =
    legacyUser && sessionMatchesCurrentTenant(legacyUser, tenantMeta);

  if (scopedOk && legacyOk && String(scopedUser.id) !== String(legacyUser.id)) {
    const legacyRole = String(legacyUser.role || "").toLowerCase();
    const scopedRole = String(scopedUser.role || "").toLowerCase();
    if (legacyRole === "student" && scopedRole !== "student") {
      migrateLegacyUserToScoped(legacyRaw, subdomain);
      return legacyRaw;
    }
    migrateLegacyUserToScoped(legacyRaw, subdomain);
    return legacyRaw;
  }

  if (scopedOk) return scopedRaw;
  if (legacyOk) {
    migrateLegacyUserToScoped(legacyRaw, subdomain);
    return legacyRaw;
  }

  if (scopedRaw && !scopedOk) safeLocalRemove(scopedKey);
  return null;
}

export function readScopedAuthItem(baseKey, subdomain = getAuthScopeSubdomain()) {

  if (baseKey === "user") {
    return resolveUserStorageRaw(subdomain);
  }

  const scopedKey = tenantAuthStorageKey(baseKey, subdomain);

  const scoped = safeLocalGet(scopedKey);

  if (scoped != null && scoped !== "") return scoped;



  if (!subdomain) {

    const legacy = safeLocalGet(baseKey);

    if (!legacy) return null;

    return null;

  }



  const legacy = safeLocalGet(baseKey);

  if (!legacy) return null;



  if (baseKey === "token" || baseKey === "tenant") {

    return legacy;

  }



  return null;

}



export function writeScopedAuthItem(baseKey, value, subdomain = getAuthScopeSubdomain()) {

  safeLocalSet(tenantAuthStorageKey(baseKey, subdomain), value);

  mirrorLegacyAuthKey(baseKey, value);

}



export function removeScopedAuthItem(baseKey, subdomain = getAuthScopeSubdomain()) {

  safeLocalRemove(tenantAuthStorageKey(baseKey, subdomain));

}



export function readStoredTenantMeta(subdomain = getAuthScopeSubdomain()) {

  return getEffectiveTenantMeta(subdomain);

}



export function writeStoredTenantMeta(tenant, subdomain = getAuthScopeSubdomain()) {

  const effective = inferTenantMetaFromHost(tenant);

  if (effective == null || typeof effective !== "object") {

    removeScopedAuthItem("tenant", subdomain);

    return;

  }

  writeScopedAuthItem("tenant", JSON.stringify(effective), subdomain);

}



/** يمسح مفاتيح legacy فقط */

export function purgeLegacyGlobalAuthKeys() {

  LEGACY_AUTH_KEYS.forEach((key) => {

    removeLegacyAuthKey(key);

  });

}



export function clearScopedAuthSession(subdomain = getAuthScopeSubdomain()) {

  ["user", "token", "employee_data", "employee_permissions", "tenant"].forEach((key) => {

    removeScopedAuthItem(key, subdomain);

  });

}



export function getTenantStorageKey(baseKey, subdomain = getAuthScopeSubdomain()) {

  return tenantAuthStorageKey(baseKey, subdomain);

}



export function clearTenantAuth(subdomain = getAuthScopeSubdomain()) {

  clearScopedAuthSession(subdomain);

  purgeLegacyGlobalAuthKeys();

}



export function getAuthChannelName(subdomain = getAuthScopeSubdomain()) {

  return `em-auth-v1:${subdomain || MAIN_SCOPE}`;

}



/**

 * ترحيل جلسات النظام القديم (user / token / tenant العامة) إلى المفاتيح المعزولة.

 * يُستدعى مرة عند الإقلاع — لا يمسح المفاتيح القديمة.

 */

export function migrateLegacyAuthSession(subdomain = getAuthScopeSubdomain()) {

  if (!subdomain || typeof window === "undefined") return;



  const tenantMeta = getEffectiveTenantMeta(subdomain);

  const legacyUserRaw = safeLocalGet("user");

  const legacyUser = parseStoredUserRaw(legacyUserRaw);

  if (legacyUserRaw && legacyUser && sessionMatchesCurrentTenant(legacyUser, tenantMeta)) {

    migrateLegacyUserToScoped(legacyUserRaw, subdomain);

  }



  const legacyToken = safeLocalGet("token");

  const scopedTokenKey = tenantAuthStorageKey("token", subdomain);

  if (legacyToken && !safeLocalGet(scopedTokenKey)) {

    safeLocalSet(scopedTokenKey, legacyToken);

  }



  const legacyTenant = safeLocalGet("tenant");

  const scopedTenantKey = tenantAuthStorageKey("tenant", subdomain);

  if (legacyTenant && !safeLocalGet(scopedTenantKey)) {

    safeLocalSet(scopedTenantKey, legacyTenant);

  }

}

