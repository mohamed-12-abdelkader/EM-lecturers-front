/**
 * يجب أن يكون أول import في main.jsx:
 * 1) ترحيل الجلسة القديمة em-auth:* → user/token
 * 2) تفعيل مخزن التوكن
 */
import { migrateLegacyAuthSession } from "./utils/tenantAuthStorage";
import { initTokenStore } from "./services/tokenStore";
import { initBrowserDeviceId } from "./utils/deviceRestriction";

migrateLegacyAuthSession();
initTokenStore();
initBrowserDeviceId();
