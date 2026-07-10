import baseUrl from "./baseUrl";
import { buildTenantPublicUrl } from "../utils/tenantHost";

const ADMIN_TENANTS_API = "/api/admin/tenants";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function adminHeaders(token, contentType) {
  const headers = {
    ...authHeaders(token),
    "X-Tenant-Subdomain": "default",
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

/**
 * @param {{
 *   limit?: number,
 *   offset?: number,
 *   search?: string,
 *   is_active?: boolean | "",
 *   include_default?: boolean,
 *   include_deleted?: boolean,
 * }} params
 * @param {string} token
 */
export async function fetchAdminTenants(params = {}, token) {
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(params.limit) || DEFAULT_LIMIT),
  );
  const offset = Math.max(0, Number(params.offset) || 0);

  const query = new URLSearchParams();
  query.set("limit", String(limit));
  query.set("offset", String(offset));

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.is_active === true || params.is_active === false) {
    query.set("is_active", String(params.is_active));
  }
  if (params.include_default) {
    query.set("include_default", "true");
  }
  if (params.include_deleted) {
    query.set("include_deleted", "true");
  }

  const { data } = await baseUrl.get(`${ADMIN_TENANTS_API}?${query}`, {
    headers: adminHeaders(token),
  });

  if (!data?.success) {
    const err = new Error(data?.message || "فشل تحميل المنصات");
    err.response = { data };
    throw err;
  }

  const payload = data.data || {};
  return {
    tenants: Array.isArray(payload.tenants) ? payload.tenants : [],
    total: Number(payload.total) || 0,
    limit: Number(payload.limit) || limit,
    offset: Number(payload.offset) || offset,
  };
}

/**
 * @param {number|string} tenantId
 * @param {string} token
 */
export async function fetchAdminTenantById(tenantId, token) {
  const id = Number(tenantId);
  if (!id) return null;

  const { data } = await baseUrl.get(`${ADMIN_TENANTS_API}/${id}`, {
    headers: adminHeaders(token),
  });

  if (!data?.success) {
    const err = new Error(data?.message || "فشل تحميل بيانات المنصة");
    err.response = { data };
    throw err;
  }

  return data.data ?? null;
}

/**
 * PATCH /api/admin/tenants/:id — JSON
 * @param {number|string} tenantId
 * @param {object} payload
 * @param {string} token
 */
export async function patchAdminTenant(tenantId, payload, token) {
  const { data } = await baseUrl.patch(
    `${ADMIN_TENANTS_API}/${Number(tenantId)}`,
    payload,
    { headers: adminHeaders(token, "application/json") },
  );

  if (!data?.success) {
    const err = new Error(data?.message || "فشل تحديث المنصة");
    err.response = { data };
    throw err;
  }

  return data;
}

/**
 * PATCH /api/admin/tenants/:id — multipart (صور + حقول نصية + landing/settings/owner كـ JSON)
 * @param {number|string} tenantId
 * @param {FormData} formData
 * @param {string} token
 */
export async function patchAdminTenantMultipart(tenantId, formData, token) {
  const { data } = await baseUrl.patch(
    `${ADMIN_TENANTS_API}/${Number(tenantId)}`,
    formData,
    { headers: adminHeaders(token) },
  );

  if (!data?.success) {
    const err = new Error(data?.message || "فشل تحديث المنصة");
    err.response = { data };
    throw err;
  }

  return data;
}

/**
 * DELETE /api/admin/tenants/:id
 * Auth: أدمن على tenant default — يتطلب تأكيد الـ subdomain
 * @param {number|string} tenantId
 * @param {{ confirm_subdomain: string }} options
 * @param {string} token
 */
export async function deleteAdminTenant(tenantId, { confirm_subdomain } = {}, token) {
  const id = Number(tenantId);
  if (!id) {
    throw new Error("معرّف المنصة غير صالح");
  }

  const subdomain = String(confirm_subdomain || "").trim();
  const config = {
    headers: adminHeaders(token, "application/json"),
  };

  if (subdomain) {
    config.data = { confirm_subdomain: subdomain };
  }

  const { data } = await baseUrl.delete(`${ADMIN_TENANTS_API}/${id}`, config);

  if (!data?.success) {
    const err = new Error(data?.message || "فشل حذف المنصة");
    err.response = { data };
    throw err;
  }

  return data;
}

export function isDefaultTenant(tenant) {
  if (!tenant) return false;
  if (tenant.is_default === true) return true;
  return String(tenant.subdomain || "").toLowerCase() === "default";
}

export function isDeletedTenant(tenant) {
  if (!tenant) return false;
  if (tenant.is_deleted === true || tenant.deleted_at) return true;
  const subdomain = String(tenant.subdomain || "");
  return /^deleted-\d+-/i.test(subdomain);
}

export function getTenantPlatformUrl(subdomain) {
  if (typeof window === "undefined" || !subdomain) return "#";
  return buildTenantPublicUrl(subdomain) || "#";
}
