/**
 * يستخرج slug المستأجر من النطاق (مثل mohamed-haredy.localhost أو omar-mohamed.emlectures.com).
 * يُرجع null على localhost العادي أو عند غياب نطاق فرعي للمستأجر.
 */

import { safeSessionGet, safeSessionSet } from "./safeStorage";

const RESERVED_SUBDOMAINS = new Set(["www", "api", "stream", "admin", "app", "cdn"]);

/** نطاقات جذر معروفة — احتياطي إذا لم تُحقَن من env عند البناء */
const FALLBACK_TENANT_ROOTS = ["em-online.online", "emlectures.com"];

const TENANT_SESSION_KEY = "em-tenant-subdomain";
const TENANT_QUERY_KEYS = ["tenant", "platform", "subdomain"];

function parseRootDomains(rootDomain) {
  const fromEnv = String(rootDomain || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...fromEnv, ...FALLBACK_TENANT_ROOTS])];
}

export function normalizeTenantSlug(value) {
  if (value == null) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;
  // اقبل روابط كاملة بالغلط: https://mo-adbo.em-online.online/login
  try {
    if (/^https?:\/\//i.test(raw)) {
      const host = new URL(raw).hostname.toLowerCase();
      return (
        parseSubdomainFromHost(host, import.meta.env.VITE_TENANT_ROOT_DOMAIN) ||
        null
      );
    }
  } catch {
    /* ignore */
  }
  const slug = raw
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .split("?")[0]
    .split(".")[0]
    .replace(/[^a-z0-9-]/g, "");
  if (!slug || RESERVED_SUBDOMAINS.has(slug)) return null;
  return slug;
}

function parseSubdomainFromHost(hostname, rootDomain) {
  const host = String(hostname || "").toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;

  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (!sub || RESERVED_SUBDOMAINS.has(sub) || sub.includes(".")) return null;
    return sub;
  }

  const roots = parseRootDomains(rootDomain);

  for (const root of roots) {
    if (host === root || host.endsWith(`.${root}`)) {
      const sub = host === root ? "" : host.slice(0, -(`.${root}`).length);
      if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
      // رفض subdomain متداخل مثل a.b.emlectures.com
      if (sub.includes(".")) return null;
      return sub;
    }
  }

  return null;
}

export function getTenantSubdomainFromHost(hostname = typeof window !== "undefined" ? window.location.hostname : "") {
  return parseSubdomainFromHost(
    hostname,
    import.meta.env.VITE_TENANT_ROOT_DOMAIN,
  );
}

/** @deprecated استخدم getCurrentTenant — للتوافق فقط */
export function getTenantSubdomain() {
  if (typeof window === "undefined") return null;
  return getTenantSubdomainFromHost(window.location.hostname);
}

/**
 * Tenant الحالي من الـ hostname فقط (مرجع مركزي للعزل).
 * mr-nofal.em-online.online → "mr-nofal"
 */
export function getCurrentTenant() {
  return getTenantSubdomain();
}

export function persistTenantSubdomain(subdomain) {
  const slug = normalizeTenantSlug(subdomain);
  if (!slug) return null;
  safeSessionSet(TENANT_SESSION_KEY, slug);
  return slug;
}

export function readPersistedTenantSubdomain() {
  return normalizeTenantSlug(safeSessionGet(TENANT_SESSION_KEY, ""));
}

