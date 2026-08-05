/**
 * InstallPWAButton — PWA install CTA.
 * Always visible when not running as an installed app.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaDownload, FaMobileAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import usePWAInstall from "../../Hooks/pwa/usePWAInstall";
import IOSInstallGuideModal from "./IOSInstallGuideModal";
import DesktopInstallGuideModal from "./DesktopInstallGuideModal";
import { getTenantSubdomain } from "../../utils/tenantHost";
import { readCachedTenantPwaName } from "../../utils/tenantPwaManifest";

export default function InstallPWAButton({
  label,
  className = "",
  variant = "hero", // "hero" | "solid" | "link"
}) {
  const { canShowInstallButton, canInstallNative, isIos, promptInstall } =
    usePWAInstall();
  const [iosOpen, setIosOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const subdomain = getTenantSubdomain();
  const appName = useMemo(
    () => readCachedTenantPwaName(subdomain) || "المنصة",
    [subdomain],
  );
  const resolvedLabel = label || `تنزيل ${appName}`;

  useEffect(() => {
    const onInstalled = () => {
      toast.success(`تم تنزيل «${appName}» بنجاح 🎉`, {
        position: "top-center",
        autoClose: 3500,
      });
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [appName]);

  const handleClick = async () => {
    if (busy) return;

    // iOS: guided Add to Home Screen
    if (isIos && !canInstallNative) {
      setIosOpen(true);
      return;
    }

    // Chromium native prompt ready
    if (canInstallNative) {
      setBusy(true);
      try {
        await promptInstall();
      } finally {
        setBusy(false);
      }
      return;
    }

    // Fallback: browser menu instructions (desktop / prompt not ready yet)
    setDesktopOpen(true);
  };

  const baseHero =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-600 shadow-lg shadow-blue-900/20 ring-1 ring-white/60 transition hover:bg-orange-50 hover:text-orange-600 hover:shadow-orange-500/25 sm:w-auto";
  const baseSolid =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-orange-500 hover:shadow-orange-500/30 sm:w-auto";
  const baseLink =
    "inline-flex items-center justify-center gap-1.5 bg-transparent p-0 text-xs font-bold text-slate-500 shadow-none ring-0 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400";

  const buttonClass = `${
    variant === "solid" ? baseSolid : variant === "link" ? baseLink : baseHero
  } ${className}`.trim();

  return (
    <>
      <AnimatePresence>
        {canShowInstallButton ? (
          <motion.div
            key="pwa-install-cta"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.1 }}
            className={variant === "link" ? "w-auto" : "w-full sm:w-auto"}
          >
            <motion.button
              type="button"
              onClick={handleClick}
              disabled={busy}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={buttonClass}
              aria-label={resolvedLabel}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <FaDownload className="absolute text-[13px] opacity-90" />
                <FaMobileAlt className="absolute translate-x-[7px] translate-y-[6px] text-[9px] text-orange-500" />
              </span>
              {busy ? "جاري التنزيل..." : resolvedLabel}
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <IOSInstallGuideModal
        isOpen={iosOpen}
        onClose={() => setIosOpen(false)}
        appName={appName}
      />
      <DesktopInstallGuideModal
        isOpen={desktopOpen}
        onClose={() => setDesktopOpen(false)}
        appName={appName}
      />
    </>
  );
}
