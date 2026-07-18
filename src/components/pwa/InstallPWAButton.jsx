/**
 * InstallPWAButton — production-ready PWA install CTA for the Hero section.
 *
 * - Shows only when installable and not already installed
 * - Chromium: native beforeinstallprompt
 * - iOS: guided modal (Add to Home Screen)
 * - Framer Motion entrance + hover animations
 * - Toast on successful install; silent on dismiss
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaDownload, FaMobileAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import usePWAInstall from "../../Hooks/pwa/usePWAInstall";
import IOSInstallGuideModal from "./IOSInstallGuideModal";

export default function InstallPWAButton({
  label = "تثبيت التطبيق",
  className = "",
  variant = "hero", // "hero" | "solid"
}) {
  const { canShowInstallButton, canInstallNative, isIos, promptInstall } =
    usePWAInstall();
  const [iosOpen, setIosOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Toast when install completes via browser UI or our prompt
  useEffect(() => {
    const onInstalled = () => {
      toast.success("تم تثبيت التطبيق بنجاح 🎉", {
        position: "top-center",
        autoClose: 3500,
      });
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  const handleClick = async () => {
    if (busy) return;

    // iOS: show step-by-step guide (no native prompt API)
    if (isIos && !canInstallNative) {
      setIosOpen(true);
      return;
    }

    setBusy(true);
    try {
      const result = await promptInstall();
      // accepted → appinstalled event shows toast
      // dismissed / unavailable / error → silent
      void result;
    } finally {
      setBusy(false);
    }
  };

  const baseHero =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-600 shadow-lg shadow-blue-900/20 ring-1 ring-white/60 transition hover:bg-orange-50 hover:text-orange-600 hover:shadow-orange-500/25 sm:w-auto";
  const baseSolid =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-orange-500 hover:shadow-orange-500/30 sm:w-auto";

  const buttonClass = `${variant === "solid" ? baseSolid : baseHero} ${className}`.trim();

  return (
    <>
      <AnimatePresence>
        {canShowInstallButton ? (
          <motion.div
            key="pwa-install-cta"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.15 }}
            className="w-full sm:w-auto"
          >
            <motion.button
              type="button"
              onClick={handleClick}
              disabled={busy}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={buttonClass}
              aria-label={label}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <FaDownload className="absolute text-[13px] opacity-90" />
                <FaMobileAlt className="absolute translate-x-[7px] translate-y-[6px] text-[9px] text-orange-500" />
              </span>
              {busy ? "جاري التثبيت..." : label}
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <IOSInstallGuideModal isOpen={iosOpen} onClose={() => setIosOpen(false)} />
    </>
  );
}
