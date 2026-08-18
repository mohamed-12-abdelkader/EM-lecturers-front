/**
 * مسح جلسة origin الحالي فقط — بدون استدعاء API (لا كوكي مشتركة).
 */
import { clearAuthSession } from "./authStorage";

export function clearLocalAuthSession() {
  clearAuthSession();
}

/** @deprecated */
export async function rejectForeignTenantSession() {
  clearLocalAuthSession();
}
