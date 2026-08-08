/**
 * InstallAppPrompt — موديل تثبيت أنيق وسريع لمنصة المدرس.
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaDownload, FaBolt, FaHome } from "react-icons/fa";
import usePWAInstall from "../../Hooks/pwa/usePWAInstall";
import IOSInstallGuideModal from "./IOSInstallGuideModal";
import DesktopInstallGuideModal from "./DesktopInstallGuideModal";
import { getTenantSubdomain } from "../../utils/tenantHost";
import {
  readCachedTenantBrandLogo,
  resolveTenantBrandLogo,
} from "../../utils/tenantBrandLogo";
import { readCachedTenantPublic } from "../../api/tenantPublicApi";
import {
  readCachedTenantPwaName,
  resolveTenantPwaBranding,
} from "../../utils/tenantPwaManifest";
import { safeLocalGet, safeLocalSet } from "../../utils/safeStorage";

const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const AUTO_SHOW_DELAY_MS = 900;
export const OPEN_INSTALL_PROMPT_EVENT = "pwa:open-install";

function dismissKey(subdomain) {
  return subdomain
    ? `pwa_install_prompt_dismissed_at:${subdomain}`
    : "pwa_install_prompt_dismissed_at";
}

function isInCooldown(subdomain) {
  const raw = safeLocalGet(dismissKey(subdomain));
  if (!raw) return false;
  const at = Number(raw);
  return Number.isFinite(at) && Date.now() - at < COOLDOWN_MS;
}

function readTenantBrand(subdomain) {
  if (!subdomain) {
    return { name: "المنصة", logo: null, description: null };
  }
  const cached = readCachedTenantPublic(subdomain);
  const branding = cached?.data?.tenant
    ? resolveTenantPwaBranding(cached.data.tenant, cached.data.teacher, subdomain)
    : null;
  const tenant = cached?.data?.tenant;
  const teacher = cached?.data?.teacher;
  return {
    name:
      branding?.name ||
      readCachedTenantPwaName(subdomain) ||
      subdomain.replace(/[-_]+/g, " "),
    logo:
      branding?.iconUrl ||
      readCachedTenantBrandLogo(subdomain) ||
      resolveTenantBrandLogo(tenant, teacher) ||
      null,
    description:
      branding?.description ||
      tenant?.bio ||
      teacher?.description ||
      tenant?.specialty ||
      null,
  };
}

export default function InstallAppPrompt() {
  const { canShowInstallButton, canInstallNative, isIos, promptInstall } =
    usePWAInstall();
  const [open, setOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [brandTick, setBrandTick] = useState(0);
  const [manifestReady, setManifestReady] = useState(false);

  const tenantSubdomain = getTenantSubdomain();
  const brand = useMemo(
    () => readTenantBrand(tenantSubdomain),
    [tenantSubdomain, brandTick],
  );

  useEffect(() => {
    const onReady = () => {
      setBrandTick((n) => n + 1);
      setManifestReady(true);
    };
    window.addEventListener("pwa:tenant-manifest-ready", onReady);
    if (tenantSubdomain) {
      const cached = readTenantBrand(tenantSubdomain);
      if (cached.name) setManifestReady(true);
    }
    return () => window.removeEventListener("pwa:tenant-manifest-ready", onReady);
  }, [tenantSubdomain]);

  useEffect(() => {
    if (!tenantSubdomain) return undefined;
    if (!canShowInstallButton) return undefined;
    if (isInCooldown(tenantSubdomain)) return undefined;
    if (!manifestReady) return undefined;

    const timer = setTimeout(() => setOpen(true), AUTO_SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [tenantSubdomain, canShowInstallButton, manifestReady]);

  useEffect(() => {
    const onOpen = () => {
      if (canShowInstallButton) setOpen(true);
    };
    window.addEventListener(OPEN_INSTALL_PROMPT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_INSTALL_PROMPT_EVENT, onOpen);
  }, [canShowInstallButton]);

  const dismiss = () => {
    safeLocalSet(dismissKey(tenantSubdomain), String(Date.now()));
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

  const shouldRender = open && canShowInstallButton;
  const appName = brand.name || "المنصة";
  const logoSrc = brand.logo || "/icons/icon-192.png";
  const ctaLabel = `تنزيل منصة ${appName}`;
  const description =
    brand.description ||
    `ثبّت منصة ${appName} على جهازك وافتحها مباشرة من الشاشة الرئيسية كتطبيق مستقل — أسرع وأسهل في المتابعة.`;

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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/50 backdrop-blur-[3px] sm:items-center sm:p-4"
            onClick={dismiss}
          >
            <motion.div
              initial={{ y: 72, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 48, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              role="dialog"
              aria-label={ctaLabel}
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
              className="relative w-full max-w-[400px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_24px_80px_-12px_rgba(15,23,42,0.45)] dark:bg-slate-900 sm:rounded-[28px]"
            >
              {/* شريط علوي متدرج */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-orange-500 px-5 pb-10 pt-4">
                <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-8 -right-6 h-28 w-28 rounded-full bg-orange-300/30 blur-2xl" />

                <div className="relative mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/35 sm:hidden" />

                <div className="relative flex items-center gap-3.5">
                  <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[18px] border-2 border-white/50 bg-white shadow-lg shadow-blue-900/20 ring-4 ring-white/15">
                    <img
                      src={logoSrc}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  </span>
                  <div className="min-w-0 flex-1 text-white">
                    <p className="text-[11px] font-bold tracking-wide text-white/75">
                      تثبيت سريع على جهازك
                    </p>
                    <h3 className="mt-0.5 truncate text-lg font-extrabold leading-snug drop-shadow-sm">
                      منصة {appName}
                    </h3>
                  </div>
                </div>
              </div>

              {/* جسم الموديل */}
              <div className="relative -mt-6 px-5 pb-5">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-[13px] leading-7 text-slate-600 dark:text-slate-300">
                    {description}
                  </p>

                  <div className="mt-3.5 flex gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                      <FaBolt className="text-[10px]" />
                      فتح أسرع
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
                      <FaHome className="text-[10px]" />
                      من الشاشة الرئيسية
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleInstall}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-blue-600 to-blue-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-700 hover:to-blue-600 active:scale-[0.985] disabled:opacity-70"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20">
                      <FaDownload className="text-[13px]" />
                    </span>
                    {busy ? "جاري التنزيل..." : ctaLabel}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="w-full rounded-2xl py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    ليس الآن
                  </button>
                </div>
              </div>
            </motion.div>
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
