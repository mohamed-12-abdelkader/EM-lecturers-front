import { getApiOrigin } from "./apiConfig";

async function fetchPublicJson(path, { cacheKey } = {}) {
  const base = getApiOrigin();
  const url = base ? `${base}${path}` : path;
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (res.status === 304 && cacheKey) {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore cache parse errors and continue to error below
    }
  }

  const json = await res.json().catch(() => ({}));
  if (json && json.success === false) {
    const err = new Error(json?.message || "فشل تحميل البيانات");
    err.status = res.status;
    err.body = json;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(json?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  if (cacheKey) {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(json));
    } catch {
      // ignore storage quota/availability issues
    }
  }
  return json;
}

/**
 * GET /api/tenants/public/:subdomain — بيانات الصفحة العامة للمدرس (بدون توكن).
 */
export async function fetchTenantPublic(subdomain) {
  return fetchPublicJson(`/api/tenants/public/${encodeURIComponent(subdomain)}`, {
    cacheKey: `tenant-public:${subdomain}`,
  });
}

/** GET /api/tenants/public/:subdomain/seo — SEO bundle كامل */
export async function fetchTenantSeoBundle(subdomain) {
  return fetchPublicJson(`/api/tenants/public/${encodeURIComponent(subdomain)}/seo`, {
    cacheKey: `tenant-seo:${subdomain}`,
  });
}

/**
 * GET /api/tenants/public/:subdomain/seo/metadata?page=home|teacher|course|courses&slug=
 * Dynamic metadata per page (title, OG, Twitter, JSON-LD).
 */
export async function fetchTenantPageMetadata(subdomain, page = "home", slug) {
  const qs = new URLSearchParams({ page });
  if (slug) qs.set("slug", slug);
  return fetchPublicJson(
    `/api/tenants/public/${encodeURIComponent(subdomain)}/seo/metadata?${qs}`,
    { cacheKey: `tenant-meta:${subdomain}:${page}:${slug || ""}` },
  );
}

/** GET /api/tenants/public/:subdomain/teacher — صفحة المدرس العامة */
export async function fetchTenantTeacherPage(subdomain) {
  return fetchPublicJson(`/api/tenants/public/${encodeURIComponent(subdomain)}/teacher`, {
    cacheKey: `tenant-teacher:${subdomain}`,
  });
}

/** GET /api/tenants/public/:subdomain/course/:slug */
export async function fetchTenantCoursePage(subdomain, slug) {
  return fetchPublicJson(
    `/api/tenants/public/${encodeURIComponent(subdomain)}/course/${encodeURIComponent(slug)}`,
    { cacheKey: `tenant-course:${subdomain}:${slug}` },
  );
}

/** GET /api/tenants/public/:subdomain/search?q= */
export async function fetchTenantSearch(subdomain, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== "") qs.set(key, String(value));
  });
  return fetchPublicJson(
    `/api/tenants/public/${encodeURIComponent(subdomain)}/search?${qs}`,
  );
}

/** GET /api/tenants/public/:subdomain/grades */
export async function fetchTenantGrades(subdomain) {
  return fetchPublicJson(`/api/tenants/public/${encodeURIComponent(subdomain)}/grades`, {
    cacheKey: `tenant-grades:${subdomain}`,
  });
}

/** GET /api/tenants/public/:subdomain/courses */
export async function fetchTenantPublicCourses(subdomain, gradeId) {
  const qs = gradeId ? `?grade_id=${Number(gradeId)}` : "";
  return fetchPublicJson(
    `/api/tenants/public/${encodeURIComponent(subdomain)}/courses${qs}`,
    { cacheKey: `tenant-courses:${subdomain}:${gradeId || "all"}` },
  );
}

/**
 * GET /api/public/platform/:subdomain/free-lectures — المحاضرات المجانية المنشورة.
 */
export async function fetchPlatformPublicFreeLectures(subdomain) {
  return fetchPublicJson(
    `/api/public/platform/${encodeURIComponent(subdomain)}/free-lectures`,
    { cacheKey: `platform-free-lectures:${subdomain}` },
  );
}

/**
 * GET /api/public/platform/:subdomain/courses — كورسات المنصة العامة.
 */
export async function fetchPlatformPublicCourses(subdomain, gradeId) {
  const qs = gradeId ? `?grade_id=${Number(gradeId)}` : "";
  return fetchPublicJson(
    `/api/public/platform/${encodeURIComponent(subdomain)}/courses${qs}`,
    { cacheKey: `platform-courses:${subdomain}:${gradeId || "all"}` },
  );
}