export function readTenantFromSearchParams(search = typeof window !== "undefined" ? window.location.search : "") {
  try {
    const params = new URLSearchParams(search || "");
    for (const key of TENANT_QUERY_KEYS) {
      const slug = normalizeTenantSlug(params.get(key));
      if (slug) return slug;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * يحلّ هوية المنصة بترتيب: hostname → ?tenant= → sessionStorage
 * مهم عند مشاركة روابط login/signup بدون ما يضيع السياق.
 */
export function resolveTenantSubdomain() {
  if (typeof window === "undefined") return null;

  const fromHost = getTenantSubdomain();
  if (fromHost) {
    persistTenantSubdomain(fromHost);
    return fromHost;
  }

  const fromQuery = readTenantFromSearchParams();
  if (fromQuery) {
    persistTenantSubdomain(fromQuery);
    return fromQuery;
  }

  return readPersistedTenantSubdomain();
}

/**
 * سياق المنصة لتسجيل الدخول فقط.
 * على localhost العادي بدون ?tenant= لا نرسل subdomain من session قديم
 * (كان يسبب 400 رغم صحة البيانات).
 */
export function resolveLoginTenantSubdomain() {
  if (typeof window === "undefined") return null;

  const fromHost = getTenantSubdomain();
  if (fromHost) return fromHost;

  const fromQuery = readTenantFromSearchParams();
  if (fromQuery) return fromQuery;

  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  return readPersistedTenantSubdomain();
}

/**
 * على صفحات auth: لو في tenant بالـ query والنطاق الحالي مش subdomain،
 * حوّل لرابط المنصة الصحيح عشان المشاركة تفضل شغّالة.
 * @returns {string|null} subdomain بعد الحل (أو null)
 */
export function ensureTenantAuthContext() {
  if (typeof window === "undefined") return null;

  const fromHost = getTenantSubdomain();
  if (fromHost) {
    persistTenantSubdomain(fromHost);
    return fromHost;
  }

  const fromQuery = readTenantFromSearchParams();
  const host = window.location.hostname.toLowerCase();
  const isBareLocalhost = host === "localhost" || host === "127.0.0.1";

  const slug =
    fromQuery || (!isBareLocalhost ? readPersistedTenantSubdomain() : null);
  if (!slug) return null;

  persistTenantSubdomain(slug);

  const targetBase = buildTenantPublicUrl(slug);
  if (!targetBase) return slug;

  try {
    const targetOrigin = new URL(targetBase).origin;
    if (targetOrigin !== window.location.origin) {
      const next = new URL(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
        targetBase,
      );
      TENANT_QUERY_KEYS.forEach((k) => next.searchParams.delete(k));
      window.location.replace(next.toString());
      return slug;
    }
  } catch {
    /* ignore redirect errors */
  }

  return slug;
}

/** أضف ?tenant= للمسارات عند الحاجة (مشاركة من نطاق بدون subdomain) */
export function withTenantQuery(path, subdomain = resolveTenantSubdomain()) {
  const slug = normalizeTenantSlug(subdomain);
  if (!slug || !path) return path || "/";
  if (getTenantSubdomain()) return path; // على نطاق المدرس مش محتاجين query

  try {
    const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://local");
    if (!TENANT_QUERY_KEYS.some((k) => url.searchParams.get(k))) {
      url.searchParams.set("tenant", slug);
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const join = path.includes("?") ? "&" : "?";
    return `${path}${join}tenant=${encodeURIComponent(slug)}`;
  }
}

/** الرابط العام لمنصة المدرس (subdomain) — يعمل في المتصفح وعلى السيرفر. */
export function buildTenantPublicUrl(subdomain, options = {}) {
  if (!subdomain) return "";
  if (subdomain === "default") {
    if (typeof window !== "undefined") return window.location.origin;
    return options.fallbackOrigin || "";
  }

  const slug = normalizeTenantSlug(subdomain) || String(subdomain).trim().toLowerCase();
  if (!slug) return "";

  const root =
    String(options.rootDomain || "").toLowerCase() ||
    parseRootDomains(import.meta.env.VITE_TENANT_ROOT_DOMAIN)[0] ||
    "";

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : "";

    if (import.meta.env.DEV) {
      return `${protocol}//${slug}.localhost${port}`;
    }
    if (root) {
      return `${protocol}//${slug}.${root}`;
    }
    return `${protocol}//${slug}.${window.location.hostname}${port}`;
  }

  const protocol = options.protocol || "https:";
  const port = options.port ? `:${options.port}` : "";
  if (root) return `${protocol}//${slug}.${root}`;
  return `http://${slug}.localhost${port || ":3000"}`;
}

/** رابط تسجيل دخول ثابت قابل للمشاركة */
export function buildTenantAuthUrl(subdomain, path = "/login") {
  const base = buildTenantPublicUrl(subdomain);
  if (!base) {
    return withTenantQuery(path, subdomain);
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalizedPath}`;
}
