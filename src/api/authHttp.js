/**
 * عميل HTTP للمصادقة — Bearer من localStorage.token، بدون cookies.
 */
import axios from "axios";
import { getApiBaseURL } from "./apiConfig";
import { readAuthToken } from "../utils/authStorage";
import { getTenantSubdomain, resolveLoginTenantSubdomain } from "../utils/tenantHost";

const authHttp = axios.create({
  withCredentials: false,
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
  const token = readAuthToken();
  if (token) {
    if (typeof headers.set === "function") headers.set("Authorization", `Bearer ${token}`);
    else headers.Authorization = `Bearer ${token}`;
  }
  const tenant = getTenantSubdomain() || resolveLoginTenantSubdomain();
  if (tenant) {
    if (typeof headers.set === "function") headers.set("X-Tenant-Subdomain", tenant);
    else headers["X-Tenant-Subdomain"] = tenant;
  }
  config.headers = headers;
  return config;
});

export default authHttp;
