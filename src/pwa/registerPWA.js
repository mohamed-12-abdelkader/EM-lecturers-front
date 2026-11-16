/**
 * تسجيل Service Worker + كشف التحديثات وتطبيقها بصمت في البروداكشن.
 *
 * القواعد:
 * - كشف الإصدار عبر version.json + SW waiting
 * - تطبيق تلقائي فور توفر تحديث عندما لا يوجد نشاط حرج (امتحان/محاضرة)
 * - أثناء النشاط الحرج: تأجيل ثم تطبيق فور انتهائه — بدون بانر للمستخدم
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
const FORCE_RELOAD_KEY = "em-app-force-reload";
const DISMISSED_SESSION_KEY = "em-app-update-dismissed";
const VERSION_CHECK_INTERVAL_MS = 60_000;
const SW_UPDATE_CHECK_INTERVAL_MS = 5 * 60_000;

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

function trySilentApply(source = "auto") {
  // التحديث الصامت للبروداكشن فقط
  if (!import.meta.env.PROD) return;
  if (updateInProgress || pendingUserReload) return;
  if (applicationActivityManager.isCriticalActivityActive()) return;
  void applyPWAUpdate().then((result) => {
    if (result?.ok === false && result?.reason === "critical_activity") {
      // يبقى معلّقًا حتى ينتهي النشاط الحرج
    }
  });
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
        },
      }),
    );
  }
  // بدون واجهة — طبّق فورًا إن كان آمنًا
  trySilentApply(detail.source || "notify");
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
    return true;
  }
  return false;
}

function scheduleVersionChecks() {
  if (versionCheckTimer) return;
  const run = () => {
    void checkVersionManifest();
  };
  run();
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
  poke();
  setInterval(poke, SW_UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") poke();
  });
  window.addEventListener("focus", poke);
}

function reloadSafely() {
  pendingUserReload = true;
  try {
    localStorage.setItem(FORCE_RELOAD_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  window.location.reload();
}

/**
 * تطبيق التحديث بعد موافقة المستخدم فقط.
 * @returns {Promise<{ ok: boolean, reason?: string }>}
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
      // virtual:pwa-register يرسل SKIP_WAITING؛ نعيد التحميل عند controllerchange
      // وإن لم يحدث خلال مهلة قصيرة نُحمّل يدويًا
      window.setTimeout(() => {
        if (pendingUserReload && !applicationActivityManager.isCriticalActivityActive()) {
          reloadSafely();
        }
      }, 2500);
      return { ok: true };
    }

    if (registrationRef?.waiting) {
      registrationRef.waiting.postMessage({ type: "SKIP_WAITING" });
      window.setTimeout(() => {
        if (pendingUserReload && !applicationActivityManager.isCriticalActivityActive()) {
          reloadSafely();
        }
      }, 2500);
      return { ok: true };
    }

    // لا يوجد SW waiting — التحديث عبر version.json فقط
    clearPendingUpdateFlag();
    reloadSafely();
    return { ok: true };
  } catch {
    if (!applicationActivityManager.isCriticalActivityActive()) {
      reloadSafely();
      return { ok: true };
    }
    updateInProgress = false;
    pendingUserReload = false;
    return { ok: false, reason: "error" };
  }
}

/** بعد انتهاء نشاط حرج — إن وُجد تحديث معلّق طبّقه بصمت */
export function flushDeferredPWAUpdate() {
  if (!isUpdateAvailable()) return false;
  if (applicationActivityManager.isCriticalActivityActive()) return false;
  trySilentApply("activity-ended");
  return true;
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

/** البانر معطّل — التحديث يتم بصمت */
export function shouldShowUpdatePrompt() {
  return false;
}

function onControllerChange() {
  if (!pendingUserReload) return;
  if (applicationActivityManager.isLocalCriticalActivityActive()) {
    pendingUserReload = false;
    updateInProgress = false;
    notifyUpdateAvailable({ remoteBuildId, source: "deferred-controllerchange" });
    return;
  }
  reloadSafely();
}

function onForceReloadStorage(event) {
  if (event.key !== FORCE_RELOAD_KEY || !event.newValue) return;
  if (applicationActivityManager.isLocalCriticalActivityActive()) {
    notifyUpdateAvailable({ remoteBuildId, source: "other-tab-deferred" });
    return;
  }
  // تبويب آخر طبّق التحديث — أعد التحميل هنا أيضًا إن كان آمنًا
  window.location.reload();
}

function onActivityChanged() {
  if (!isUpdateAvailable()) return;
  if (applicationActivityManager.isLocalCriticalActivityActive()) return;
  trySilentApply("activity-cleared");
}

/** يُستدعى مرة واحدة من main.jsx */
export async function initPWA() {
  if (typeof window === "undefined") return;
  if (initialized) return;
  initialized = true;

  storeRunningBuildId();

  // استعادة حالة تحديث معلّق من جلسة سابقة
  if (readPendingUpdate()) {
    updateAvailable = true;
    trySilentApply("init-pending");
  }

  scheduleVersionChecks();

  window.addEventListener("storage", onForceReloadStorage);
  applicationActivityManager.subscribe(onActivityChanged);
  window.addEventListener("em:critical-activity-changed", onActivityChanged);

  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

  try {
    const { registerSW } = await import("virtual:pwa-register");
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateServiceWorker = update;
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
        }

        scheduleSwUpdateChecks(registration);
      },
    });
  } catch {
    // المتصفح لا يدعم PWA — يبقى فحص version.json
  }
}
