/**
 * عميل HTTP خاص بالمصادقة — بدون interceptors للتجديد (يمنع الحلقات).
 * يرسل الكوكيز دائماً (em_refresh HttpOnly) + هيدر المنصة.
 */
import axios from "axios";
import { getApiBaseURL } from "./apiConfig";
import { getTenantSubdomain, resolveTenantSubdomain } from "../utils/tenantHost";

const authHttp = axios.create({
  withCredentials: true,
  timeout: 20_000,
});

authHttp.interceptors.request.use((config) => {
  config.baseURL = getApiBaseURL();
  if (config.url) {
    const raw = String(config.url).trim();
    if (raw && !/^https?:\/\//i.test(raw)) {
      config.url = raw.startsWith("/") ? raw : `/${raw}`;
    }
  }
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
