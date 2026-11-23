/**
 * تسجيل Service Worker + كشف التحديثات بدون أي ريلود تلقائي.
 *
 * القواعد:
 * - أثناء فتح المنصة: لا location.reload ولا SKIP_WAITING
 * - التحديث الجديد ينتظر في الخلفية فقط
 * - التعديلات تظهر فقط بعد ريلود يدوي من المستخدم
 */

import applicationActivityManager from "../utils/applicationActivityManager";
import {
  fetchDeployedVersion,
  getRunningBuildId,
  isNewerBuild,
} from "../utils/appVersion";
import {
  PWA_OFFLINE_READY_EVENT,
  PWA_UPDATE_DISMISSED_EVENT,
  PWA_UPDATE_EVENT,
} from "./pwaEvents";

export {
  PWA_OFFLINE_READY_EVENT,
  PWA_UPDATE_DISMISSED_EVENT,
  PWA_UPDATE_EVENT,
};

const BUILD_ID_STORAGE_KEY = "em-app-build-id";
const PENDING_UPDATE_KEY = "em-app-update-pending";
const DISMISSED_SESSION_KEY = "em-app-update-dismissed";
const VERSION_CHECK_INTERVAL_MS = 5 * 60_000;
const SW_UPDATE_CHECK_INTERVAL_MS = 10 * 60_000;

let updateServiceWorker = null;
let registrationRef = null;
let pendingUserReload = false;
let updateInProgress = false;
let updateAvailable = false;
let remoteBuildId = null;
let versionCheckTimer = null;
let initialized = false;

function isDismissedThisSession() {
  try {
    return sessionStorage.getItem(DISMISSED_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function notifyUpdateAvailable(detail = {}) {
  updateAvailable = true;
  try {
    localStorage.setItem(
      PENDING_UPDATE_KEY,
      JSON.stringify({
        at: Date.now(),
        remoteBuildId: detail.remoteBuildId || remoteBuildId,
        source: detail.source || "unknown",
      }),
    );
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PWA_UPDATE_EVENT, {
        detail: {
          remoteBuildId: detail.remoteBuildId || remoteBuildId,
          source: detail.source || "unknown",
          criticalActive: applicationActivityManager.isCriticalActivityActive(),
          dismissed: isDismissedThisSession(),
          silent: true,
          deferUntilNextVisit: true,
        },
      }),
    );
  }
}

function clearPendingUpdateFlag() {
  try {
    localStorage.removeItem(PENDING_UPDATE_KEY);
  } catch {
    /* ignore */
  }
}

export function isUpdateAvailable() {
  return updateAvailable || Boolean(readPendingUpdate());
}

export function getPendingUpdateInfo() {
  return {
    available: isUpdateAvailable(),
    remoteBuildId,
    localBuildId: getRunningBuildId(),
  };
}

function readPendingUpdate() {
  try {
    const raw = localStorage.getItem(PENDING_UPDATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeRunningBuildId() {
  const buildId = getRunningBuildId();
  if (!buildId) return;
  try {
    localStorage.setItem(BUILD_ID_STORAGE_KEY, buildId);
  } catch {
    /* ignore */
  }
}

async function checkVersionManifest() {
  const remote = await fetchDeployedVersion();
  if (!remote?.buildId) return false;
  remoteBuildId = remote.buildId;
  if (isNewerBuild(remote.buildId)) {
    notifyUpdateAvailable({ remoteBuildId: remote.buildId, source: "version.json" });
    registrationRef?.update?.().catch(() => undefined);
    return true;
  }
  return false;
}

function scheduleVersionChecks() {
  if (versionCheckTimer) return;
  const run = () => {
    void checkVersionManifest();
  };
  window.setTimeout(run, 15_000);
  versionCheckTimer = window.setInterval(run, VERSION_CHECK_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") run();
  });
  window.addEventListener("online", run);
}

function scheduleSwUpdateChecks(registration) {
  if (!registration) return;
  const poke = () => {
    registration.update().catch(() => undefined);
  };
  window.setTimeout(poke, 20_000);
  setInterval(poke, SW_UPDATE_CHECK_INTERVAL_MS);
}

function reloadSafely() {
  pendingUserReload = true;
  window.location.reload();
}

/**
 * تطبيق التحديث يدوياً فقط (زر صريح من المستخدم).
 * لا يُستدعى تلقائياً أثناء الجلسة.
 */
export async function applyPWAUpdate() {
  if (updateInProgress) return { ok: true, reason: "in_progress" };

  if (applicationActivityManager.isCriticalActivityActive()) {
    return { ok: false, reason: "critical_activity" };
  }

  updateInProgress = true;
  pendingUserReload = true;

  try {
    if (typeof updateServiceWorker === "function") {
      await updateServiceWorker(true);
      window.setTimeout(() => {
        if (pendingUserReload) reloadSafely();
      }, 2500);
      return { ok: true };
    }

    if (registrationRef?.waiting) {
      registrationRef.waiting.postMessage({ type: "SKIP_WAITING" });
      window.setTimeout(() => {
        if (pendingUserReload) reloadSafely();
      }, 2500);
      return { ok: true };
    }

    clearPendingUpdateFlag();
    reloadSafely();
    return { ok: true };
  } catch {
    updateInProgress = false;
    pendingUserReload = false;
    return { ok: false, reason: "error" };
  }
}

/** لا تفعيل تلقائي بعد انتهاء النشاط */
export function flushDeferredPWAUpdate() {
  return false;
}

export function dismissUpdatePrompt() {
  try {
    sessionStorage.setItem(DISMISSED_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PWA_UPDATE_DISMISSED_EVENT));
  }
}

export function shouldShowUpdatePrompt() {
  return false;
}

function onControllerChange() {
  // ريلود فقط إذا طلب هذا التبويب التفعيل صراحةً (زر تحديث يدوي)
  if (!pendingUserReload) return;
  clearPendingUpdateFlag();
  reloadSafely();
}

/** يُستدعى مرة واحدة من main.jsx */
export async function initPWA() {
  if (typeof window === "undefined") return;
  if (initialized) return;
  initialized = true;

  storeRunningBuildId();

  if (readPendingUpdate()) {
    updateAvailable = true;
  }

  scheduleVersionChecks();

  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

  try {
    const { registerSW } = await import("virtual:pwa-register");
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateServiceWorker = update;
        // متاح في الخلفية فقط — بدون SKIP_WAITING وبدون ريلود
        notifyUpdateAvailable({ remoteBuildId, source: "service-worker" });
      },
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent(PWA_OFFLINE_READY_EVENT));
      },
      onRegisteredSW(_url, registration) {
        registrationRef = registration || null;
        updateServiceWorker = update;

        if (registration?.waiting) {
          notifyUpdateAvailable({ remoteBuildId, source: "service-worker-waiting" });
          // لا نفعّل الـ SW المنتظر تلقائياً — ينتظر ريلود/فتح يدوي لاحقاً
        }

        scheduleSwUpdateChecks(registration);
      },
    });
  } catch {
    // المتصفح لا يدعم PWA — يبقى فحص version.json للعلم فقط
  }
}
