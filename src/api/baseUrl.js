/**
 * Axios Instance الرئيسية للتطبيق.
 *
 * - withCredentials: كوكي الـ refresh (HttpOnly) تُرسل مع كل طلب.
 * - Request Interceptor: يرفق Bearer من الذاكرة + هيدر المنصة،
 *   ويجدد التوكن استباقياً لو كان منتهياً.
 * - Response Interceptor: عند 401 → refresh واحد فقط (RefreshManager)
 *   وكل الطلبات المتزامنة تنتظر نفس الـ promise ثم يعاد إرسالها.
 *   فشل الـ refresh نهائياً → إنهاء الجلسة وتحويل المستخدم لتسجيل الدخول.
 * - انقطاع الإنترنت: الطلب ينتظر عودة الاتصال ويعاد تلقائياً مرة واحدة.
 */
import axios from "axios";
import { markSessionExpired, readAuthToken } from "../utils/authStorage";
import { isJwtExpired } from "../utils/jwt";
import { getTenantSubdomain, resolveTenantSubdomain } from "../utils/tenantHost";
import { getApiBaseURL, getResolvedApiTarget, useDevViteProxy } from "./apiConfig";
import { getAccessToken, setAccessToken } from "../services/tokenStore";
import { refreshSession } from "../services/refreshManager";
import { isBrowserOnline, isNetworkError, waitForOnline } from "../utils/network";
import { safeLocalGet } from "../utils/safeStorage";

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

function isRefreshRequest(config) {
  return String(config?.url || "").toLowerCase().includes("/auth/refresh");
}

function isOnAuthPage() {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path === "/login" || path === "/signup" || path === "/teacher-login";
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
  withCredentials: true,
});

/* ------------------------- Request Interceptor ------------------------- */
baseUrl.interceptors.request.use(async (config) => {
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
  let token = getAccessToken();

  // تجديد استباقي: توكن منتهٍ لا يُرسل — نجدده أولاً بدل انتظار 401
  if (
    token &&
    isJwtExpired(token) &&
    !isPublicAuthRequest(config) &&
    !isRefreshRequest(config)
  ) {
    try {
      const renewed = await refreshSession();
      token = renewed || "";
    } catch {
      // خطأ شبكة — أرسل الطلب وسيتعامل معه interceptor الاستجابة
      token = getAccessToken();
    }
  }

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

/* ------------------------- Response Interceptor ------------------------ */
baseUrl.interceptors.response.use(
  (response) => {
    // توافق خلفي: الخادم القديم قد يرسل توكن مجدداً في هيدر X-Access-Token
    const refreshed =
      response?.headers?.["x-access-token"] ||
      response?.headers?.["X-Access-Token"];
    if (refreshed) setAccessToken(refreshed);
    return response;
  },
  async (error) => {
    const config = error?.config;

    // انقطاع الإنترنت: انتظر عودة الاتصال وأعد الطلب مرة واحدة تلقائياً
    if (isNetworkError(error) && config && !config._offlineRetry && !isBrowserOnline()) {
      config._offlineRetry = true;
      const backOnline = await waitForOnline(25_000);
      if (backOnline) {
        return baseUrl(config);
      }
      return Promise.reject(error);
    }

    const refreshedHeader =
      error?.response?.headers?.["x-access-token"] ||
      error?.response?.headers?.["X-Access-Token"];
    if (refreshedHeader) setAccessToken(refreshedHeader);

    const status = error?.response?.status;
    if (status !== 401 || !config) {
      return Promise.reject(error);
    }

    // 401 على طلبات الدخول/التسجيل نفسها = بيانات خاطئة، ليست جلسة منتهية
    if (isPublicAuthRequest(config) || isRefreshRequest(config)) {
      return Promise.reject(error);
    }

    // محاولة واحدة فقط لكل طلب: refresh ثم إعادة إرسال
    if (!config._authRetry) {
      config._authRetry = true;
      let newToken = null;
      try {
        newToken = await refreshSession();
      } catch {
        // خطأ شبكة أثناء الـ refresh — لا نُنهي الجلسة
        return Promise.reject(error);
      }
      if (newToken) {
        setHeader(config.headers, "Authorization", `Bearer ${newToken}`);
        return baseUrl(config);
      }
    }

    // الـ refresh فشل نهائياً أو الطلب المعاد رجع 401 مرة أخرى
    const hadSession = Boolean(readAuthToken()) || Boolean(safeLocalGet("user"));
    if (!isOnAuthPage() && hadSession) {
      markSessionExpired();
      error.sessionExpired = true;
    }

    return Promise.reject(error);
  },
);

export default baseUrl;
