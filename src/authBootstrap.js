/**
 * 1) ترحيل الجلسة القديمة em-auth:* → user/token
 * 2) تفعيل مخزن التوكن
 * 3) على subdomain المدرس: رفض توكن بدون مستخدم محلي صالح
 */
import { migrateLegacyAuthSession, getAuthScopeSubdomain } from "./utils/tenantAuthStorage";
import { initTokenStore } from "./services/tokenStore";
import { initBrowserDeviceId } from "./utils/deviceRestriction";
import { readStoredUser, clearAuthSession } from "./utils/authStorage";
import { getAccessToken } from "./services/tokenStore";

migrateLegacyAuthSession();
initTokenStore();

if (getAuthScopeSubdomain() && !readStoredUser() && getAccessToken()) {
  clearAuthSession({ broadcast: false });
}

initBrowserDeviceId();
