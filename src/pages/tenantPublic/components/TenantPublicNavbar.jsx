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
    if (document.getElementById(TENANT_FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = TENANT_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;700&display=swap";
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

function NavLinkItem({ href, label, onClick }) {
  return (
    <TenantAppLink
      href={href}
      onClick={onClick}
      className="group relative cursor-pointer px-3.5 py-2 text-sm font-semibold tracking-wide text-white/80 transition-colors duration-200 hover:text-white"
    >
      {label}
      <span
        className="absolute inset-x-3 -bottom-0.5 h-[2px] origin-right scale-x-0 rounded-full transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${TL_LIME}, ${TL_CYAN})` }}
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
}) {
  const handleToggleTheme = onToggleTheme || toggleTheme;
  const solidNav = alwaysSolid || navScrolled || isMobileMenuOpen;
  const avatarSrc = resolvePublicImageUrl(tenantAvatar);

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={slideDown}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5"
      dir="rtl"
    >
      <div
        className={`pointer-events-auto mx-auto max-w-[1200px] overflow-hidden rounded-2xl border border-white/15 backdrop-blur-xl transition-all duration-400 ${
          solidNav
            ? "bg-[#0A1628]/92 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]"
            : "bg-[#0A1628]/40 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)]"
        }`}
      >
        {/* Accent hairline */}
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, ${TL_CYAN}, ${TL_LIME}, transparent)`,
          }}
          aria-hidden
        />

        <div className="flex h-[3.85rem] items-center gap-3 px-3.5 sm:px-4 md:h-16 md:gap-4 md:px-5">
          {/* Brand */}
          <TenantAppLink
            href={brandHref}
            className="group flex min-w-0 flex-1 items-center gap-2.5 min-[920px]:flex-none min-[920px]:max-w-[280px]"
          >
            <span className="relative shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/25 transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
                  style={{
                    background: `linear-gradient(145deg, ${TL_CYAN}, #0A4A6E)`,
                  }}
                >
                  {(brandName || "م").slice(0, 1)}
                </span>
              )}
              <span
                className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#0A1628]"
                style={{ background: TL_LIME }}
                aria-hidden
              />
            </span>
            <div className="min-w-0 text-right leading-tight">
              <p className="truncate font-heading text-[0.95rem] font-extrabold tracking-tight text-white md:text-base">
                {brandName}
              </p>
              {specialty ? (
                <p className="truncate text-[11px] font-medium tracking-wide text-white/65">
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
              <NavLinkItem key={href} href={href} label={label} />
            ))}
          </nav>

          {extraNav}

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle
              isDark={isDarkMode}
              onToggle={handleToggleTheme}
            />

            <div className="hidden items-center gap-2 min-[920px]:flex">
              <TenantAppLink
                href={loginHref}
                className="cursor-pointer rounded-xl px-3.5 py-2 text-sm font-semibold text-white/85 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                تسجيل الدخول
              </TenantAppLink>
              <TenantAppLink
                href={signupHref}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-[0_8px_20px_-8px_#00A0E399] transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{ background: TL_CYAN }}
              >
                إنشاء حساب
                <FaArrowLeft className="text-[9px] opacity-90" />
              </TenantAppLink>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition-colors duration-200 hover:bg-white/18 min-[920px]:hidden"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile panel — app-style sheet */}
        <AnimatePresence>
          {isMobileMenuOpen ? (
            <motion.div
              key="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-white/10 bg-[#0A1628]/95 min-[920px]:hidden"
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
                      className="block cursor-pointer rounded-xl px-3.5 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
                    >
                      {label}
                    </TenantAppLink>
                  </motion.div>
                ))}
              </nav>

              <div className="grid grid-cols-2 gap-2 border-t border-white/10 px-3 py-3">
                <TenantAppLink
                  href={loginHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/25 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  تسجيل الدخول
                </TenantAppLink>
                <TenantAppLink
                  href={signupHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: TL_CYAN }}
                >
                  إنشاء حساب
                  <FaArrowLeft className="text-[9px]" />
                </TenantAppLink>
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
