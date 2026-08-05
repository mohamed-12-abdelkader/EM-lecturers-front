/**
 * PWA manifest ديناميكي حسب منصة المدرس (الاسم + اللوجو).
 * كل subdomain أصل (origin) منفصل → يمكن تثبيت أكثر من مدرس كتطبيقات مستقلة.
 */
import { getTenantSubdomain } from "./tenantHost";
import { resolveTenantBrandLogo } from "./tenantBrandLogo";
import { readCachedTenantPublic } from "../api/tenantPublicApi";

const MANIFEST_LINK_ATTR = "data-tenant-pwa-manifest";
const DEFAULT_ICONS = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

let activeBlobUrl = null;
let lastSignature = "";
const iconBlobCache = new Map();

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

function shortAppName(name, fallback = "منصتي") {
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
  document
    .querySelectorAll('link[rel="apple-touch-icon"]')
    .forEach((el) => {
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

/** يرسم اللوجو داخل مربع ثابت لتوافق متطلبات أيقونات PWA */
async function rasterizeIcon(src, size) {
  const cacheKey = `${src}::${size}`;
  if (iconBlobCache.has(cacheKey)) return iconBlobCache.get(cacheKey);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        const pad = Math.round(size * 0.1);
        const box = size - pad * 2;
        const scale = Math.min(box / img.width, box / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(absoluteUrl(src));
              return;
            }
            const url = URL.createObjectURL(blob);
            iconBlobCache.set(cacheKey, url);
            resolve(url);
          },
          "image/png",
          0.92,
        );
      } catch {
        resolve(absoluteUrl(src));
      }
    };
    img.onerror = () => resolve(absoluteUrl(src));
    img.src = absoluteUrl(src);
  });
}

async function buildIconEntries(iconUrl) {
  if (!iconUrl) return DEFAULT_ICONS;
  const abs = absoluteUrl(iconUrl);
  // أيقونات HTTPS المباشرة أدوم عند التثبيت من blob: بعد revoke
  const sameOrigin = abs.startsWith(window.location.origin);
  if (!sameOrigin) {
    return [
      { src: abs, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: abs, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: abs, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: abs, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ];
  }
  try {
    const [icon192, icon512] = await Promise.all([
      rasterizeIcon(iconUrl, 192),
      rasterizeIcon(iconUrl, 512),
    ]);
    return [
      { src: icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: icon192, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: icon512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ];
  } catch {
    return [
      { src: abs, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: abs, sizes: "512x512", type: "image/png", purpose: "any" },
    ];
  }
}

function setManifestHref(href) {
  let link =
    document.querySelector(`link[rel="manifest"][${MANIFEST_LINK_ATTR}]`) ||
    document.querySelector('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  link.setAttribute(MANIFEST_LINK_ATTR, "true");
  link.href = href;
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
  const origin = window.location.origin;
  const startUrl = `${origin}/`;

  const signature = [subdomain, name, shortName, iconUrl || "", themeColor].join("|");
  if (signature === lastSignature) return;
  lastSignature = signature;

  const icons = await buildIconEntries(iconUrl);

  const manifest = {
    // id فريد لكل منصة → تثبيت مستقل حتى لو تشابهت الإعدادات
    id: `${origin}/?pwa=${encodeURIComponent(subdomain)}`,
    name,
    short_name: shortName,
    description,
    lang: "ar",
    dir: "rtl",
    start_url: startUrl,
    scope: `${origin}/`,
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
        url: `${origin}/home`,
        icons: [{ src: icons[0]?.src || "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "كورساتي",
        short_name: "كورساتي",
        url: `${origin}/my-courses`,
        icons: [{ src: icons[0]?.src || "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };

  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/manifest+json",
  });
  if (activeBlobUrl) {
    try {
      URL.revokeObjectURL(activeBlobUrl);
    } catch {
      /* ignore */
    }
  }
  activeBlobUrl = URL.createObjectURL(blob);
  setManifestHref(activeBlobUrl);

  upsertMeta("application-name", name);
  upsertMeta("apple-mobile-web-app-title", String(name).slice(0, 40));
  upsertMeta("theme-color", themeColor);
  if (iconUrl) {
    const absIcon = absoluteUrl(iconUrl);
    upsertAppleTouchIcon(icons[0]?.src || absIcon);
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
