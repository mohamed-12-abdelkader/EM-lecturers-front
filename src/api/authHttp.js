/**
 * عميل HTTP خاص بالمصادقة — بدون interceptors للتجديد (يمنع الحلقات).
 * يرسل الكوكيز دائماً (em_refresh HttpOnly) + هيدر المنصة.
 */
import axios from "axios";
import { getApiBaseURL } from "./apiConfig";
import { getTenantSubdomain, resolveTenantSubdomain } from "../utils/tenantHost";

const authHttp = axios.create({
  baseURL: getApiBaseURL(),
  withCredentials: true,
  timeout: 20_000,
});

authHttp.interceptors.request.use((config) => {
  const headers = config.headers || {};
  const tenant = resolveTenantSubdomain() || getTenantSubdomain();
  if (tenant) {
    if (typeof headers.set === "function") headers.set("X-Tenant-Subdomain", tenant);
    else headers["X-Tenant-Subdomain"] = tenant;
  }
  config.headers = headers;
  return config;
});

export default authHttp;
