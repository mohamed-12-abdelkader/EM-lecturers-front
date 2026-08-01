/**
 * InstallAppPrompt — نافذة تثبيت مخصصة تظهر تلقائياً عند دخول منصة أي مدرس
 * (subdomain) بعد فترة قصيرة من التصفح.
 *
 * القواعد:
 * - لا تظهر داخل التطبيق المثبّت (standalone) أو بعد التثبيت.
 * - قابلة للإغلاق — ولا تعود قبل مرور فترة التهدئة (3 أيام).
 * - iOS: دليل "الإضافة للشاشة الرئيسية". Chromium: النافذة الأصلية مباشرة.
 * - يمكن فتحها يدوياً من أي مكان عبر: window.dispatchEvent(new Event("pwa:open-install"))
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaDownload, FaMobileAlt, FaBolt, FaWifi, FaBell } from "react-icons/fa";
import usePWAInstall from "../../Hooks/pwa/usePWAInstall";
import IOSInstallGuideModal from "./IOSInstallGuideModal";
import DesktopInstallGuideModal from "./DesktopInstallGuideModal";
import { getTenantSubdomain } from "../../utils/tenantHost";
import { readCachedTenantBrandLogo } from "../../utils/tenantBrandLogo";
import { safeLocalGet, safeLocalSet } from "../../utils/safeStorage";

const DISMISSED_AT_KEY = "pwa_install_prompt_dismissed_at";
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 أيام
const AUTO_SHOW_DELAY_MS = 14_000;
export const OPEN_INSTALL_PROMPT_EVENT = "pwa:open-install";

function isInCooldown() {
  const raw = safeLocalGet(DISMISSED_AT_KEY);
  if (!raw) return false;
  const at = Number(raw);
  return Number.isFinite(at) && Date.now() - at < COOLDOWN_MS;
}

const FEATURES = [
  { Icon: FaBolt, text: "فتح أسرع" },
  { Icon: FaWifi, text: "يعمل بدون نت" },
  { Icon: FaBell, text: "إشعارات فورية" },
];

export default function InstallAppPrompt() {
  const { canShowInstallButton, canInstallNative, isIos, promptInstall } =
    usePWAInstall();
  const [open, setOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const tenantSubdomain = getTenantSubdomain();
  const teacherLogo = useMemo(
    () => (tenantSubdomain ? readCachedTenantBrandLogo(tenantSubdomain) : null),
    [tenantSubdomain],
  );

  // ظهور تلقائي على منصة المدرس بعد فترة من التصفح
  useEffect(() => {
    if (!tenantSubdomain) return undefined;
    if (!canShowInstallButton) return undefined;
    if (isInCooldown()) return undefined;

    const timer = setTimeout(() => setOpen(true), AUTO_SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [tenantSubdomain, canShowInstallButton]);

  // فتح يدوي (من الإعدادات أو أي زر)
  useEffect(() => {
    const onOpen = () => {
      if (canShowInstallButton) setOpen(true);
    };
    window.addEventListener(OPEN_INSTALL_PROMPT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_INSTALL_PROMPT_EVENT, onOpen);
  }, [canShowInstallButton]);

  const dismiss = () => {
    safeLocalSet(DISMISSED_AT_KEY, String(Date.now()));
    setOpen(false);
  };

  const handleInstall = async () => {
    if (busy) return;
    if (canInstallNative) {
      setBusy(true);
      try {
        const outcome = await promptInstall();
        if (outcome === "accepted") setOpen(false);
        else dismiss();
      } finally {
        setBusy(false);
      }
      return;
    }
    setOpen(false);
    if (isIos) setIosOpen(true);
    else setDesktopOpen(true);
  };

  // بعد التثبيت أو داخل التطبيق: لا شيء يُعرض
  const shouldRender = open && canShowInstallButton;

  return (
    <>
      <AnimatePresence>
        {shouldRender ? (
          <motion.div
            key="pwa-install-sheet"
            dir="rtl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center"
            onClick={dismiss}
          >
            <motion.div
              initial={{ y: 90, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 90, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              role="dialog"
              aria-label="تنزيل المنصة"
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
              className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-800 sm:rounded-3xl"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-600 sm:hidden" />

              <div className="flex items-center gap-3.5">
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-md dark:border-slate-600">
                  <img
                    src={teacherLogo || "/icons/icon-192.png"}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    ثبّت المنصة على جهازك
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    افتحها من الشاشة الرئيسية كتطبيق حقيقي — بدون متصفح.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {FEATURES.map(({ Icon, text }) => (
                  <div
                    key={text}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 py-3 text-center dark:bg-slate-700/50"
                  >
                    <Icon className="text-sm text-blue-500 dark:text-blue-300" />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={busy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
                >
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <FaDownload className="absolute text-[13px]" />
                    <FaMobileAlt className="absolute translate-x-[7px] translate-y-[6px] text-[9px] text-orange-300" />
                  </span>
                  {busy ? "جاري التنزيل..." : "تنزيل المنصة"}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  ليس الآن
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <IOSInstallGuideModal isOpen={iosOpen} onClose={() => setIosOpen(false)} />
      <DesktopInstallGuideModal
        isOpen={desktopOpen}
        onClose={() => setDesktopOpen(false)}
      />
    </>
  );
}
