/**
 * تسجيل الـ Service Worker + كشف الإصدارات الجديدة.
 *
 * عند توفر تحديث: يُطلق حدث "pwa:update-available" — يعرضه UpdatePrompt
 * بأزرار (تحديث / لاحقاً). الضغط على "تحديث" يفعّل النسخة الجديدة ويعيد التحميل.
 */

export const PWA_UPDATE_EVENT = "pwa:update-available";
export const PWA_OFFLINE_READY_EVENT = "pwa:offline-ready";

let updateServiceWorker = null;
/** يُفعَّل فقط عند ضغط المستخدم على «تحديث» — يمنع إعادة التحميل التلقائية */
let pendingUserReload = false;

/** هل يوجد تحديث بانتظار الموافقة؟ */
export function isUpdateAvailable() {
  return typeof updateServiceWorker === "function";
}

/** تفعيل التحديث (يعيد تحميل الصفحة بالنسخة الجديدة) */
export async function applyPWAUpdate() {
  if (typeof updateServiceWorker !== "function") return false;
  pendingUserReload = true;
  try {
    await updateServiceWorker(true);
    return true;
  } catch {
    // fallback: تحديث يدوي
    if (typeof window !== "undefined") window.location.reload();
    return true;
  }
}

/** يُستدعى مرة واحدة من main.jsx */
export async function initPWA() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return; // في التطوير لا يوجد SW مبني

  // إعادة التحميل فقط بعد موافقة المستخدم (زر «تحديث» في UpdatePrompt).
  // بدون ذلك، أي نشر جديد للموقع كان يفعّل SW تلقائياً ويعيد تحميل التبويب.
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!pendingUserReload) return;
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  try {
    const { registerSW } = await import("virtual:pwa-register");
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateServiceWorker = update;
        window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT));
      },
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent(PWA_OFFLINE_READY_EVENT));
      },
      onRegisteredSW(_url, registration) {
        // فحص دوري للتحديثات كل ساعة أثناء بقاء التبويب مفتوحاً
        if (registration) {
          setInterval(() => {
            registration.update().catch(() => undefined);
          }, 60 * 60 * 1000);
        }
      },
    });
  } catch {
    // متصفح غير داعم أو فشل التسجيل — التطبيق يعمل عادي بدون PWA
  }
}
