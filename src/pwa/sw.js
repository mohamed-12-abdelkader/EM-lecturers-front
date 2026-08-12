/* eslint-disable no-restricted-globals */
/**
 * Service Worker (Workbox / injectManifest) — PWA كاملة:
 * - Precache لكل أصول البناء (HTML/JS/CSS/خطوط) → إقلاع فوري وأوفلاين.
 * - مانيفست ديناميكي حسب منصة المدرس (اسم + لوجو) عبر Cache Storage.
 * - Runtime caching للصور والخطوط الخارجية.
 * - صفحة offline.html عند انقطاع الإنترنت أثناء التنقل.
 * - Web Push + النقر على الإشعارات.
 * - التحديثات: تنتظر موافقة المستخدم (SKIP_WAITING) قبل التفعيل.
 */

import { clientsClaim } from "workbox-core";
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  getCacheKeyForURL,
  createHandlerBoundToURL,
} from "workbox-precaching";
import { registerRoute, setCatchHandler, NavigationRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

const DEFAULT_ICON = "/icons/icon-192.png";
const OFFLINE_URL = "/offline.html";
const TENANT_PWA_BRANDING_CACHE = "em-tenant-pwa-branding-v1";
const TENANT_PWA_BRANDING_URL = "/__em_tenant_pwa_branding__.json";

self.__WB_DISABLE_DEV_LOGS = true;

function shortAppName(name, fallback = "منصتي") {
  const raw = String(name || "").trim() || fallback;
  if (raw.length <= 12) return raw;
  return `${raw.slice(0, 11)}…`;
}

function absoluteIcon(url, origin) {
  if (!url) return "";
  const raw = String(url).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  try {
    return new URL(raw.startsWith("/") ? raw : `/${raw}`, origin).href;
  } catch {
    return raw;
  }
}

function buildIcons(iconUrl, origin) {
  if (!iconUrl) {
    return [
      { src: `${origin}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${origin}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${origin}/icons/maskable-192.png`, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: `${origin}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ];
  }
  const abs = absoluteIcon(iconUrl, origin);
  return [
    { src: abs, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: abs, sizes: "512x512", type: "image/png", purpose: "any" },
    { src: abs, sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: abs, sizes: "512x512", type: "image/png", purpose: "maskable" },
  ];
}

async function readTenantPwaBranding() {
  try {
    const cache = await caches.open(TENANT_PWA_BRANDING_CACHE);
    const res = await cache.match(TENANT_PWA_BRANDING_URL);
    if (!res) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function writeTenantPwaBranding(branding) {
  if (!branding) return;
  try {
    const cache = await caches.open(TENANT_PWA_BRANDING_CACHE);
    await cache.put(
      TENANT_PWA_BRANDING_URL,
      new Response(JSON.stringify({ ...branding, updatedAt: Date.now() }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }),
    );
  } catch {
    /* ignore */
  }
}

function buildTenantManifest(branding, origin) {
  const subdomain = branding?.subdomain || "";
  const name =
    String(branding?.name || "").trim() ||
    subdomain.replace(/[-_]+/g, " ") ||
    "منصتي";
  const shortName = shortAppName(branding?.shortName || name);
  const description =
    String(branding?.description || "").trim() ||
    `منصة ${name} التعليمية — كورسات ومحاضرات وامتحانات أونلاين.`;
  const themeColor = branding?.themeColor || "#3182CE";
  const backgroundColor = branding?.backgroundColor || "#ffffff";
  const icons = buildIcons(branding?.iconUrl, origin);

  return {
    id: `${origin}/?pwa=${encodeURIComponent(subdomain || "app")}`,
    name,
    short_name: shortName,
    description,
    lang: "ar",
    dir: "rtl",
    start_url: `${origin}/`,
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
        icons: [{ src: icons[0]?.src || `${origin}/icons/icon-192.png`, sizes: "192x192" }],
      },
      {
        name: "كورساتي",
        short_name: "كورساتي",
        url: `${origin}/my-courses`,
        icons: [{ src: icons[0]?.src || `${origin}/icons/icon-192.png`, sizes: "192x192" }],
      },
    ],
  };
}

async function respondWithTenantManifest(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const branding = await readTenantPwaBranding();
  if (branding?.name || branding?.iconUrl) {
    const manifest = buildTenantManifest(branding, origin);
    return new Response(JSON.stringify(manifest), {
      status: 200,
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  try {
    const network = await fetch(`${origin}/manifest.webmanifest`, { cache: "no-store" });
    if (network.ok) {
      const body = await network.text();
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/manifest+json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
  } catch {
    /* fall through */
  }
  return fetch(request);
}

/* مانيفست ديناميكي أولاً — قبل precache حتى لا يُخدم ملف الشركة الأم */
registerRoute(
  ({ url }) => url.pathname === "/manifest.webmanifest",
  ({ request }) => respondWithTenantManifest(request),
  "GET",
);

/* --------------------------- Precache (البناء) --------------------------- */
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

clientsClaim();

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (data.type === "SET_TENANT_PWA_BRANDING" && data.branding) {
    event.waitUntil(writeTenantPwaBranding(data.branding));
  }
});

/* ---------------------------- Runtime caching ---------------------------- */

function isApiRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/socket.io") ||
    url.hostname.startsWith("api.")
  );
}

registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/socket\.io/],
  }),
);

registerRoute(
  ({ request, url }) => request.destination === "image" && !isApiRequest(url),
  new CacheFirst({
    cacheName: "em-images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 30 * 24 * 3600,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({ cacheName: "em-google-fonts-styles" }),
);
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "em-google-fonts-files",
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 3600 }),
    ],
  }),
);

setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate" || request.destination === "document") {
    const precached = getCacheKeyForURL(OFFLINE_URL);
    if (precached) {
      const cached = await caches.match(precached);
      if (cached) return cached;
    }
    const fallback = await caches.match(OFFLINE_URL);
    if (fallback) return fallback;
  }
  return Response.error();
});

/* ------------------------------- Web Push -------------------------------- */

function parsePushPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    const text = event.data.text();
    try {
      return JSON.parse(text);
    } catch {
      return { body: text };
    }
  }
}

self.addEventListener("push", (event) => {
  const data = parsePushPayload(event);
  const title = data.title || "إشعار جديد";
  const body = data.body || data.message || "";
  const targetUrl = data.url || data.data?.url || "/home";

  const options = {
    body,
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_ICON,
    image: data.image || undefined,
    vibrate: data.vibrate || [180, 80, 180],
    tag: data.tag || `next-edu-${data.id || Date.now()}`,
    renotify: true,
    data: {
      url: targetUrl,
      notificationId: data.id,
      ...data.data,
    },
    actions: Array.isArray(data.actions)
      ? data.actions.slice(0, 2).map((action) => ({
          action: action.action || action.id || "open",
          title: action.title || "فتح",
        }))
      : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/home";
  const targetUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (!client.url.startsWith(self.location.origin)) continue;
          if ("focus" in client) {
            client.focus();
            client.postMessage({ type: "NOTIFICATION_CLICK", url });
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      list.forEach((client) => {
        client.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" });
      });
    }),
  );
});
