import { getResolvedApiTarget, useDevViteProxy } from "../api/apiConfig";

/**
 * نقطة اتصال Socket.IO — مع Vite proxy نستخدم نفس origin للمرور عبر /socket.io
 */
export function getSocketEndpoint() {
  if (typeof window !== "undefined" && useDevViteProxy()) {
    return window.location.origin;
  }
  return getResolvedApiTarget();
}
