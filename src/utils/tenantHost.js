/**
 * يستخرج slug المستأجر من النطاق (مثل mohamed-haredy.localhost).
 * يُرجع null على localhost العادي أو عند غياب نطاق فرعي للمستأجر.
 */
export function getTenantSubdomain() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();

  if (host === "localhost" || host === "127.0.0.1") return null;

  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (!sub || sub === "www") return null;
    return sub;
  }

  const root = (import.meta.env.VITE_TENANT_ROOT_DOMAIN || "").toLowerCase();
  if (root && host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(`.${root}`).length);
    if (!sub || sub === "www") return null;
    return sub;
  }

  return null;
}

/** الرابط العام لمنصة المدرس (subdomain) — يعمل في المتصفح وعلى السيرفر. */
export function buildTenantPublicUrl(subdomain, options = {}) {
  if (!subdomain) return "";
  if (subdomain === "default") {
    if (typeof window !== "undefined") return window.location.origin;
    return options.fallbackOrigin || "";
  }

  const root = String(
    options.rootDomain || import.meta.env.VITE_TENANT_ROOT_DOMAIN || "",
  ).toLowerCase();

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
