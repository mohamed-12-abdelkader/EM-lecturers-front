/**
 * usePWA — hook موحّد لكل قدرات الـ PWA:
 * - توفر التثبيت + تنفيذ التثبيت (native / iOS guide)
 * - وضع التشغيل (متصفح أم تطبيق مثبّت)
 * - حالة الاتصال (أونلاين / أوفلاين)
 * - توفر تحديث جديد + تطبيقه
 */
import { useCallback, useEffect, useState } from "react";
import usePWAInstall, { isRunningStandalone } from "./usePWAInstall";
import useOnlineStatus from "../network/useOnlineStatus";
import {
  PWA_UPDATE_EVENT,
  applyPWAUpdate,
  isUpdateAvailable,
} from "../../pwa/registerPWA";

export default function usePWA() {
  const {
    canShowInstallButton,
    canInstallNative,
    isIos,
    isInstalled,
    isReady,
    promptInstall,
  } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [updateAvailable, setUpdateAvailable] = useState(() => isUpdateAvailable());

  useEffect(() => {
    const onUpdate = () => setUpdateAvailable(true);
    window.addEventListener(PWA_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, onUpdate);
  }, []);

  const update = useCallback(() => applyPWAUpdate(), []);

  return {
    // التثبيت
    canInstall: canShowInstallButton,
    canInstallNative,
    isIos,
    isInstalled,
    isReady,
    install: promptInstall,
    // وضع التشغيل
    isStandalone: isRunningStandalone(),
    // الشبكة
    isOnline,
    isOffline: !isOnline,
    // التحديثات
    updateAvailable,
    update,
  };
}
