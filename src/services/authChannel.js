/**
 * قناة مزامنة المصادقة بين التبويبات (BroadcastChannel).
 *
 * أنواع الرسائل:
 * - { type: "token",  token }            → توكن جديد (login / refresh)
 * - { type: "user",   user }             → تحديث بيانات المستخدم
 * - { type: "login",  user, token }      → تسجيل دخول من تبويب آخر
 * - { type: "logout" }                   → تسجيل خروج من تبويب آخر
 * - { type: "session-expired" }          → فشل الـ refresh نهائياً
 * - { type: "request-token" }            → تبويب جديد يطلب التوكن الحالي
 */

const CHANNEL_NAME = "em-auth-v1";

let channel = null;
let channelFailed = false;
const handlers = new Set();

function ensureChannel() {
  if (channel || channelFailed) return channel;
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    channelFailed = true;
    return null;
  }
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      const msg = event?.data;
      if (!msg || typeof msg !== "object" || !msg.type) return;
      handlers.forEach((handler) => {
        try {
          handler(msg);
        } catch (err) {
          if (import.meta.env.DEV) console.error("[authChannel] handler failed", err);
        }
      });
    };
  } catch {
    channelFailed = true;
    channel = null;
  }
  return channel;
}

/** إرسال رسالة لبقية التبويبات (لا تصل للتبويب الحالي) */
export function postAuthMessage(message) {
  const ch = ensureChannel();
  if (!ch) return false;
  try {
    ch.postMessage(message);
    return true;
  } catch {
    return false;
  }
}

/** الاستماع لرسائل بقية التبويبات — يرجع دالة إلغاء الاشتراك */
export function subscribeAuthMessages(handler) {
  if (typeof handler !== "function") return () => {};
  ensureChannel();
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}
