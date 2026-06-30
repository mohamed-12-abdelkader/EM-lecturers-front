import baseUrl from "../api/baseUrl";

/**
 * في التطوير: اتصال Socket.IO مباشرة بعنوان الـ API (ngrok/local)
 * لتجنب أخطاء ws proxy في Vite (ECONNRESET).
 */
export function getSocketEndpoint() {
  const envTarget =
    import.meta.env.VITE_API_PROXY_TARGET || import.meta.env.VITE_API_BASE_URL;

  if (import.meta.env.DEV && envTarget && String(envTarget).trim()) {
    try {
      return new URL(String(envTarget).replace(/\/$/, "")).origin;
    } catch {
      /* fall through */
    }
  }

  try {
    const base = baseUrl.defaults.baseURL || window.location.origin;
    if (!base || base === "/" || base === "") {
      return window.location.origin;
    }
    return new URL(base, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}
