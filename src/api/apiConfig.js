/** عناوين الـ API الافتراضية حسب وضع التشغيل */
export const DEV_API_BASE_URL = "http://localhost:8000";
export const PROD_API_BASE_URL = "https://api.em-online.online/";

function trimUrl(url) {
  return String(url || "").trim();
}

function withTrailingSlash(url) {
  return trimUrl(url).replace(/\/?$/, "/");
}

function withoutTrailingSlash(url) {
  return trimUrl(url).replace(/\/$/, "");
}

function readEnvUrl() {
  return trimUrl(import.meta.env.VITE_API_BASE_URL);
}

function isProductionBuild() {
  return import.meta.env.PROD === true;
}

function isProductionApiUrl(url) {
  return /api\.em-online\.online/i.test(String(url || ""));
}

/** نطاقات المدرس في التطوير: teacher.localhost — تحتاج proxy لتجنب CORS مع :8000 */
function isTenantDevHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host.endsWith(".localhost");
}

/**
 * في التطوير فقط: Vite proxy (/) → localhost:8000
 * يتجنب مشاكل CORS مع نطاقات مثل mo-adbo.localhost:3000
 * يمكن إجبار الاتصال بـ API البروداكشن عبر VITE_FORCE_PROD_API=true
 */
export function useDevViteProxy() {
  if (isProductionBuild()) return false;
  if (!import.meta.env.DEV) return false;
  if (import.meta.env.VITE_FORCE_PROD_API === "true") return false;
  // منصات المدرس على *.localhost:3000 — دائماً proxy
  if (isTenantDevHost()) return true;
  return import.meta.env.VITE_USE_VITE_PROXY !== "false";
}

/** عنوان الـ API الفعلي الذي يستقبل الطلبات */
export function getResolvedApiTarget() {
  if (isProductionBuild()) {
    return withoutTrailingSlash(readEnvUrl() || PROD_API_BASE_URL);
  }

  // تطوير: تجاهل عنوان البروداكشن في .env إلا لو تم الإجبار صراحة
  if (import.meta.env.VITE_FORCE_PROD_API === "true") {
    return withoutTrailingSlash(readEnvUrl() || PROD_API_BASE_URL);
  }

  if (useDevViteProxy()) {
    const proxyTarget =
      import.meta.env.VITE_API_PROXY_TARGET ||
      (isProductionApiUrl(readEnvUrl()) ? "" : readEnvUrl()) ||
      DEV_API_BASE_URL;
    return withoutTrailingSlash(
      isProductionApiUrl(proxyTarget) ? DEV_API_BASE_URL : proxyTarget,
    );
  }

  const fromEnv = readEnvUrl();
  if (fromEnv && !isProductionApiUrl(fromEnv)) {
    return withoutTrailingSlash(fromEnv);
  }

  return withoutTrailingSlash(DEV_API_BASE_URL);
}

/**
 * @returns {string} Base URL لـ axios — "/" في dev مع proxy، أو عنوان API مباشر
 * - DEV → localhost:8000 (عبر proxy غالباً)
 * - PROD → https://api.em-online.online/
 */
export function getApiBaseURL() {
  if (isProductionBuild()) {
    return withTrailingSlash(readEnvUrl() || PROD_API_BASE_URL);
  }

  if (import.meta.env.VITE_FORCE_PROD_API === "true") {
    return withTrailingSlash(readEnvUrl() || PROD_API_BASE_URL);
  }

  if (useDevViteProxy()) {
    return "/";
  }

  const fromEnv = readEnvUrl();
  if (fromEnv && !isProductionApiUrl(fromEnv)) {
    return withTrailingSlash(fromEnv);
  }

  return withTrailingSlash(DEV_API_BASE_URL);
}

/**
 * @returns {string} أصل الـ API لـ fetch — فارغ مع proxy (مسارات نسبية /api/...)
 */
export function getApiOrigin() {
  if (useDevViteProxy()) {
    return "";
  }
  return getApiBaseURL().replace(/\/$/, "");
}

if (import.meta.env.DEV && typeof console !== "undefined") {
  const mode = useDevViteProxy() ? "Vite proxy →" : "مباشر →";
  console.info(`[API] ${mode} ${getResolvedApiTarget()}`);
}
