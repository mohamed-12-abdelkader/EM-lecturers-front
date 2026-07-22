/**
 * لوجو/أيقونة منصة المدرس — نفس أولوية SEO (favicon ثم صورة البراند).
 */
export function resolveTenantBrandLogo(tenant, teacher) {
  return (
    tenant?.favicon_url ||
    tenant?.icon_url ||
    tenant?.logo_url ||
    tenant?.avatar_url ||
    teacher?.avatar ||
    teacher?.image ||
    null
  );
}

/** يقرأ لوجو المدرس من كاش sessionStorage لـ fetchTenantPublic */
export function readCachedTenantBrandLogo(subdomain) {
  if (!subdomain || typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`tenant-public:${subdomain}`);
    if (!raw) return null;
    const json = JSON.parse(raw);
    return resolveTenantBrandLogo(json?.data?.tenant, json?.data?.teacher);
  } catch {
    return null;
  }
}

const COMPANY_ICON_MARKERS = [
  "em-lectures-icon",
  "pwa-icon",
  "Picsart_25-08-26",
];

/** أيقونة التبويب الحالية إن كانت خاصة بالمدرس (مش لوجو الشركة) */
export function readDocumentTenantIcon() {
  if (typeof document === "undefined") return null;
  const href = document.querySelector('link[rel="icon"]')?.getAttribute("href");
  if (!href) return null;
  if (COMPANY_ICON_MARKERS.some((marker) => href.includes(marker))) return null;
  return href;
}
