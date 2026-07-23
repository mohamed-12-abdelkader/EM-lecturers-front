import axios from "axios";
import {
  clearAuthSession,
  normalizeAuthToken,
} from "../utils/authStorage";
import { getTenantSubdomain } from "../utils/tenantHost";
import { getApiBaseURL } from "./apiConfig";

const baseUrl = axios.create({
  baseURL: getApiBaseURL(),
});

function persistToken(token) {
  const normalized = normalizeAuthToken(token);
  if (!normalized) return;
  try {
    localStorage.setItem("token", normalized);
  } catch {
    // ignore storage errors
  }
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
  let rawStored = "";
  try {
    rawStored = localStorage.getItem("token") || "";
  } catch {
    rawStored = "";
  }
  const token = normalizeAuthToken(rawStored);
  // أصلح التوكن المخزّن لو كان فيه Bearer مكرر أو اقتباسات
  if (token && token !== rawStored) persistToken(token);

  if (token) {
    // Always overwrite — callers often send lowercase/double Bearer or stale values
    setHeader(headers, "Authorization", `Bearer ${token}`);
  }

  const tenant = getTenantSubdomain();
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
      const apiMessage = error?.response?.data?.message;

      if (
        apiMessage === "Session expired or replaced" ||
        apiMessage?.includes("expired") ||
        apiMessage?.includes("انتهت") ||
        apiMessage?.includes("غير صالح")
      ) {
        try {
          clearAuthSession();
          localStorage.removeItem("examAnswers");
          localStorage.removeItem("examTimeLeft");
        } catch (e) {
          console.error("Error clearing localStorage:", e);
        }

        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/signup"
        ) {
          error.sessionExpired = true;
        }
      }
    }

    return Promise.reject(error);
  },
);

export default baseUrl;
