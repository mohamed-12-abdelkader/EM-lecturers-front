import baseUrl from "./baseUrl";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchVapidPublicKey() {
  const res = await baseUrl.get("/api/notifications/vapid-public-key", {
    headers: { "Cache-Control": "no-cache" },
  });
  const data = res.data ?? {};
  return data.publicKey || data.public_key || "";
}

export async function pushSubscribe(payload) {
  const token = localStorage.getItem("token");
  if (!token) {
    const error = new Error("يجب تسجيل الدخول لحفظ اشتراك الإشعارات");
    error.code = "NO_AUTH";
    throw error;
  }

  const res = await baseUrl.post("/api/notifications/push-subscribe", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchPushSubscriptions() {
  const res = await baseUrl.get("/api/notifications/push-subscriptions", {
    headers: authHeaders(),
  });
  return res.data?.subscriptions || res.data || [];
}

export async function deactivatePushSubscription(subscriptionId) {
  const res = await baseUrl.delete(
    `/api/notifications/push-subscribe/${subscriptionId}`,
    { headers: authHeaders() },
  );
  return res.data;
}

export async function fetchNotifications({ limit, offset, usePagination = false } = {}) {
  const config = { headers: authHeaders() };

  if (usePagination && (limit != null || offset != null)) {
    config.params = {};
    if (limit != null) config.params.limit = limit;
    if (offset != null) config.params.offset = offset;
  }

  const res = await baseUrl.get("/api/notifications/", config);
  return res.data;
}

export async function fetchUnreadNotifications({ limit = 20, offset = 0 } = {}) {
  const res = await baseUrl.get("/api/notifications/unread", {
    params: { limit, offset },
    headers: authHeaders(),
  });
  return res.data;
}

export async function fetchUnreadCount() {
  const res = await baseUrl.get("/api/notifications/unread-count", {
    headers: authHeaders(),
  });
  return (
    res.data?.count ??
    res.data?.unread_count ??
    res.data?.unreadCount ??
    0
  );
}

export async function markNotificationRead(id) {
  const res = await baseUrl.put(
    `/api/notifications/${id}/read`,
    {},
    { headers: authHeaders() },
  );
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await baseUrl.put("/api/notifications/read-all", {}, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function deleteNotification(id) {
  const res = await baseUrl.delete(`/api/notifications/${id}`, {
    headers: authHeaders(),
  });
  return res.data;
}
