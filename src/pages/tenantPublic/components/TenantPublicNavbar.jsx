import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaArrowLeft, FaBars, FaMoon, FaSun, FaTimes } from "react-icons/fa";
import { fetchTenantPublic } from "../../../api/tenantPublicApi";
import { getTenantSubdomain } from "../../../utils/tenantHost";
import {
  AnimatePresence,
  motion,
  slideDown,
} from "../tenantLandingMotion";
import { TL_CYAN, TL_LIME } from "../tenantLandingTheme";
import { safeLocalGet, safeLocalSet } from "../../../utils/safeStorage";
import { resolvePublicImageUrl } from "../../../utils/highQualityImageUrl";
import TenantAppLink from "./TenantAppLink";

const TENANT_FONT_LINK_ID = "tenant-public-arabic-fonts";

export const TENANT_NAV_LINKS = [
  ["/", "الرئيسية"],
  ["/teacher", "المدرس"],
  ["/courses", "الكورسات"],
  ["/#videos", "محاضرات مجانية"],
];

export const TENANT_SITE_NAV_LINKS = TENANT_NAV_LINKS.map(([href, label]) => [
  href.startsWith("#") ? `/${href}` : href,
  label,
]);

function useTenantArabicFonts() {
  useEffect(() => {
    const existing = document.getElementById(TENANT_FONT_LINK_ID);
    const cairoHref =
      "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap";
    if (existing) {
      if (!String(existing.href || "").includes("Cairo")) {
        existing.href = cairoHref;
      }
      return;
    }
    const link = document.createElement("link");
    link.id = TENANT_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = cairoHref;
    document.head.appendChild(link);
  }, []);
}

export function useTenantPublicTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedMode = safeLocalGet("tenant-public-theme");
      if (savedMode === "dark") {
        setIsDarkMode(true);
      } else if (savedMode === "light") {
        setIsDarkMode(false);
      } else if (typeof window !== "undefined" && window.matchMedia) {
        setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    } catch {
      setIsDarkMode(false);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    safeLocalSet("tenant-public-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode, hydrated]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return { isDarkMode, toggleTheme };
}

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
      className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition-all duration-200 hover:bg-white/18"
    >
      {isDark ? <FaSun className="text-sm" style={{ color: TL_LIME }} /> : <FaMoon className="text-sm" />}
    </button>
  );
}

function NavLinkItem({ href, label, onClick, accent, accent2, color }) {
  return (
    <TenantAppLink
      href={href}
      onClick={onClick}
      className="group relative cursor-pointer px-3.5 py-2 text-sm font-semibold tracking-wide transition-opacity duration-200 hover:opacity-100"
      style={{ color: color || "rgba(255,255,255,0.82)" }}
    >
      {label}
      <span
        className="absolute inset-x-3 -bottom-0.5 h-[2px] origin-right scale-x-0 rounded-full transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${accent2 || TL_LIME}, ${accent || TL_CYAN})` }}
        aria-hidden
      />
    </TenantAppLink>
  );
}

