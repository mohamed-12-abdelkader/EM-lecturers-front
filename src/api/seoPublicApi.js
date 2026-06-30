/**
 * Global SEO search APIs — Base: /api/seo
 * Used on the main site (no tenant subdomain) for cross-platform discovery.
 */

const defaultOrigin = "http://localhost:8000";

function publicApiOrigin() {
  if (import.meta.env.DEV) return "";
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).replace(/\/$/, "");
  return defaultOrigin;
}

async function fetchSeoJson(path) {
  const base = publicApiOrigin();
  const url = base ? `${base}${path}` : path;
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const err = new Error(json?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/** GET /api/seo/search?q=&specialty=&subject=&grade=&stage= */
export async function fetchGlobalSearch(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== "") qs.set(key, String(value));
  });
  return fetchSeoJson(`/api/seo/search?${qs}`);
}

/** GET /api/seo/search/suggestions?q= */
export async function fetchGlobalSearchSuggestions(q, tenantId) {
  const qs = new URLSearchParams({ q: q || "" });
  if (tenantId) qs.set("tenant_id", String(tenantId));
  return fetchSeoJson(`/api/seo/search/suggestions?${qs}`);
}

/** GET /api/seo/search/trending */
export async function fetchGlobalSearchTrending(tenantId, days = 7) {
  const qs = new URLSearchParams({ days: String(days) });
  if (tenantId) qs.set("tenant_id", String(tenantId));
  return fetchSeoJson(`/api/seo/search/trending?${qs}`);
}

/** GET /api/seo/popular/teachers */
export async function fetchPopularTeachers(limit = 10) {
  return fetchSeoJson(`/api/seo/popular/teachers?limit=${limit}`);
}

/** GET /api/seo/popular/courses */
export async function fetchPopularCourses(limit = 10, tenantId) {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (tenantId) qs.set("tenant_id", String(tenantId));
  return fetchSeoJson(`/api/seo/popular/courses?${qs}`);
}
