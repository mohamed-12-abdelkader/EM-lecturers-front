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



/** يكتب مفتاح legacy مباشرة — للتوافق مع localStorage.getItem("user") */

function mirrorLegacyAuthKey(baseKey, value) {

  if (!LEGACY_AUTH_KEYS.has(baseKey)) return;

  try {

    if (typeof window === "undefined") return;

    Storage.prototype.setItem.call(window.localStorage, baseKey, String(value));

  } catch {

    // ignore

  }

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



  const effectiveTenant = inferTenantMetaFromHost(tenantMeta);

  const sessionTenant = extractSessionTenantSubdomain(user, effectiveTenant);

  if (sessionTenant && sessionTenant === current) return true;



  // hostname هو مرجع المنصة — يقبل جلسة بدون tenant_subdomain بعد login مباشرة

  const hostTenant = normalizeTenantSlug(getTenantSubdomain());

  if (user && hostTenant && hostTenant === current) return true;



  // منصة default / admin على localhost — tenant subdomain "default"

  if (sessionTenant === "default" && hostTenant && hostTenant === current) return true;



  return false;

}



export function readScopedAuthItem(baseKey, subdomain = getAuthScopeSubdomain()) {

  const scopedKey = tenantAuthStorageKey(baseKey, subdomain);

  const scoped = safeLocalGet(scopedKey);

  if (scoped != null && scoped !== "") return scoped;



  if (!subdomain) {

    return safeLocalGet(baseKey);

  }



  const legacy = safeLocalGet(baseKey);

  if (!legacy) return null;



  if (baseKey === "user") {

    try {

      const parsed = JSON.parse(legacy);

      if (sessionMatchesCurrentTenant(parsed)) {

        safeLocalSet(scopedKey, legacy);

        return legacy;

      }

    } catch {

      // ignore

    }

  }



  if (baseKey === "token") {

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

  removeLegacyAuthKey(baseKey);

}



export function readStoredTenantMeta(subdomain = getAuthScopeSubdomain()) {

  try {

    const raw = readScopedAuthItem("tenant", subdomain);

    if (!raw) return inferTenantMetaFromHost(null);

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" ? parsed : inferTenantMetaFromHost(null);

  } catch {

    return inferTenantMetaFromHost(null);

  }

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



export function getAuthChannelName(subdomain = getAuthScopeSubdomain()) {

  return `em-auth-v1:${subdomain || MAIN_SCOPE}`;

}

