/**
 * usePWAInstall — reusable hook for Progressive Web App install flows.
 *
 * Handles:
 * - Chromium `beforeinstallprompt` (Android / Chrome / Edge)
 * - iOS Safari "Add to Home Screen" guidance (no native prompt API)
 * - Hiding the CTA when already installed (standalone / iOS standalone)
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

/** Safari on iOS (excludes Chrome/Firefox/CriOS on iOS where A2HS differs) */
export function isIosSafari() {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent || "";
  const isWebkit = /WebKit/i.test(ua);
  const isOtherBrowser = /CriOS|FxiOS|OPiOS|EdgiOS|Chrome|Android/i.test(ua);
  return isWebkit && !isOtherBrowser;
}

/**
 * Ensure the site service worker is registered (required for installability).
 * Safe to call multiple times — browsers dedupe by script URL.
 */
export async function ensurePwaServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
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
    return (
      isRunningStandalone() || localStorage.getItem(INSTALLED_KEY) === "1"
    );
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
        // ignore quota / private mode
      }
    };

    // Hydration-safe: detect platform after mount
    const ios = isIosDevice();
    setIsIos(ios);

    if (isRunningStandalone()) {
      markInstalled();
      setIsReady(true);
      return () => {
        cancelled = true;
      };
    }

    ensurePwaServiceWorker();

    const onBeforeInstallPrompt = (event) => {
      // Prevent the mini-infobar; we show our own CTA
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

    // Listen for display-mode changes (user installed mid-session)
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
   * Trigger the native install prompt when available.
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

  /** Show install CTA: native prompt ready, or iOS guidance needed */
  const canShowInstallButton =
    isReady &&
    !isInstalled &&
    (canInstallNative || (isIos && !isRunningStandalone()));

  return {
    /** Whether the custom install button should render */
    canShowInstallButton,
    /** Chromium deferred prompt is available */
    canInstallNative,
    /** Running on iOS — use Add to Home Screen modal instead */
    isIos,
    isInstalled,
    isReady,
    promptInstall,
  };
}
