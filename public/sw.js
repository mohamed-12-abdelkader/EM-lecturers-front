/* eslint-disable no-restricted-globals */
/**
 * Service Worker — PWA installability + Web Push.
 * A fetch handler is required for Chrome's installability criteria.
 */

const DEFAULT_ICON = "/pwa-icon-192.png";

/** Activate immediately so the SW controls the page without a second refresh */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Network passthrough — required for Chrome installability.
 * Does not intercept caching aggressively (push SW stays simple).
 */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // لا تعترض طلبات الـ API حتى لا تُفقد هيدرز Authorization (خصوصًا POST)
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.startsWith("api.") ||
    url.hostname.includes("em-online")
  ) {
    return;
  }
  event.respondWith(fetch(event.request));
});

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
