/**
 * Tenant helpers — العزل الفعلي عبر browser origin + التحقق من user.tenant_subdomain.
 * التخزين: localStorage keys ثابتة user / token فقط (لا prefixes).
 */
import {
  getTenantSubdomain,
  normalizeTenantSlug,
} from "./tenantHost";

export function getAuthScopeSubdomain() {
  return normalizeTenantSlug(getTenantSubdomain());
}

export function extractSessionTenantSubdomain(user) {
  return normalizeTenantSlug(
    user?.tenant_subdomain ?? user?.tenant?.subdomain ?? null,
  );
}

export function enrichUserWithTenant(user, tenantMeta = null) {
  if (!user || typeof user !== "object") return user;
  const fromApi =
    tenantMeta != null && typeof tenantMeta === "object"
      ? normalizeTenantSlug(tenantMeta.subdomain)
      : null;
  const subdomain = extractSessionTenantSubdomain(user) || fromApi;
  const tenantId =
    tenantMeta?.id ?? user.tenant_id ?? null;
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

/** هل user/token يخص origin الحالي (subdomain)؟ */
export function sessionMatchesCurrentTenant(user, tenantMeta = null) {
  const current = getAuthScopeSubdomain();
  if (!current) return true;
  if (!user || typeof user !== "object") return false;
  if (isMainSiteOnlyRole(user)) return false;

  const sessionTenant = extractSessionTenantSubdomain(user);
  if (sessionTenant) {
    if (sessionTenant === "default") return current === normalizeTenantSlug(getTenantSubdomain());
    return sessionTenant === current;
  }

  const metaSubdomain = normalizeTenantSlug(tenantMeta?.subdomain);
  if (metaSubdomain) return metaSubdomain === current;

  return false;
}

const LEGACY_PREFIX = "em-auth:";

/** يمسح مفاتيح auth القديمة (em-auth:* وغيرها) — لا يمس user/token الحاليين */
export function purgeLegacyAuthKeys() {
  if (typeof window === "undefined") return;
  try {
    const remove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(LEGACY_PREFIX)) remove.push(key);
    }
    remove.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}
