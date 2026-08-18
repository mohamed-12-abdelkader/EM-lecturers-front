/**
 * Axios Instance — Authorization من localStorage.token (origin الحالي فقط).
 * بدون withCredentials / بدون cookie refresh.
 */
import axios from "axios";
import {
  markSessionExpired,
  readAuthToken,
  readStoredUser,
} from "../utils/authStorage";
import {
  getTenantSubdomain,
  resolveLoginTenantSubdomain,
} from "../utils/tenantHost";
import { getApiBaseURL, getResolvedApiTarget, useDevViteProxy } from "./apiConfig";
import { isBrowserOnline, isNetworkError, waitForOnline } from "../utils/network";
import { getAuthScopeSubdomain } from "../utils/tenantAuthStorage";

function isPublicAuthRequest(config) {
  const url = String(config?.url || "").toLowerCase();
  return (
    url.includes("/login") ||
    url.includes("/signup") ||
    url.includes("/register") ||
    url.includes("/auth/forgot") ||
    url.includes("/auth/reset")
  );
}

function isOnAuthPage() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return (
    path === "/login" ||
    path === "/signup" ||
    path === "/teacher-login" ||
    path === "/welcome"
  );
}

function setHeader(headers, key, value) {
  if (!headers || value == null || value === "") return;
  if (typeof headers.set === "function") {
    headers.set(key, value);
  } else {
    headers[key] = value;
  }
}

function getHeader(headers, key) {
  if (!headers) return "";
  if (typeof headers.get === "function") {
    const viaGet = headers.get(key);
    if (viaGet != null && viaGet !== false) return String(viaGet);
  }
  const direct = headers[key] ?? headers[key.toLowerCase()];
  return direct != null ? String(direct) : "";
}

function normalizeRequestUrl(url = "") {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

const baseUrl = axios.create({
  withCredentials: false,
});

baseUrl.interceptors.request.use((config) => {
  config.baseURL = getApiBaseURL();
  config.url = normalizeRequestUrl(config.url);

  if (import.meta.env.DEV && typeof console !== "undefined") {
    const base = String(config.baseURL || "").replace(/\/$/, "");
    const path = String(config.url || "");
    const full = base ? `${base}${path}` : path;
    const viaProxy = useDevViteProxy();
    const target = getResolvedApiTarget();
    console.info(
      `[API →] ${String(config.method || "get").toUpperCase()} ${full}${
        viaProxy ? `  ⟹ proxy to ${target}` : ""
      }`,
    );
  }

  const headers = config.headers || {};
  const token = readAuthToken();
  if (token) {
    setHeader(headers, "Authorization", `Bearer ${token}`);
  }

  const tenant =
    getTenantSubdomain() ||
    getAuthScopeSubdomain() ||
    resolveLoginTenantSubdomain();
  if (tenant && !getHeader(headers, "X-Tenant-Subdomain")) {
    setHeader(headers, "X-Tenant-Subdomain", tenant);
  }

  config.headers = headers;
  return config;
});

baseUrl.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;

    if (isNetworkError(error) && config && !config._offlineRetry && !isBrowserOnline()) {
      config._offlineRetry = true;
      const backOnline = await waitForOnline(25_000);
      if (backOnline) {
        return baseUrl(config);
      }
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    if (status !== 401 || !config) {
      return Promise.reject(error);
    }

    if (isPublicAuthRequest(config)) {
      return Promise.reject(error);
    }

    const hadSession = Boolean(readAuthToken()) || Boolean(readStoredUser());
    if (!isOnAuthPage() && hadSession) {
      markSessionExpired();
      error.sessionExpired = true;
    }

    return Promise.reject(error);
  },
);

export default baseUrl;
