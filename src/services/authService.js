/**
 * AuthService — نداءات المصادقة + تدفق الإقلاع (Bootstrap).
 *
 * تدفق بدء التشغيل:
 *   1) لو يوجد توكن في الذاكرة (أو وصل من تبويب آخر) → GET /auth/me
 *   2) لو 401 أو لا يوجد توكن → POST /auth/refresh (كوكي HttpOnly)
 *   3) نجح الـ refresh → GET /auth/me مرة أخرى
 *   4) فشل → المستخدم غير مسجّل (بدون أي رسالة خطأ)
 */

import authHttp from "../api/authHttp";
import { isJwtExpired } from "../utils/jwt";
import {
  getAccessToken,
  requestTokenFromPeers,
} from "./tokenStore";
import { refreshSession } from "./refreshManager";

function bearerConfig() {
  const token = getAccessToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

/** GET /auth/me — يرجع بيانات المستخدم أو يرمي الخطأ */
export async function fetchMe() {
  const response = await authHttp.get("api/auth/me", bearerConfig());
  return response?.data?.user ?? response?.data ?? null;
}

/** POST /auth/logout — يمسح كوكي الـ refresh ويلغي جلسة الجهاز الحالي */
export async function logoutRequest() {
  try {
    await authHttp.post("api/auth/logout", null, bearerConfig());
    return true;
  } catch {
    return false; // الخروج محلياً يتم في كل الأحوال
  }
}

/** POST /auth/logout-all — يلغي كل جلسات المستخدم على كل الأجهزة */
export async function logoutAllRequest() {
  const response = await authHttp.post("api/auth/logout-all", null, bearerConfig());
  return response?.data;
}

function isAuthRejection(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403;
}

/**
 * فحص الجلسة عند الإقلاع.
 * يرجع { user } عند النجاح أو { user: null } عند عدم وجود جلسة.
 * يرمي الخطأ فقط عند مشاكل الشبكة (ليعاد المحاولة عند عودة الاتصال).
 */
export async function bootstrapSession() {
  let token = getAccessToken();

  // تبويب جديد: جرّب أخذ التوكن من التبويبات المفتوحة قبل عمل refresh
  if (!token || isJwtExpired(token)) {
    token = await requestTokenFromPeers(300);
  }

  if (token && !isJwtExpired(token)) {
    try {
      const user = await fetchMe();
      if (user) return { user };
    } catch (error) {
      if (!isAuthRejection(error)) throw error;
      // TOKEN_EXPIRED → نكمل للـ refresh
    }
  }

  let refreshed;
  try {
    refreshed = await refreshSession();
  } catch (error) {
    // خطأ شبكة — بلّغ الأعلى ليتعامل مع وضع الأوفلاين
    throw error;
  }

  if (!refreshed) return { user: null };

  try {
    const user = await fetchMe();
    return { user: user || null };
  } catch (error) {
    if (isAuthRejection(error)) return { user: null };
    throw error;
  }
}
