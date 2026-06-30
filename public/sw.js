/* eslint-disable no-restricted-globals */
/**
 * Web Push Service Worker — handles background notifications and click navigation.
 */

const DEFAULT_ICON = "/next%20logo.png";

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