export function TenantPublicNavbar({
  brandName,
  specialty,
  tenantAvatar,
  loginHref = "/login",
  signupHref = "/signup",
  showSignup = true,
  isDarkMode,
  onToggleTheme,
  toggleTheme,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  navScrolled,
  alwaysSolid = false,
  brandHref = "/",
  navLinks = TENANT_SITE_NAV_LINKS,
  extraNav = null,
  chrome = null,
}) {
  const handleToggleTheme = onToggleTheme || toggleTheme;
  const canToggleTheme = typeof handleToggleTheme === "function" && Boolean(onToggleTheme || toggleTheme);
  const solidNav = alwaysSolid || navScrolled || isMobileMenuOpen;
  const navBg = chrome ? (solidNav ? chrome.navSolid : chrome.nav) : null;
  const accent = chrome?.accent || TL_CYAN;
  const accent2 = chrome?.accent2 || TL_LIME;
  const signupFg = chrome?.signupFg || "#FFFFFF";
  const isLightChrome = chrome?.tone === "light";
  const navFg = chrome?.fg || "#FFFFFF";
  const navMuted = chrome?.muted || "rgba(255,255,255,0.78)";
  const navBorder = chrome?.border || "rgba(255,255,255,0.15)";
  const navHover = chrome?.hoverBg || "rgba(255,255,255,0.10)";
  const avatarSrc = resolvePublicImageUrl(tenantAvatar);
  const showThemeToggle = canToggleTheme && !isLightChrome && chrome?.tone !== "dark";

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={slideDown}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5"
      dir="rtl"
    >
      <div
        className={`pointer-events-auto mx-auto max-w-[1200px] overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-400 ${
          chrome
            ? isLightChrome
              ? "shadow-[0_12px_40px_-16px_rgba(15,23,42,0.22)]"
              : "shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]"
            : solidNav
            ? "bg-[#0A1628]/92 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]"
            : "bg-[#0A1628]/40 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)]"
        }`}
        style={{
          ...(navBg ? { background: navBg } : null),
          border: `1px solid ${chrome ? navBorder : "rgba(255,255,255,0.15)"}`,
        }}
      >
        {/* Accent hairline */}
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accent2}, transparent)`,
          }}
          aria-hidden
        />

        <div className="flex h-[3.85rem] items-center gap-2.5 px-3.5 sm:gap-3 sm:px-4 md:h-16 md:gap-4 md:px-5">
          {/* Brand — اسم المدرس ظاهر دائمًا */}
          <TenantAppLink
            href={brandHref}
            className="group flex min-w-0 flex-1 items-center gap-2.5 min-[920px]:flex-none min-[920px]:max-w-[300px]"
          >
            <span className="relative shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-10 w-10 rounded-xl object-cover ring-2 transition-transform duration-300 group-hover:scale-[1.03]"
                  style={{ boxShadow: `0 0 0 2px ${isLightChrome ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.25)"}` }}
                />
              ) : (
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
                  style={{
                    background: `linear-gradient(145deg, ${accent}, ${accent2 || "#0A4A6E"})`,
                  }}
                >
                  {(brandName || "م").slice(0, 1)}
                </span>
              )}
              <span
                className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full ring-2"
                style={{
                  background: accent2,
                  boxShadow: `0 0 0 2px ${isLightChrome ? "#fff" : "#0A1628"}`,
                }}
                aria-hidden
              />
            </span>
            <div className="min-w-0 text-right leading-tight">
              <p
                className="truncate font-heading text-[0.95rem] font-extrabold tracking-tight md:text-base"
                style={{ color: navFg }}
              >
                {brandName || "منصة المدرس"}
              </p>
              {specialty ? (
                <p
                  className="truncate text-[11px] font-medium tracking-wide"
                  style={{ color: navMuted }}
                >
                  {specialty}
                </p>
              ) : null}
            </div>
          </TenantAppLink>

          {/* Desktop links — centered cluster */}
          <nav
            className="mx-auto hidden items-center gap-0.5 min-[920px]:flex"
            aria-label="التنقل الرئيسي"
          >
            {navLinks.map(([href, label]) => (
              <NavLinkItem
                key={href}
                href={href}
                label={label}
                accent={accent}
                accent2={accent2}
                color={navMuted}
              />
            ))}
          </nav>

          {extraNav}

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {showThemeToggle ? (
              <ThemeToggle isDark={isDarkMode} onToggle={handleToggleTheme} />
            ) : null}

            {/* تسجيل الدخول ظاهر من sm، وإنشاء حساب من سطح المكتب؛ على الموبايل داخل القائمة */}
            <TenantAppLink
              href={loginHref}
              className="hidden cursor-pointer rounded-xl px-3 py-2 text-sm font-bold transition-colors duration-200 sm:inline-flex"
              style={{ color: navFg, background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = navHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              تسجيل الدخول
            </TenantAppLink>
            {showSignup ? (
              <TenantAppLink
                href={signupHref}
                className="hidden cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)] transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98] min-[920px]:inline-flex"
                style={{ background: accent, color: signupFg }}
              >
                إنشاء حساب
                <FaArrowLeft className="text-[9px] opacity-90" />
              </TenantAppLink>
            ) : null}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200 min-[920px]:hidden"
              style={{
                background: navHover,
                color: navFg,
              }}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <AnimatePresence>
          {isMobileMenuOpen ? (
            <motion.div
              key="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden min-[920px]:hidden"
              style={{
                background: chrome?.navSolid || "rgba(10,22,40,0.95)",
                borderTop: `1px solid ${navBorder}`,
              }}
            >
              <nav className="grid gap-0.5 px-3 py-3" aria-label="قائمة الجوال">
                {navLinks.map(([href, label], i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <TenantAppLink
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block cursor-pointer rounded-xl px-3.5 py-3.5 text-sm font-semibold transition-colors"
                      style={{ color: navFg }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = navHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {label}
                    </TenantAppLink>
                  </motion.div>
                ))}
              </nav>

              <div
                className={`grid gap-2 px-3 py-3 ${showSignup ? "grid-cols-2" : "grid-cols-1"}`}
                style={{ borderTop: `1px solid ${navBorder}` }}
              >
                <TenantAppLink
                  href={loginHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-bold"
                  style={{ border: `1.5px solid ${navBorder}`, color: navFg }}
                >
                  تسجيل الدخول
                </TenantAppLink>
                {showSignup ? (
                  <TenantAppLink
                    href={signupHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-bold"
                    style={{ background: accent, color: signupFg }}
                  >
                    إنشاء حساب
                    <FaArrowLeft className="text-[9px]" />
                  </TenantAppLink>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

/**
 * نافبار المستأجر الجاهز — يُستخدم في اللاندنج وتسجيل الدخول وإنشاء الحساب.
 */
export function TenantPublicNavbarShell({
  variant = "landing",
  loginHref = "/login",
  signupHref = "/signup",
  showSignup = true,
}) {
  const subdomain = getTenantSubdomain();
  const { isDarkMode, toggleTheme } = useTenantPublicTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(variant === "auth");
  const isAuth = variant === "auth";

  useTenantArabicFonts();

  const { data } = useQuery({
    queryKey: ["tenant-public", subdomain],
    queryFn: () => fetchTenantPublic(subdomain),
    enabled: Boolean(subdomain),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isAuth) return undefined;
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isAuth]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const onScroll = () => {
      if (window.scrollY > 80) setIsMobileMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobileMenuOpen]);

  if (!subdomain) return null;

  const tenant = data?.data?.tenant;
  const brandName = tenant?.display_name || tenant?.name || subdomain;
  const specialty =
    tenant?.specialty ||
    tenant?.tagline ||
    data?.data?.landing?.hero?.subtitle ||
    "";

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <TenantPublicNavbar
        brandName={brandName}
        specialty={specialty}
        tenantAvatar={tenant?.avatar_url}
        loginHref={loginHref}
        signupHref={signupHref}
        showSignup={showSignup}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        navScrolled={navScrolled}
        alwaysSolid={isAuth}
        brandHref="/"
      />
    </div>
  );
}
