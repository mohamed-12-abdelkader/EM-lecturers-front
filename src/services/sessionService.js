/**
 * SessionService — إدارة جلسات الأجهزة (GET /auth/sessions).
 */
import authHttp from "../api/authHttp";
import { readAuthToken } from "../utils/authStorage";

function bearerConfig() {
  const token = readAuthToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

/** قائمة الأجهزة/الجلسات النشطة للمستخدم الحالي */
export async function fetchDeviceSessions() {
  const response = await authHttp.get("api/auth/sessions", bearerConfig());
  return response?.data?.sessions ?? [];
}
