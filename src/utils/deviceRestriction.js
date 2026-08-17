/**
 * ربط حساب الطالب بالمتصفح:
 * يُولَّد معرّف ثابت في localStorage ويُرسل كـ device_ip في login/register.
 * (الحقل في الـ API اسمه device_ip لكن القيمة = browser device id)
 */

export const BROWSER_DEVICE_ID_KEY = "em_browser_device_id";

export const AUTH_DEVICE_ERROR = {
  ACCOUNT_IP_MISMATCH: "ACCOUNT_IP_MISMATCH",
  DEVICE_IP_REQUIRED: "DEVICE_IP_REQUIRED",
};

function generateBrowserDeviceId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readLegacyDeviceId() {
  const legacyKeys = ["ip", "device_ip"];
  for (const key of legacyKeys) {
    const value = localStorage.getItem(key);
    if (value && String(value).trim().length >= 16) {
      return String(value).trim();
    }
  }
  return null;
}

function persistBrowserDeviceId(id) {
  if (!id) return null;
  localStorage.setItem(BROWSER_DEVICE_ID_KEY, id);
  localStorage.removeItem("ip");
  localStorage.removeItem("device_ip");
  return id;
}

/** يُنشئ أو يُرجع معرّف المتصفح المحفوظ — ثابت طول ما localStorage لم يُمسح */
export function getOrCreateBrowserDeviceId() {
  const stored = localStorage.getItem(BROWSER_DEVICE_ID_KEY);
  if (stored && stored.trim()) {
    return stored.trim();
  }

  const migrated = readLegacyDeviceId();
  if (migrated) {
    return persistBrowserDeviceId(migrated);
  }

  return persistBrowserDeviceId(generateBrowserDeviceId());
}

/** للتوافق مع الاستدعاءات القديمة */
export function readCachedDeviceIp() {
  return getOrCreateBrowserDeviceId();
}

export function appendDeviceIp(payload = {}) {
  return {
    ...payload,
    device_ip: getOrCreateBrowserDeviceId(),
  };
}

export function parseAuthDeviceError(error) {
  const data = error?.response?.data || {};
  return {
    code: data.code || null,
    message: data.message || data.msg || data.error || null,
    status: error?.response?.status ?? null,
  };
}

export function isAccountIpMismatchError(error) {
  return parseAuthDeviceError(error).code === AUTH_DEVICE_ERROR.ACCOUNT_IP_MISMATCH;
}

export function isDeviceIpRequiredError(error) {
  return parseAuthDeviceError(error).code === AUTH_DEVICE_ERROR.DEVICE_IP_REQUIRED;
}

export function getAuthDeviceErrorMessage(error, fallback = "حدث خطأ أثناء تسجيل الدخول") {
  const parsed = parseAuthDeviceError(error);
  if (parsed.message) return parsed.message;

  if (parsed.code === AUTH_DEVICE_ERROR.ACCOUNT_IP_MISMATCH) {
    return "هذا الحساب مرتبط بمتصفح آخر. سجّل الدخول من نفس المتصفح أو اطلب من المدرس إعادة تعيين الجهاز.";
  }
  if (parsed.code === AUTH_DEVICE_ERROR.DEVICE_IP_REQUIRED) {
    return "تعذر تحديد جهاز المتصفح. أعد المحاولة.";
  }

  return fallback;
}

export function handleAuthIpRegistered(responseData) {
  return Boolean(responseData?.ip_registered);
}

export function isSingleDeviceLimit(settings) {
  if (!settings) return false;
  if (settings.single_device === true) return true;
  return settings.student_device_limit === "single_device";
}

export const SINGLE_DEVICE_NOTICE =
  "هذه المنصة تسمح بتسجيل الدخول من متصفح واحد فقط لكل حساب. إذا مسحت بيانات المتصفح أو فتحت الحساب من متصفح آخر، تواصل مع المدرس لإعادة تعيين الجهاز.";

export function initBrowserDeviceId() {
  getOrCreateBrowserDeviceId();
}
