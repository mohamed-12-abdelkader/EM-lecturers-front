import baseUrl from "./baseUrl";

const API = "/api/whatsapp";

function authHeaders(token, contentType) {
  const headers = {
    Authorization: token
      ? token.startsWith("Bearer")
        ? token
        : `Bearer ${token}`
      : `Bearer ${localStorage.getItem("token") || ""}`,
    "X-Tenant-Subdomain": "default",
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function getToken() {
  return localStorage.getItem("token") || "";
}

export async function fetchWhatsAppStatus() {
  const { data } = await baseUrl.get(`${API}/status`, {
    headers: authHeaders(getToken()),
  });
  return data?.data || data;
}

export async function fetchWhatsAppSessions() {
  const { data } = await baseUrl.get(`${API}/sessions`, {
    headers: authHeaders(getToken()),
  });
  return data?.data?.sessions || [];
}

export async function createWhatsAppSession(id, label) {
  const { data } = await baseUrl.post(
    `${API}/sessions`,
    { id, label: label || undefined },
    { headers: authHeaders(getToken(), "application/json") },
  );
  return data?.data || data;
}

export async function getWhatsAppSession(id) {
  const { data } = await baseUrl.get(`${API}/sessions/${encodeURIComponent(id)}`, {
    headers: authHeaders(getToken()),
  });
  return data?.data || data;
}

export async function reconnectWhatsAppSession(id) {
  const { data } = await baseUrl.post(
    `${API}/sessions/${encodeURIComponent(id)}/reconnect`,
    {},
    { headers: authHeaders(getToken(), "application/json") },
  );
  return data?.data || data;
}

export async function deleteWhatsAppSession(id) {
  const { data } = await baseUrl.delete(`${API}/sessions/${encodeURIComponent(id)}`, {
    headers: authHeaders(getToken()),
  });
  return data;
}

export async function patchWhatsAppSession(id, payload) {
  const { data } = await baseUrl.patch(
    `${API}/sessions/${encodeURIComponent(id)}`,
    payload,
    { headers: authHeaders(getToken(), "application/json") },
  );
  return data?.data || data;
}

export async function fetchWhatsAppServices() {
  const { data } = await baseUrl.get(`${API}/services`, {
    headers: authHeaders(getToken()),
  });
  return data?.data?.services || [];
}

export async function fetchWhatsAppService(id) {
  const { data } = await baseUrl.get(`${API}/services/${id}`, {
    headers: authHeaders(getToken()),
  });
  return data?.data || data;
}

export async function patchWhatsAppService(id, payload) {
  const { data } = await baseUrl.patch(
    `${API}/services/${id}`,
    payload,
    { headers: authHeaders(getToken(), "application/json") },
  );
  return data?.data || data;
}

export async function putWhatsAppServiceSessions(id, sessions) {
  const { data } = await baseUrl.put(
    `${API}/services/${id}/sessions`,
    { sessions },
    { headers: authHeaders(getToken(), "application/json") },
  );
  return data?.data || data;
}

export async function fetchWhatsAppConversations(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  if (params.service_id) query.set("service_id", String(params.service_id));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  const { data } = await baseUrl.get(`${API}/conversations${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(getToken()),
  });
  return data?.data || { conversations: [], total: 0 };
}

export async function fetchWhatsAppQueueStats() {
  const { data } = await baseUrl.get(`${API}/queue/stats`, {
    headers: authHeaders(getToken()),
  });
  return data?.data || {};
}

export async function sendWhatsAppTestMessage({ service_key, to, body }) {
  const { data } = await baseUrl.post(
    `${API}/messages/send`,
    { service_key, to, body },
    { headers: authHeaders(getToken(), "application/json") },
  );
  return data;
}
