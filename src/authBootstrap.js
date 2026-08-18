/**
 * Bootstrap — جسر localStorage + تنظيف مفاتيح auth القديمة.
 */
import { initTokenStore } from "./services/tokenStore";
import { initBrowserDeviceId } from "./utils/deviceRestriction";
import { purgeLegacyAuthKeys } from "./utils/tenantAuthStorage";

initTokenStore();
purgeLegacyAuthKeys();
initBrowserDeviceId();
