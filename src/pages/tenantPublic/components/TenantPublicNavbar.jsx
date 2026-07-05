import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaBars, FaMoon, FaSun, FaTimes } from "react-icons/fa";
import { fetchTenantPublic } from "../../../api/tenantPublicApi";
import { getTenantSubdomain } from "../../../utils/tenantHost";
import {
  AnimatePresence,
  motion,
  slideDown,
} from "../tenantLandingMotion";

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
      "https://fonts.googleapis.com/css2?family=Cairo:wght@600;700&family=Tajawal:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

export function useTenantPublicTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedMode =
      typeof window !== "undefined" ? window.localStorage.getItem("tenant-public-theme") : null;
    if (savedMode === "dark") {
      setIsDarkMode(true);
      return;
    }
    if (savedMode === "light") {
      setIsDarkMode(false);
      return;
    }
    if (typeof window !== "undefined") {
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tenant-public-theme", isDarkMode ? "dark" : "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return { isDarkMode, toggleTheme };
}

function ThemeToggle({ isDark, onToggle, onDark = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
      className={`relative flex h-9 w-[4.5rem] shrink-0 items-center rounded-full p-1 transition-colors ${
        onDark ? "bg-white/15 ring-1 ring-white/20" : "bg-slate-100 dark:bg-slate-700"
      }`}
    >
      <FaSun
        className={`pointer-events-none absolute left-2.5 text-xs transition-colors ${
          !isDark ? "text-orange-500" : "text-slate-400"
        }`}
        aria-hidden
      />
      <FaMoon
        className={`pointer-events-none absolute right-2.5 text-xs transition-colors ${
          isDark ? "text-blue-400" : "text-slate-300"
        }`}
        aria-hidden
      />
      <span
        className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all duration-300 ease-out dark:bg-slate-200 ${
          isDark ? "left-[calc(100%-2rem)]" : "left-1"
        }`}
      />
    </button>
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

  const linkClass = solidNav
    ? "text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"
    : "text-white/90 hover:bg-white/10 hover:text-white";

  const loginClass = solidNav
    ? "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
    : "border-white/30 text-white hover:border-white/50 hover:bg-white/10";

  const menuBtnClass = solidNav
    ? "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:text-slate-200"
    : "border-white/30 text-white hover:bg-white/10";

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={slideDown}
      className={`fixed inset-x-0 top-0 z-50 font-[family-name:var(--tenant-nav-font,'Tajawal','Segoe_UI',Tahoma,sans-serif)] transition-all duration-300 ${
        solidNav
          ? "border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
          : "border-b border-white/10 bg-slate-950/35 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-[1200px] items-center gap-3 px-4 md:px-6">
        <a href={brandHref} className="flex min-w-0 flex-1 items-center gap-3 min-[901px]:flex-none">
          {tenantAvatar ? (
            <img
              src={tenantAvatar}
              alt=""
              className={`h-10 w-10 shrink-0 rounded-full object-cover ring-2 ${
                solidNav ? "ring-blue-100 dark:ring-blue-900/50" : "ring-white/30"
              }`}
            />
          ) : (
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                solidNav ? "bg-blue-600" : "bg-blue-600 ring-2 ring-white/25"
              }`}
            >
              {brandName.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 text-right leading-tight">
            <p
              className={`truncate font-[family-name:var(--tenant-nav-heading,'Cairo','Tajawal',sans-serif)] text-base font-bold ${
                solidNav ? "text-slate-900 dark:text-slate-100" : "text-white"
              }`}
            >
              {brandName}
            </p>
            {specialty ? (
              <p
                className={`truncate text-xs ${
                  solidNav ? "text-slate-500 dark:text-slate-400" : "text-white/75"
                }`}
              >
                {specialty}
              </p>
            ) : null}
          </div>
        </a>

        <nav
          className={`hidden items-center gap-0.5 rounded-full border px-1 py-1 min-[901px]:flex ${
            solidNav
              ? "border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/60"
              : "border-white/15 bg-white/5"
          }`}
          aria-label="التنقل الرئيسي"
        >
          {navLinks.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${linkClass}`}
            >
              {label}
            </a>
          ))}
        </nav>

        {extraNav}

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle isDark={isDarkMode} onToggle={handleToggleTheme} onDark={!solidNav} />
          <div className="hidden items-center gap-2 min-[901px]:flex">
            <a
              href={loginHref}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${loginClass}`}
            >
              تسجيل الدخول
            </a>
            <a
              href={signupHref}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              حساب جديد
            </a>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition min-[901px]:hidden ${menuBtnClass}`}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-200 bg-white px-4 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-950 min-[901px]:hidden"
          >
            <nav className="grid gap-1" aria-label="قائمة الجوال">
              {navLinks.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <a
                href={loginHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                تسجيل الدخول
              </a>
              <a
                href={signupHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600"
              >
                حساب جديد
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
    const onScroll = () => setNavScrolled(window.scrollY > 32);
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
