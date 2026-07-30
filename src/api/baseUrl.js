import axios from "axios";
import {
  clearExpiredAuthQuietly,
  markSessionExpired,
  normalizeAuthToken,
  isAuthTokenExpired,
} from "../utils/authStorage";
import { getTenantSubdomain, resolveTenantSubdomain } from "../utils/tenantHost";
import { getApiBaseURL } from "./apiConfig";
import { safeLocalGet, safeLocalSet } from "../utils/safeStorage";

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

function isSessionExpiredMessage(apiMessage) {
  if (apiMessage == null || apiMessage === "") return false;
  const msg = String(apiMessage);
  return (
    msg === "Session expired or replaced" ||
    msg.toLowerCase().includes("expired") ||
    msg.toLowerCase().includes("unauthenticated") ||
    msg.toLowerCase().includes("unauthorized") ||
    msg.includes("انتهت") ||
    msg.includes("غير صالح") ||
    msg.includes("غير مصرح") ||
    msg.includes("يجب تسجيل الدخول")
  );
}

const baseUrl = axios.create({
  baseURL: getApiBaseURL(),
});

function persistToken(token) {
  const normalized = normalizeAuthToken(token);
  if (!normalized) return;
  safeLocalSet("token", normalized);
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

// Always attach a fresh, normalized Bearer token + tenant context
baseUrl.interceptors.request.use((config) => {
  const headers = config.headers || {};
  const rawStored = safeLocalGet("token", "") || "";
  let token = normalizeAuthToken(rawStored);

  // لا ترسل توكن منتهي — يمنع 401 المتسلسل وتعطل اللاندنج
  if (token && isAuthTokenExpired(token)) {
    clearExpiredAuthQuietly();
    token = "";
  }

  if (token && token !== rawStored) persistToken(token);

  if (token) {
    setHeader(headers, "Authorization", `Bearer ${token}`);
  }

  const tenant = resolveTenantSubdomain() || getTenantSubdomain();
  if (tenant && !getHeader(headers, "X-Tenant-Subdomain")) {
    setHeader(headers, "X-Tenant-Subdomain", tenant);
  }

  config.headers = headers;
  return config;
});

// Persist refreshed tokens + handle global session expiry
baseUrl.interceptors.response.use(
  (response) => {
    const refreshed =
      response?.headers?.["x-access-token"] ||
      response?.headers?.["X-Access-Token"];
    if (refreshed) persistToken(refreshed);
    return response;
  },
  (error) => {
    const refreshed =
      error?.response?.headers?.["x-access-token"] ||
      error?.response?.headers?.["X-Access-Token"];
    if (refreshed) persistToken(refreshed);

    if (error.response && error.response.status === 401) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.errors?.[0];
      const onAuthPage =
        typeof window !== "undefined" &&
        (window.location.pathname === "/login" ||
          window.location.pathname === "/signup" ||
          window.location.pathname === "/teacher-login");

      const hadToken = Boolean(readAuthToken());
      const shouldExpireSession =
        !isPublicAuthRequest(error.config) &&
        !onAuthPage &&
        (isSessionExpiredMessage(apiMessage) || hadToken);

      if (shouldExpireSession) {
        markSessionExpired();
        error.sessionExpired = true;
      }
    }

    return Promise.reject(error);
  },
);

export default baseUrl;
