/**
 * PWA manifest ديناميكي حسب منصة المدرس (الاسم + اللوجو).
 *
 * مهم: Chrome Android يتجاهل غالباً blob: manifests عند التثبيت ويستخدم
 * /manifest.webmanifest الأصلي. لذلك نكتب الهوية في Cache Storage والـ SW
 * يعيد المانيفست من نفس الأصل.
 */
import { getTenantSubdomain } from "./tenantHost";
import { resolveTenantBrandLogo } from "./tenantBrandLogo";
import { readCachedTenantPublic } from "../api/tenantPublicApi";

export const TENANT_PWA_BRANDING_CACHE = "em-tenant-pwa-branding-v1";
export const TENANT_PWA_BRANDING_URL = "/__em_tenant_pwa_branding__.json";
export const TENANT_MANIFEST_PATH = "/manifest.webmanifest";

const DEFAULT_ICONS = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

let lastSignature = "";

function absoluteUrl(url) {
  if (!url) return "";
  const raw = String(url).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }
  try {
    return new URL(raw.startsWith("/") ? raw : `/${raw}`, window.location.origin).href;
  } catch {
    return raw;
  }
}

export function shortAppName(name, fallback = "منصتي") {
  const raw = String(name || "").trim() || fallback;
  if (raw.length <= 12) return raw;
  return `${raw.slice(0, 11)}…`;
}

