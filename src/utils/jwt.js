/**
 * أدوات JWT خالصة (بدون أي تخزين) — تُستخدم من tokenStore و authStorage.
 */

/** يوحّد شكل التوكن: يشيل Bearer المكرر وعلامات الاقتباس ويرفض null/undefined كنص */
export function normalizeAuthToken(raw) {
  if (raw == null) return "";
  let token = String(raw).trim();
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }
  token = token.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === "null" || token === "undefined") return "";
  return token;
}

/** يفك payload الـ JWT بدون مكتبات خارجية */
export function getJwtPayload(rawToken) {
  const token = normalizeAuthToken(rawToken);
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** true لو التوكن موجود وانتهت صلاحية exp (بهامش أمان 10 ثوانٍ) */
export function isJwtExpired(rawToken, skewMs = 10_000) {
  const token = normalizeAuthToken(rawToken);
  if (!token) return false;
  const payload = getJwtPayload(token);
  if (!payload || payload.exp == null) return false;
  const expMs = Number(payload.exp) * 1000;
  if (!Number.isFinite(expMs)) return false;
  return Date.now() >= expMs - skewMs;
}
