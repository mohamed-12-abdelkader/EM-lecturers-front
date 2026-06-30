/** عنوان الـ API الافتراضي — يُستخدم في التطوير والإنتاج ما لم يُعيَّن VITE_API_BASE_URL */
export const DEFAULT_API_BASE_URL = "http://api.em-online.online/";

/**
 * @returns {string} Base URL مع شرطة مائلة في النهاية (مناسب لـ axios)
 */
export function getApiBaseURL() {
  const useViteProxy =
    import.meta.env.DEV && import.meta.env.VITE_USE_VITE_PROXY === "true";

  if (useViteProxy) {
    return "/";
  }

  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/?$/, "/");
  }

  return `${DEFAULT_API_BASE_URL}/`;
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
