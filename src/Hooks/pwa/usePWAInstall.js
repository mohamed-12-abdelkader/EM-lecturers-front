/**
 * usePWAInstall — reusable hook for Progressive Web App install flows.
 *
 * Shows the install CTA whenever the app is NOT already running as installed PWA.
 * Native prompt is used when available; otherwise a guide modal is shown.
 */

import { useCallback, useEffect, useState } from "react";

const INSTALLED_KEY = "pwa_app_installed";

/** True when the app is already running as an installed PWA */
export function isRunningStandalone() {
  if (typeof window === "undefined") return false;
  const displayStandalone = window.matchMedia?.(
    "(display-mode: standalone)",
  )?.matches;
  const iosStandalone = window.navigator?.standalone === true;
  const twa = document.referrer?.startsWith("android-app://");
  return Boolean(displayStandalone || iosStandalone || twa);
}

/** iPhone / iPad (including iPadOS desktop UA) */
export function isIosDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  const iOS = /iPhone|iPad|iPod/i.test(ua);
  const iPadOs =
    navigator.platform === "MacIntel" && Number(navigator.maxTouchPoints) > 1;
  return iOS || iPadOs;
}

/** Safari on iOS */
export function isIosSafari() {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent || "";
  const isWebkit = /WebKit/i.test(ua);
  const isOtherBrowser = /CriOS|FxiOS|OPiOS|EdgiOS|Chrome|Android/i.test(ua);
  return isWebkit && !isOtherBrowser;
}

/**
 * Ensure the site service worker is registered (required for installability).
 */
export async function ensurePwaServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  // في التطوير لا يوجد SW حقيقي — /sw.js يقدّم منظّف الكاش فقط (لا تسجّله من التطبيق)
  if (import.meta.env.DEV) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
}

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    // Only trust live standalone mode — localStorage alone used to hide the button forever
    return isRunningStandalone();
  });
  const [isIos, setIsIos] = useState(false);
  const [canInstallNative, setCanInstallNative] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const markInstalled = () => {
      if (cancelled) return;
      setIsInstalled(true);
      setDeferredPrompt(null);
      setCanInstallNative(false);
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        // ignore
      }
    };

    const ios = isIosDevice();
    setIsIos(ios);

    if (isRunningStandalone()) {
      markInstalled();
      setIsReady(true);
      return () => {
        cancelled = true;
      };
    }

    // Clear stale flag from older sessions that hid the button incorrectly
    try {
      if (localStorage.getItem(INSTALLED_KEY) === "1" && !isRunningStandalone()) {
        localStorage.removeItem(INSTALLED_KEY);
      }
    } catch {
      // ignore
    }

    ensurePwaServiceWorker();

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (cancelled) return;
      setDeferredPrompt(event);
      setCanInstallNative(true);
    };

    const onAppInstalled = () => {
      markInstalled();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    const media = window.matchMedia?.("(display-mode: standalone)");
    const onDisplayModeChange = (e) => {
      if (e.matches) markInstalled();
    };
    media?.addEventListener?.("change", onDisplayModeChange);

    setIsReady(true);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      media?.removeEventListener?.("change", onDisplayModeChange);
    };
  }, []);

  /**
   * @returns {"accepted"|"dismissed"|"unavailable"|"error"}
   */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable";

    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstallNative(false);

      if (choice?.outcome === "accepted") {
        setIsInstalled(true);
        try {
          localStorage.setItem(INSTALLED_KEY, "1");
        } catch {
          // ignore
        }
        return "accepted";
      }
      return "dismissed";
    } catch {
      setDeferredPrompt(null);
      setCanInstallNative(false);
      return "error";
    }
  }, [deferredPrompt]);

  /**
   * Always show the button in the browser tab when not already running as PWA.
   * Native prompt / guide modal is decided on click.
   */
  const canShowInstallButton = isReady && !isInstalled && !isRunningStandalone();

  return {
    canShowInstallButton,
    canInstallNative,
    isIos,
    isInstalled,
    isReady,
    promptInstall,
  };
}
