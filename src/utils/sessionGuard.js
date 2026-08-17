/**
 * رفض جلسة منصة أخرى — يمسح الكوكي المشترك (.em-online.online) والتخزين المحلي.
 */
import authHttp from "../api/authHttp";
import { clearAuthSession } from "./authStorage";
import { getAccessToken } from "../services/tokenStore";

export async function rejectForeignTenantSession() {
  try {
    const token = getAccessToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    await authHttp.post("api/auth/logout", null, config);
  } catch {
    // ignore — نكمل مسح التخزين المحلي
  }
  clearAuthSession({ broadcast: false });
}
