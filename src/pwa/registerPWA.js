/**

 * تسجيل الـ Service Worker + تطبيق التحديثات تلقائياً.

 *

 * عند توفر إصدار جديد: يُفعَّل فوراً ويُعاد تحميل التطبيق بالنسخة الجديدة.

 */



export const PWA_UPDATE_EVENT = "pwa:update-available";

export const PWA_OFFLINE_READY_EVENT = "pwa:offline-ready";



let updateServiceWorker = null;

let pendingUserReload = false;

let autoUpdateInProgress = false;



/** هل يوجد تحديث قيد التطبيق؟ */

export function isUpdateAvailable() {

  return autoUpdateInProgress || typeof updateServiceWorker === "function";

}



/** تفعيل التحديث (يعيد تحميل الصفحة بالنسخة الجديدة) */

export async function applyPWAUpdate() {

  if (typeof updateServiceWorker !== "function") return false;

  if (autoUpdateInProgress) return true;

  autoUpdateInProgress = true;

  pendingUserReload = true;

  try {

    await updateServiceWorker(true);

    return true;

  } catch {

    if (typeof window !== "undefined") window.location.reload();

    return true;

  }

}



function scheduleUpdateCheck(registration) {

  if (!registration) return;

  registration.update().catch(() => undefined);

}



/** يُستدعى مرة واحدة من main.jsx */

export async function initPWA() {

  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (!import.meta.env.PROD) return;



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

        void applyPWAUpdate();

      },

      onOfflineReady() {

        window.dispatchEvent(new CustomEvent(PWA_OFFLINE_READY_EVENT));

      },

      onRegisteredSW(_url, registration) {

        if (!registration) return;



        setInterval(() => scheduleUpdateCheck(registration), 60 * 60 * 1000);



        document.addEventListener("visibilitychange", () => {

          if (document.visibilityState === "visible") {

            scheduleUpdateCheck(registration);

          }

        });



        window.addEventListener("focus", () => scheduleUpdateCheck(registration));

      },

    });

  } catch {

    // متصفح غير داعم — التطبيق يعمل بدون PWA

  }

}


