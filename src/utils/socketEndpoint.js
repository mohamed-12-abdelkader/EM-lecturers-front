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

/** إعدادات مشتركة — polling أولاً لتفادي فشل WebSocket على *.localhost في التطوير */
export function getSocketClientOptions(overrides = {}) {
  return {
    path: "/socket.io",
    withCredentials: true,
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 12000,
    timeout: 12000,
    ...overrides,
  };
}
