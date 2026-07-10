/**
 * يستخرج slug المستأجر من النطاق (مثل mohamed-haredy.localhost أو omar-mohamed.emlectures.com).
 * يُرجع null على localhost العادي أو عند غياب نطاق فرعي للمستأجر.
 */

const RESERVED_SUBDOMAINS = new Set(["www", "api", "stream", "admin", "app", "cdn"]);

/** نطاقات جذر معروفة — احتياطي إذا لم تُحقَن من env عند البناء */
const FALLBACK_TENANT_ROOTS = ["em-online.online", "emlectures.com"];

function parseRootDomains(rootDomain) {
  const fromEnv = String(rootDomain || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...fromEnv, ...FALLBACK_TENANT_ROOTS])];
}

function parseSubdomainFromHost(hostname, rootDomain) {
  const host = String(hostname || "").toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;

  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  const roots = parseRootDomains(rootDomain);

  for (const root of roots) {
    if (host === root || host.endsWith(`.${root}`)) {
      const sub = host === root ? "" : host.slice(0, -(`.${root}`).length);
      if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
      return sub;
    }
  }

  return null;
}

export function getTenantSubdomain() {
  if (typeof window === "undefined") return null;
  return parseSubdomainFromHost(
    window.location.hostname,
    import.meta.env.VITE_TENANT_ROOT_DOMAIN,
  );
}

/** الرابط العام لمنصة المدرس (subdomain) — يعمل في المتصفح وعلى السيرفر. */
export function buildTenantPublicUrl(subdomain, options = {}) {
  if (!subdomain) return "";
  if (subdomain === "default") {
    if (typeof window !== "undefined") return window.location.origin;
    return options.fallbackOrigin || "";
  }

  const root =
    String(options.rootDomain || "").toLowerCase() ||
    parseRootDomains(import.meta.env.VITE_TENANT_ROOT_DOMAIN)[0] ||
    "";

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : "";

    if (import.meta.env.DEV) {
      return `${protocol}//${subdomain}.localhost${port}`;
    }
    if (root) {
      return `${protocol}//${subdomain}.${root}`;
    }
    return `${protocol}//${subdomain}.${window.location.hostname}${port}`;
  }

  const protocol = options.protocol || "https:";
  const port = options.port ? `:${options.port}` : "";
  if (root) return `${protocol}//${subdomain}.${root}`;
  return `http://${subdomain}.localhost${port || ":3000"}`;
}
