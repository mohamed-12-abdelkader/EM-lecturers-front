/** عنوان الـ API الافتراضي (HTTP — يعمل محلياً؛ في الإنتاج HTTPS يُستخدم same-origin أو HTTPS للـ API) */
export const DEFAULT_API_BASE_URL = "https://api.em-online.online/";

function withTrailingSlash(url) {
  return String(url || "").trim().replace(/\/?$/, "/");
}

/**
 * في الإنتاج: الصفحة HTTPS + API على HTTP = المتصفح يحجب الطلب (Mixed Content).
 * الحل: إما SSL على api.em-online.online أو proxy لـ /api على دومين الواجهة.
 */
function shouldUseSameOriginInProduction() {
  if (!import.meta.env.PROD || typeof window === "undefined") {
    return false;
  }
  if (window.location.protocol !== "https:") {
    return false;
  }

  const flag = import.meta.env.VITE_API_SAME_ORIGIN;
  if (flag === "true") return true;
  if (flag === "false") return false;

  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  const apiUrl = (fromEnv && String(fromEnv).trim()) || DEFAULT_API_BASE_URL;
  return apiUrl.startsWith("http://");
}

/**
 * @returns {string} Base URL مع شرطة مائلة في النهاية (مناسب لـ axios)
 */
export function getApiBaseURL() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_VITE_PROXY === "true") {
    return "/";
  }

  if (shouldUseSameOriginInProduction()) {
    return "/";
  }

  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    let url = withTrailingSlash(fromEnv);
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      url.startsWith("http://")
    ) {
      url = url.replace(/^http:\/\//, "https://");
    }
    return url;
  }

  return withTrailingSlash(DEFAULT_API_BASE_URL);
}

/**
 * @returns {string} أصل الـ API بدون شرطة مائلة (مناسب لـ fetch / Socket.IO)
 */
export function getApiOrigin() {
  const base = getApiBaseURL();
  if (base === "/" || base === "") {
    return "";
  }
  return base.replace(/\/$/, "");
}
