/**
 * يجب أن يكون أول import في main.jsx:
 * يفعّل مخزن التوكن + يمسح مفاتيح النظام القديم em-auth:*
 */
import { initTokenStore } from "./services/tokenStore";
import { initBrowserDeviceId } from "./utils/deviceRestriction";
import { migrateLegacyAuthSession } from "./utils/tenantAuthStorage";

initTokenStore();
migrateLegacyAuthSession();
initBrowserDeviceId();
