/**
 * RefreshManager — تجديد الجلسة عبر كوكي الـ HttpOnly.
 *
 * الضمانات:
 * - Refresh واحد فقط في نفس اللحظة داخل التبويب (single-flight promise).
 * - Refresh واحد فقط عبر كل التبويبات (Web Locks API + مشاركة التوكن عبر BroadcastChannel).
 * - كل الطلبات المعلّقة تنتظر نفس الـ promise ثم يُعاد إرسالها.
 *
 * العقد:
 * - ينجح  → يرجع التوكن الجديد (string).
 * - 401   → يرجع null (الجلسة انتهت نهائياً — على المستدعي تسجيل الخروج).
 * - شبكة  → يرمي خطأ (لا تُنهِ الجلسة بسبب انقطاع الإنترنت).
 */

import authHttp from "../api/authHttp";
import { isJwtExpired } from "../utils/jwt";
import {
  getAccessToken,
  hasFreshAccessToken,
  setAccessToken,
} from "./tokenStore";
import { postAuthMessage } from "./authChannel";
import { safeLocalSet } from "../utils/safeStorage";

const REFRESH_LOCK = "em-auth-refresh";

let inflight = null;

function persistRefreshedUser(user) {
  if (user == null || typeof user !== "object") return;
  safeLocalSet("user", JSON.stringify(user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-storage-update"));
  }
  postAuthMessage({ type: "user", user });
}

async function performRefresh() {
  try {
    const response = await authHttp.post("api/auth/refresh");
    const token = response?.data?.token;
    if (!token) return null;
    setAccessToken(token);
    persistRefreshedUser(response?.data?.user);
    return getAccessToken();
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) return null;
    // خطأ شبكة أو خادم — لا نعتبر الجلسة منتهية
    throw error;
  }
}

async function refreshWithCrossTabLock(staleToken) {
  const run = async () => {
    // تبويب آخر ربما جدّد التوكن أثناء انتظار الـ lock
    const current = getAccessToken();
    if (current && current !== staleToken && !isJwtExpired(current)) {
      return current;
    }
    return performRefresh();
  };

  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(REFRESH_LOCK, run);
  }
  return run();
}

/**
 * يجدد الجلسة مرة واحدة مهما تعدد المستدعون.
 * كل من ينادي أثناء وجود refresh جارٍ ينتظر نفس النتيجة.
 */
export function refreshSession() {
  if (inflight) return inflight;
  const staleToken = getAccessToken();
  inflight = refreshWithCrossTabLock(staleToken).finally(() => {
    inflight = null;
  });
  return inflight;
}

/** هل يوجد refresh جارٍ الآن؟ */
export function isRefreshing() {
  return inflight != null;
}

export { hasFreshAccessToken };
