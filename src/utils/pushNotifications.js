import {
  fetchVapidPublicKey,
  pushSubscribe,
} from "../api/notificationsApi";

const PUSH_OPTED_IN_KEY = "push_notifications_opted_in";
const PUSH_PROMPT_DISMISSED_KEY = "push_prompt_dismissed";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission() {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

export function hasOptedInToPush() {
  return localStorage.getItem(PUSH_OPTED_IN_KEY) === "1";
}

export function markPushOptedIn() {
  localStorage.setItem(PUSH_OPTED_IN_KEY, "1");
  localStorage.removeItem(PUSH_PROMPT_DISMISSED_KEY);
}

export function markPushPromptDismissed() {
  localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "1");
}

export function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Brave")) return "Brave";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Browser";
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getApiErrorMessage(error, fallback = "حدث خطأ غير متوقع") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export async function registerServiceWorker() {
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  });
  await navigator.serviceWorker.ready;
  return registration;
}

export function subscriptionToPayload(subscription) {
  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("تعذّر إنشاء اشتراك الإشعارات في المتصفح");
  }

  return {
    endpoint,
    keys: { p256dh, auth },
    browser: getBrowserName(),
    device_label: `${getBrowserName()} — ${navigator.platform || "Web"}`,
  };
}

async function getOrCreatePushSubscription(registration, publicKey) {
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  const existing = await registration.pushManager.getSubscription();

  if (existing) {
    try {
      await existing.unsubscribe();
    } catch {
      /* قد يكون الاشتراك منتهياً — نتابع بإنشاء جديد */
    }
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
}

async function syncSubscriptionWithBackend(subscription) {
  const token = localStorage.getItem("token");
  if (!token) {
    return {
      ok: false,
      message: "يجب تسجيل الدخول لحفظ اشتراك الإشعارات على السيرفر",
    };
  }

  try {
    await pushSubscribe(subscriptionToPayload(subscription));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: getApiErrorMessage(error, "تعذّر حفظ الاشتراك على السيرفر"),
    };
  }
}

/**
 * يفعّل أو يحدّث اشتراك Push.
 * لا يرمي استثناءات — يُرجع كائناً يصف الحالة.
 */
export async function setupWebPush({ requestPermission = false } = {}) {
  if (!isPushSupported()) {
    return { status: "unsupported" };
  }

  if (Notification.permission === "denied") {
    return { status: "denied" };
  }

  let finalPermission = Notification.permission;
  if (finalPermission === "default" && requestPermission) {
    finalPermission = await Notification.requestPermission();
  }

  if (finalPermission !== "granted") {
    return { status: finalPermission };
  }

  try {
    const publicKey = await fetchVapidPublicKey();
    if (!publicKey) {
      return { status: "error", message: "مفتاح VAPID غير متاح من السيرفر" };
    }

    const registration = await registerServiceWorker();
    const subscription = await getOrCreatePushSubscription(registration, publicKey);
    const backend = await syncSubscriptionWithBackend(subscription);

    markPushOptedIn();

    if (!backend.ok) {
      return {
        status: "granted",
        subscription,
        backendSynced: false,
        message: backend.message,
      };
    }

    return { status: "granted", subscription, backendSynced: true };
  } catch (error) {
    return {
      status: "error",
      message: getApiErrorMessage(error, "فشل تفعيل إشعارات المتصفح"),
    };
  }
}

export function shouldPromptForPush() {
  if (!isPushSupported()) return false;
  if (hasOptedInToPush()) return false;
  if (localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY) === "1") return false;
  if (Notification.permission === "granted") return false;
  if (Notification.permission === "denied") return false;
  return Notification.permission === "default";
}

export async function syncPushSubscriptionSilently() {
  if (!isPushSupported()) return { status: "unsupported" };
  if (Notification.permission !== "granted") {
    return { status: Notification.permission };
  }

  const result = await setupWebPush({ requestPermission: false });
  if (result.status === "granted") {
    markPushOptedIn();
  }
  return result;
}

export function onServiceWorkerMessage(handler) {
  if (!navigator.serviceWorker) return () => {};
  const listener = (event) => handler(event.data);
  navigator.serviceWorker.addEventListener("message", listener);
  return () => navigator.serviceWorker.removeEventListener("message", listener);
}
