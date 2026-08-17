/**
 * قناة مزامنة المصادقة بين التبويبات (BroadcastChannel).
 * معزولة لكل subdomain — تبويبات منصات مختلفة لا تتشارك الجلسة.
 */

import { getAuthChannelName, getAuthScopeSubdomain } from "../utils/tenantAuthStorage";

let channel = null;
let channelScope = null;
let channelFailed = false;
const handlers = new Set();

function authMessageFromOtherTenant(msg) {
  const current = getAuthScopeSubdomain();
  const msgTenant = msg?.tenant ?? null;
  if (msgTenant == null && current == null) return false;
  return String(msgTenant || "") !== String(current || "");
}

function ensureChannel() {
  const scope = getAuthScopeSubdomain() || "__main__";
  if (channel && channelScope === scope) return channel;
  if (channel) {
    try {
      channel.close();
    } catch {
      // ignore
    }
    channel = null;
  }
  if (channelFailed) return null;
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    channelFailed = true;
    return null;
  }
  try {
    channelScope = scope;
    channel = new BroadcastChannel(getAuthChannelName(scope === "__main__" ? null : scope));
    channel.onmessage = (event) => {
      const msg = event?.data;
      if (!msg || typeof msg !== "object" || !msg.type) return;
      if (authMessageFromOtherTenant(msg)) return;
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
    ch.postMessage({
      ...message,
      tenant: message?.tenant ?? getAuthScopeSubdomain(),
    });
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
