/** عناوين الـ API الافتراضية حسب وضع التشغيل */
/** 127.0.0.1 وليس localhost — على Windows قد يروح localhost إلى IPv6 (::1) ويصطدم بسيرفر آخر على نفس المنفذ */
export const DEV_API_BASE_URL = "http://127.0.0.1:8000";
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

function readProxyTargetEnv() {
  return trimUrl(import.meta.env.VITE_API_PROXY_TARGET);
}

function isProductionBuild() {
  return import.meta.env.PROD === true;
}

function isDevRuntime() {
  return import.meta.env.DEV === true && !isProductionBuild();
}

function isProductionApiUrl(url) {
  return /api\.em-online\.online/i.test(String(url || ""));
}

function forceProdApiInDev() {
  return import.meta.env.VITE_FORCE_PROD_API === "true";
}

/** نطاقات المدرس في التطوير: teacher.localhost — تحتاج proxy لتجنب CORS مع :8000 */
function isTenantDevHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host.endsWith(".localhost");
}

/**
 * عنوان الـ API المحلي للتطوير — يتجاهل أي قيمة بروداكشن بالخطأ في env.
 */
function preferIpv4Loopback(url) {
  return withoutTrailingSlash(url).replace(
    /^(https?:\/\/)localhost(?=[:/]|$)/i,
    "$1127.0.0.1",
  );
}

function resolveDevApiTarget() {
  const candidates = [readProxyTargetEnv(), readEnvUrl(), DEV_API_BASE_URL];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (isProductionApiUrl(candidate)) continue;
    return preferIpv4Loopback(candidate);
  }
  return withoutTrailingSlash(DEV_API_BASE_URL);
}

/**
 * في التطوير فقط: Vite proxy (/) → localhost:8000
 * يتجنب مشاكل CORS مع نطاقات مثل mo-adbo.localhost:3000
 * يمكن إجبار الاتصال بـ API البروداكشن عبر VITE_FORCE_PROD_API=true
 */
export function useDevViteProxy() {
  if (!isDevRuntime()) return false;
  if (forceProdApiInDev()) return false;
  // منصات المدرس على *.localhost:3000 — دائماً proxy
  if (isTenantDevHost()) return true;
  return import.meta.env.VITE_USE_VITE_PROXY !== "false";
}

/** عنوان الـ API الفعلي الذي يستقبل الطلبات */
export function getResolvedApiTarget() {
  if (isProductionBuild()) {
    return withoutTrailingSlash(readEnvUrl() || PROD_API_BASE_URL);
  }

  if (forceProdApiInDev()) {
    return withoutTrailingSlash(readEnvUrl() || PROD_API_BASE_URL);
  }

  // تطوير: دائمًا السيرفر المحلي — لا تستخدم API البروداكشن بالخطأ
  return resolveDevApiTarget();
}

/**
 * @returns {string} Base URL لـ axios — "/" في dev مع proxy، أو عنوان API مباشر
 * - DEV → http://localhost:8000 (عبر proxy غالبًا)
 * - PROD → https://api.em-online.online/
 */
export function getApiBaseURL() {
  if (isProductionBuild()) {
    return withTrailingSlash(readEnvUrl() || PROD_API_BASE_URL);
  }

  if (forceProdApiInDev()) {
    return withTrailingSlash(readEnvUrl() || PROD_API_BASE_URL);
  }

  if (useDevViteProxy()) {
    return "/";
  }

  return withTrailingSlash(resolveDevApiTarget());
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

if (isDevRuntime() && typeof console !== "undefined") {
  const mode = useDevViteProxy() ? "Vite proxy →" : "مباشر →";
  console.info(`[API][dev] ${mode} ${getResolvedApiTarget()}`);
}
