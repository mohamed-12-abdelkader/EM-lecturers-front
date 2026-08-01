/* eslint-disable no-restricted-globals */
/**
 * Service Worker (Workbox / injectManifest) — PWA كاملة:
 * - Precache لكل أصول البناء (HTML/JS/CSS/خطوط) → إقلاع فوري وأوفلاين.
 * - Runtime caching للصور والخطوط الخارجية.
 * - صفحة offline.html عند انقطاع الإنترنت أثناء التنقل.
 * - Web Push + النقر على الإشعارات (منطق موجود مسبقاً — لا تغيير).
 * - التحديثات: لا skipWaiting تلقائي — ينتظر موافقة المستخدم (رسالة SKIP_WAITING).
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

self.__WB_DISABLE_DEV_LOGS = true;

/* --------------------------- Precache (البناء) --------------------------- */
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

/** التحديث بموافقة المستخدم — UpdatePrompt يرسل SKIP_WAITING عند ضغط "تحديث" */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
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

// التنقل بين الصفحات: App Shell من الـ precache — فتح فوري ويعمل أوفلاين بالكامل
// (التحديثات تصل عبر نافذة "يتوفر إصدار جديد")
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/socket\.io/],
  }),
);

// الصور (نفس الأصل + التخزين الخارجي غير API)
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

// خطوط جوجل: stylesheets متجددة + ملفات الخط CacheFirst طويلة الأمد
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

// ملاحظة: طلبات /api لا تُعترض إطلاقاً — تمر مباشرة بهيدرز Authorization والكوكيز

// أي فشل تنقل غير معالج → صفحة الأوفلاين
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