function upsertMeta(name, content) {
  if (!content) return;
  let node = document.querySelector(`meta[name="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("name", name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function upsertAppleTouchIcon(href) {
  if (!href) return;
  document.querySelectorAll('link[rel="apple-touch-icon"]').forEach((el) => {
    el.href = href;
  });
  let link = document.querySelector('link[rel="apple-touch-icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "apple-touch-icon";
    document.head.appendChild(link);
  }
  link.href = href;
}

function buildIconEntries(iconUrl) {
  if (!iconUrl) return DEFAULT_ICONS;
  const abs = absoluteUrl(iconUrl);
  return [
    { src: abs, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: abs, sizes: "512x512", type: "image/png", purpose: "any" },
    { src: abs, sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: abs, sizes: "512x512", type: "image/png", purpose: "maskable" },
  ];
}

/** يبني كائن المانيفست النهائي للتثبيت */
export function buildTenantManifestObject(branding = {}, origin = "") {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const subdomain = branding.subdomain || "";
  const name =
    String(branding.name || "").trim() ||
    subdomain.replace(/[-_]+/g, " ") ||
    "منصتي";
  const shortName = shortAppName(branding.shortName || name);
  const description =
    String(branding.description || "").trim() ||
    `منصة ${name} التعليمية — كورسات ومحاضرات وامتحانات أونلاين.`;
  const themeColor = branding.themeColor || "#3182CE";
  const backgroundColor = branding.backgroundColor || "#ffffff";
  const icons = buildIconEntries(branding.iconUrl);
  const startUrl = `${base}/`;

  return {
    id: `${base}/?pwa=${encodeURIComponent(subdomain || "app")}`,
    name,
    short_name: shortName,
    description,
    lang: "ar",
    dir: "rtl",
    start_url: startUrl,
    scope: `${base}/`,
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: backgroundColor,
    theme_color: themeColor,
    categories: ["education", "productivity"],
    icons,
    shortcuts: [
      {
        name: "الصفحة الرئيسية",
        short_name: "الرئيسية",
        url: `${base}/home`,
        icons: [{ src: icons[0]?.src || "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "كورساتي",
        short_name: "كورساتي",
        url: `${base}/my-courses`,
        icons: [{ src: icons[0]?.src || "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}

async function persistBranding(branding) {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(TENANT_PWA_BRANDING_CACHE);
    const body = JSON.stringify({
      ...branding,
      updatedAt: Date.now(),
    });
    await cache.put(
      new Request(TENANT_PWA_BRANDING_URL, { method: "GET" }),
      new Response(body, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }

  try {
    const reg = await navigator.serviceWorker?.ready;
    reg?.active?.postMessage({
      type: "SET_TENANT_PWA_BRANDING",
      branding,
    });
  } catch {
    /* ignore */
  }
}

function setManifestHref(subdomain, signature) {
  const qs = new URLSearchParams({
    tenant: subdomain || "app",
    v: signature.slice(0, 24),
  });
  const href = `${TENANT_MANIFEST_PATH}?${qs.toString()}`;

  // إعادة إنشاء الرابط يجبر Chromium على إعادة جلب المانيفست قبل التثبيت
  document.querySelectorAll('link[rel="manifest"]').forEach((el) => el.remove());
  const link = document.createElement("link");
  link.rel = "manifest";
  link.href = href;
  link.setAttribute("data-tenant-pwa-manifest", "true");
  document.head.appendChild(link);
}

/**
 * @param {{
 *   subdomain?: string,
 *   name?: string,
 *   shortName?: string,
 *   description?: string,
 *   iconUrl?: string,
 *   themeColor?: string,
 *   backgroundColor?: string,
 * }} branding
 */
export async function applyTenantPwaManifest(branding = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const subdomain = branding.subdomain || getTenantSubdomain();
  if (!subdomain) return;

  const name =
    String(branding.name || "").trim() ||
    subdomain.replace(/[-_]+/g, " ");
  const shortName = shortAppName(branding.shortName || name);
  const description =
    String(branding.description || "").trim() ||
    `منصة ${name} التعليمية — كورسات ومحاضرات وامتحانات أونلاين.`;
  const themeColor = branding.themeColor || "#3182CE";
  const backgroundColor = branding.backgroundColor || "#ffffff";
  const iconUrl = branding.iconUrl || null;

  const payload = {
    subdomain,
    name,
    shortName,
    description,
    iconUrl,
    themeColor,
    backgroundColor,
  };

  const signature = [subdomain, name, shortName, iconUrl || "", themeColor].join("|");
  if (signature === lastSignature) return;
  lastSignature = signature;

  await persistBranding(payload);
  setManifestHref(subdomain, signature.replace(/\|/g, "-"));

  upsertMeta("application-name", name);
  upsertMeta("apple-mobile-web-app-title", String(name).slice(0, 40));
  upsertMeta("theme-color", themeColor);
  if (iconUrl) {
    const absIcon = absoluteUrl(iconUrl);
    upsertAppleTouchIcon(absIcon);
    const fav = document.querySelector('link[rel="icon"]');
    if (fav) fav.href = absIcon;
  }

  try {
    window.dispatchEvent(
      new CustomEvent("pwa:tenant-manifest-ready", {
        detail: { subdomain, name, shortName, iconUrl },
      }),
    );
  } catch {
    /* ignore */
  }
}

export function resolveTenantPwaBranding(tenant, teacher, subdomain) {
  const name =
    tenant?.display_name ||
    tenant?.name ||
    teacher?.name ||
    subdomain?.replace(/[-_]+/g, " ") ||
    "منصتي";
  const iconUrl = resolveTenantBrandLogo(tenant, teacher);
  const themeColor =
    tenant?.primary_color ||
    tenant?.theme?.primary_color ||
    "#3182CE";
  const description =
    tenant?.bio ||
    teacher?.description ||
    `منصة ${name} التعليمية`;
  return {
    subdomain,
    name,
    shortName: shortAppName(name),
    description: String(description).slice(0, 180),
    iconUrl,
    themeColor,
  };
}

/** يطبّق المانيفست من كاش الجلسة إن وُجد */
export function applyTenantPwaManifestFromCache(subdomain = getTenantSubdomain()) {
  if (!subdomain) return Promise.resolve(false);
  const cached = readCachedTenantPublic(subdomain);
  const tenant = cached?.data?.tenant;
  if (!tenant) return Promise.resolve(false);
  const branding = resolveTenantPwaBranding(
    tenant,
    cached?.data?.teacher,
    subdomain,
  );
  return applyTenantPwaManifest(branding).then(() => true);
}

export function readCachedTenantPwaName(subdomain = getTenantSubdomain()) {
  if (!subdomain) return null;
  const cached = readCachedTenantPublic(subdomain);
  const tenant = cached?.data?.tenant;
  const teacher = cached?.data?.teacher;
  if (!tenant && !teacher) return null;
  return (
    tenant?.display_name ||
    tenant?.name ||
    teacher?.name ||
    subdomain.replace(/[-_]+/g, " ")
  );
}
