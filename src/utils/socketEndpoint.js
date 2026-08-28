import { getResolvedApiTarget, useDevViteProxy } from "../api/apiConfig";
import { getAuthScopeSubdomain } from "./tenantAuthStorage";
import {
  getTenantSubdomain,
  resolveTenantSubdomain,
} from "./tenantHost";

/**
 * نقطة اتصال Socket.IO — مع Vite proxy نستخدم نفس origin للمرور عبر /socket.io
 */
export function getSocketEndpoint() {
  if (typeof window !== "undefined" && useDevViteProxy()) {
    return window.location.origin;
  }
  return getResolvedApiTarget();
}

function resolveSocketTenant() {
  return (
    getTenantSubdomain() ||
    getAuthScopeSubdomain() ||
    resolveTenantSubdomain() ||
    null
  );
}

/** بيانات المصادقة/السياق المرسلة مع handshake */
export function buildSocketAuth(overrides = {}) {
  const auth = { ...(overrides && typeof overrides === "object" ? overrides : {}) };
  const tenant = resolveSocketTenant();
  if (tenant) {
    auth.tenant = tenant;
    auth.subdomain = tenant;
    auth.tenantSubdomain = tenant;
  }
  return auth;
}

function isDevTenantHost() {
  if (typeof window === "undefined") return false;
  return (
    import.meta.env.DEV &&
    window.location.hostname.toLowerCase().endsWith(".localhost")
  );
}

/** إعدادات مشتركة — polling أولاً لتفادي فشل WebSocket على *.localhost في التطوير */
export function getSocketClientOptions(overrides = {}) {
  const tenant = resolveSocketTenant();
  const devTenant = isDevTenantHost();
  const overrideAuth =
    overrides.auth && typeof overrides.auth === "object" ? overrides.auth : {};
  const { auth: _auth, query: overrideQuery, ...restOverrides } = overrides;

  return {
    path: "/socket.io",
    withCredentials: true,
    transports: devTenant ? ["polling"] : ["polling", "websocket"],
    upgrade: !devTenant,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 12000,
    timeout: 12000,
    auth: buildSocketAuth(overrideAuth),
    ...(tenant
      ? {
          query: {
            tenant,
            subdomain: tenant,
            ...(overrideQuery && typeof overrideQuery === "object" ? overrideQuery : {}),
          },
        }
      : overrideQuery
        ? { query: overrideQuery }
        : {}),
    ...restOverrides,
  };
}
