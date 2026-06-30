import { getApiOrigin } from "../api/apiConfig";

/**
 * نقطة اتصال Socket.IO — نفس أصل الـ API وليس دومين الواجهة.
 */
export function getSocketEndpoint() {
  const fromProxy = import.meta.env.VITE_API_PROXY_TARGET;
  if (fromProxy && String(fromProxy).trim()) {
    try {
      return new URL(String(fromProxy).replace(/\/$/, "")).origin;
    } catch {
      /* fall through */
    }
  }

  const apiOrigin = getApiOrigin();
  if (apiOrigin) {
    return apiOrigin;
  }

  return window.location.origin;
}
