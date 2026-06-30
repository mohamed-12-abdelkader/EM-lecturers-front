import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaBookOpen,
  FaChalkboardTeacher,
  FaClipboardList,
  FaFacebook,
  FaInstagram,
  FaTelegram,
  FaVideo,
  FaWhatsapp,
  FaPlay,
  FaArrowLeft,
  FaUsers,
  FaGraduationCap,
  FaAward,
} from "react-icons/fa";
import {
  fetchTenantPublic,
  fetchPlatformPublicFreeLectures,
  fetchPlatformPublicCourses,
} from "../../api/tenantPublicApi";
import FreeLecturePlayerModal from "./components/FreeLecturePlayerModal";
import {
  TenantPublicNavbar,
  TENANT_NAV_LINKS,
  useTenantPublicTheme,
} from "./components/TenantPublicNavbar";
import {
  motion,
  AnimatePresence,
  Reveal,
  StaggerGrid,
  StaggerItem,
  HeroKenBurns,
  HeroGlowOrb,
  MotionCard,
  fadeUp,
  staggerContainer,
  staggerItem,
} from "./tenantLandingMotion";
import { useTenantPageMetadata } from "../../Hooks/tenantPublic/useTenantPageMetadata";

const TENANT_FONT_LINK_ID = "tenant-public-arabic-fonts";
const TENANT_FONT_BODY = "'Tajawal', 'Segoe UI', Tahoma, sans-serif";
const TENANT_FONT_HEADING = "'Cairo', 'Tajawal', sans-serif";

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

function buildCssVars(theme) {
  if (!theme) return {};
  return {
    "--t-primary": theme.primary_color || "#0f172a",
    "--t-secondary": theme.secondary_color || "#64748b",
    "--t-accent": theme.accent_color || "#3b82f6",
    "--t-text": theme.text_color || "#1e293b",
    "--t-font-body": theme.font_body_size || "1rem",
    "--t-line-body": theme.line_height_body || "1.75",
    "--t-weight-heading": theme.font_weight_heading || "800",
    "--t-max": theme.layout_max_width || "1200px",
  };
}

const SERVICE_ICONS = [FaChalkboardTeacher, FaBookOpen, FaVideo, FaClipboardList];

const SERVICE_DESC_FALLBACK = [
  "شرح واضح ومنظم يساعدك تفهم الدرس خطوة بخطوة.",
  "متابعة مستواك وتوجيهك للخطوة التالية.",
  "أسئلة وتطبيقات عملية تثبت المعلومة.",
  "إجابة على استفساراتك ومتابعة تقدمك.",
];

/** تنويع بسيط — أزرق / برتقالي */
const SERVICE_ACCENT = [
  { iconBg: "bg-blue-50 text-blue-600", border: "border-blue-100" },
  { iconBg: "bg-orange-50 text-orange-600", border: "border-orange-100" },
  { iconBg: "bg-blue-50 text-blue-600", border: "border-blue-100" },
  { iconBg: "bg-orange-50 text-orange-600", border: "border-orange-100" },
];

function ServiceFeatureCard({ service, index, className = "" }) {
  const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
  const accent = SERVICE_ACCENT[index % SERVICE_ACCENT.length];
  const description =
    service.description?.trim() || SERVICE_DESC_FALLBACK[index % SERVICE_DESC_FALLBACK.length];

  return (
    <MotionCard>
      <motion.article
        whileHover={{ borderColor: "rgba(59, 130, 246, 0.35)" }}
        className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600/40 ${className}`}
      >
        <motion.div
          className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${accent.iconBg}`}
          whileHover={{ rotate: [0, -6, 6, 0], scale: 1.05 }}
          transition={{ duration: 0.45 }}
        >
          <Icon className="text-lg" />
        </motion.div>
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100 md:text-lg">
          {service.title}
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</p>
      </motion.article>
    </MotionCard>
  );
}

function formatCoursePrice(rawPrice, isFreeFlag) {
  if (isFreeFlag) return { label: "مجاني", isFree: true };
  const priceNum = Number(rawPrice);
  const hasPrice =
    rawPrice != null && String(rawPrice).trim() !== "" && !Number.isNaN(priceNum);
  if (!hasPrice) return { label: "مجاني", isFree: true };
  if (priceNum === 0) return { label: "مجاني", isFree: true };
  return { label: `${priceNum.toLocaleString("ar-EG")} ج.م`, isFree: false };
}

function courseIsFree(course) {
  if (course?.is_free != null) return Boolean(course.is_free);
  if (course?.isFree != null) return Boolean(course.isFree);
  const priceNum = Number(course?.price);
  return Number.isFinite(priceNum) && priceNum === 0;
}

function CourseCard({ course, courseFallbackImage, loginHref }) {
  const courseTitle = (course.title || course.name || "كورس").trim();
  const ownCourseImage =
    course.image_url || course.cover_url || course.thumbnail || course.avatar;
  const usesFallbackImage = !ownCourseImage && Boolean(courseFallbackImage);
  const courseImg = ownCourseImage || courseFallbackImage;
  const free = courseIsFree(course);
  const { label: priceLabel, isFree } = formatCoursePrice(course.price, free);
  const gradeName =
    course.grade?.name || course.grade_name || course.grade || null;

  return (
    <MotionCard>
      <motion.article
        layout
        className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <motion.img
          src={courseImg}
          alt={courseTitle}
          className="h-full w-full object-cover"
          loading="lazy"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
        {usesFallbackImage ? (
          <div
            className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/35 to-black/10 px-4 pb-4 pt-16"
            aria-hidden
          >
            <h3 className="font-heading w-full text-right text-lg font-bold leading-snug text-white drop-shadow-md md:text-xl">
              {courseTitle}
            </h3>
          </div>
        ) : null}
        {gradeName ? (
          <span className="absolute right-3 top-3 z-10 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
            {gradeName}
          </span>
        ) : null}
        <span
          className={`absolute left-3 top-3 z-10 rounded-md px-2.5 py-1 text-xs font-semibold text-white ${
            isFree ? "bg-green-600" : "bg-orange-500"
          }`}
        >
          {isFree ? "مجاني" : "مدفوع"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 text-right md:p-5">
        {!usesFallbackImage ? (
          <h3 className="font-heading text-base font-bold leading-snug text-slate-900 dark:text-slate-100">
            {courseTitle}
          </h3>
        ) : null}
        {(course.description || course.summary) && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-7 text-slate-600 dark:text-slate-400">
            {course.description || course.summary}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500">السعر</p>
            <p className={`mt-0.5 text-lg font-bold ${isFree ? "text-green-600" : "text-orange-600"}`}>
              {priceLabel}
            </p>
          </div>
          {course.lessons_count != null || course.lectures_count != null ? (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {(course.lessons_count ?? course.lectures_count).toLocaleString("ar-EG")} درس
            </span>
          ) : null}
        </div>

        <a
          href={loginHref}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          اشترك الآن
          <FaArrowLeft className="text-xs" />
        </a>
      </div>
      </motion.article>
    </MotionCard>
  );
}


function SectionHeading({ eyebrow, title, subtitle, align = "center" }) {
  const wrap = align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-right";
  return (
    <Reveal className={wrap} variant="fadeUp">
      {eyebrow ? (
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.2em" }}
          whileInView={{ opacity: 1, letterSpacing: "0.05em" }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400"
        >
          {eyebrow}
        </motion.p>
      ) : null}
      <h2 className="font-heading mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 md:text-2xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-sm leading-8 text-slate-600 dark:text-slate-400 md:text-base">{subtitle}</p>
      ) : null}
    </Reveal>
  );
}

function SocialLink({ href, label, children }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-500 transition hover:border-blue-200 hover:bg-blue-100 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"
    >
      {children}
    </a>
  );
}

/** طبقات ظل وتدرج تفصل صورة الخلفية عن منطقة النص */
function HeroImageShadowLayers() {
  return (
    <>
      {/* فينيت خفيف على كامل الصورة */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_92%_85%_at_58%_32%,transparent_42%,rgba(2,6,23,0.38)_100%)]"
      />

      {/* موبايل: ظل سفلي يفصل النص عن الصورة */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden max-[749px]:block shadow-[inset_0_90px_110px_-25px_rgba(2,6,23,0.55)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[68%] max-[749px]:block bg-gradient-to-t from-[#020617]/95 via-[#020617]/60 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[38%] hidden h-24 max-[749px]:block bg-gradient-to-t from-[#020617]/25 to-transparent blur-md"
      />

      {/* تابلت */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden min-[750px]:max-[900px]:block shadow-[inset_110px_0_90px_-18px_rgba(2,6,23,0.62),inset_0_-70px_90px_-22px_rgba(2,6,23,0.48)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[54%] min-[750px]:max-[900px]:block bg-gradient-to-r from-[#020617]/90 via-[#020617]/50 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[52%] min-[750px]:max-[900px]:block bg-gradient-to-t from-[#020617]/88 via-[#020617]/35 to-transparent"
      />

      {/* ديسكتوب */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden min-[901px]:block shadow-[inset_150px_0_110px_-22px_rgba(2,6,23,0.7)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[56%] max-w-[620px] min-[901px]:block bg-gradient-to-r from-[#020617]/88 via-[#020617]/42 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-[48%] hidden w-28 min-[901px]:block bg-gradient-to-r from-[#020617]/20 to-transparent blur-xl"
      />
    </>
  );
}

function HeroContent({
  specialty,
  teacherName,
  heroTitle,
  bioText,
  about,
  signupHref,
  loginHref,
  heroStats,
  mode,
}) {
  const isMobile = mode === "mobile";
  const isTablet = mode === "tablet";
  const isDesktop = mode === "desktop";

  const wrapClass = isDesktop
    ? "hero-text-layer w-full max-w-xl text-right min-[901px]:ms-auto min-[901px]:me-0"
    : "hero-text-layer w-full text-right";

  const titleClass = isMobile
    ? "font-heading mt-2 text-balance text-2xl font-bold leading-snug text-white sm:text-3xl"
    : isTablet
      ? "font-heading mt-2 text-balance text-[1.5rem] font-bold leading-snug text-white"
      : "font-heading mt-2 text-balance text-3xl font-bold leading-snug text-white xl:text-4xl";

  const bioClass = isMobile
    ? "mt-3 line-clamp-2 text-sm leading-7 text-white/90"
    : isTablet
      ? "mt-3 line-clamp-3 text-sm leading-7 text-white/90"
      : "mt-4 text-base leading-8 text-white/90";

  const btnWrapClass = isMobile
    ? "mt-5 flex flex-col gap-2.5"
    : isTablet
      ? "mt-5 flex flex-row flex-wrap gap-2"
      : "mt-6 flex flex-row flex-wrap items-center gap-3";

  const signupBtnClass = isMobile
    ? "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-7 text-sm font-semibold text-white transition hover:bg-orange-600"
    : isTablet
      ? "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-xs font-semibold text-white transition hover:bg-orange-600"
      : "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-7 text-sm font-semibold text-white transition hover:bg-orange-600";

  const loginBtnClass = isMobile
    ? "inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/35 bg-white/10 px-7 text-sm font-medium text-white transition hover:bg-white/15"
    : isTablet
      ? "inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-4 text-xs font-medium text-white transition hover:bg-white/15"
      : "inline-flex h-11 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-7 text-sm font-medium text-white transition hover:bg-white/15";

  return (
    <motion.div
      className={wrapClass}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {specialty ? (
        <motion.span
          variants={staggerItem}
          className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
        >
          {specialty}
        </motion.span>
      ) : null}

      <motion.p variants={staggerItem} className="mt-3 text-sm text-orange-200">
        مع {teacherName}
      </motion.p>

      <motion.h1 variants={staggerItem} className={titleClass}>
        {heroTitle}
      </motion.h1>

      <motion.p variants={staggerItem} className={bioClass}>
        {bioText}
      </motion.p>

      {isDesktop && (about.experience || about.qualifications) && (
        <motion.div variants={staggerItem} className="mt-4 flex flex-wrap gap-2">
          {about.experience ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/90">
              <FaAward className="text-orange-300" />
              {about.experience}
            </span>
          ) : null}
          {about.qualifications ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/90">
              <FaGraduationCap className="text-blue-200" />
              {about.qualifications}
            </span>
          ) : null}
        </motion.div>
      )}

      <motion.div variants={staggerItem} className={btnWrapClass}>
        <motion.a
          href={signupHref}
          className={signupBtnClass}
          whileHover={{ scale: 1.03, boxShadow: "0 12px 28px rgba(249,115,22,0.35)" }}
          whileTap={{ scale: 0.98 }}
        >
          إنشاء حساب
          <FaArrowLeft className="text-xs opacity-90" />
        </motion.a>
        <motion.a
          href={loginHref}
          className={loginBtnClass}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.18)" }}
          whileTap={{ scale: 0.98 }}
        >
          تسجيل الدخول
        </motion.a>
      </motion.div>

      <motion.div
        variants={staggerItem}
        className={`mt-5 grid grid-cols-3 gap-2 ${isDesktop ? "mt-8" : ""}`}
      >
        {heroStats.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.16)" }}
              className={`hero-stat-card rounded-lg border border-white/15 bg-white/10 px-2 py-2.5 text-center backdrop-blur-sm shadow-[0_4px_20px_rgba(2,6,23,0.28)] ${
                isDesktop ? "px-3 py-3 text-right" : ""
              }`}
            >
              <Icon
                className={`mx-auto mb-1 text-orange-300 ${
                  isDesktop ? "ms-0 me-auto text-sm" : "text-xs"
                }`}
              />
              <p
                className={`font-bold tabular-nums text-white ${
                  isDesktop ? "text-lg" : isTablet ? "text-sm" : "text-xs"
                }`}
              >
                {item.value}
              </p>
              <p className={`mt-0.5 text-white/70 ${isDesktop ? "text-xs" : "text-[0.65rem]"}`}>
                {item.label}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

export default function TenantPublicLanding({ subdomain }) {
  const { isDarkMode, toggleTheme } = useTenantPublicTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeFreeLecture, setActiveFreeLecture] = useState(null);
  useTenantArabicFonts();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tenant-public", subdomain],
    queryFn: () => fetchTenantPublic(subdomain),
    staleTime: 60_000,
  });

  const platformQueryEnabled = Boolean(subdomain) && !isLoading && !isError;

  const { data: freeLecturesResponse, isLoading: freeLecturesLoading } = useQuery({
    queryKey: ["platform-free-lectures", subdomain],
    queryFn: () => fetchPlatformPublicFreeLectures(subdomain),
    enabled: platformQueryEnabled,
    staleTime: 60_000,
  });

  const { data: coursesResponse, isLoading: coursesLoading } = useQuery({
    queryKey: ["platform-courses", subdomain],
    queryFn: () => fetchPlatformPublicCourses(subdomain),
    enabled: platformQueryEnabled,
    staleTime: 60_000,
  });

  const payload = data?.data;
  const tenant = payload?.tenant;
  const landing = payload?.landing;
  const theme = landing?.theme;

  const cssVars = useMemo(() => buildCssVars(theme), [theme]);

  const freeLectures = useMemo(() => {
    const list = freeLecturesResponse?.data?.lectures;
    return Array.isArray(list) ? list : [];
  }, [freeLecturesResponse]);

  const courses = useMemo(() => {
    const list = coursesResponse?.data?.courses;
    return Array.isArray(list) ? list : [];
  }, [coursesResponse]);

  const fontFamily = TENANT_FONT_BODY;
  const teacher = payload?.teacher;

  useTenantPageMetadata(subdomain, "home", undefined, { tenant, teacher, subdomain });

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const onScroll = () => {
      if (window.scrollY > 80) setIsMobileMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!activeFreeLecture) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setActiveFreeLecture(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeFreeLecture]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f4f7fc] dark:bg-slate-950"
        dir="rtl"
      >
        <motion.div
          className="relative h-14 w-14"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-900" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-orange-500 border-r-blue-500" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-sm font-medium text-slate-500 dark:text-slate-400"
        >
          جاري تحميل الصفحة…
        </motion.p>
      </motion.div>
    );
  }

  if (isError || !payload?.tenant) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center dark:bg-slate-950"
        dir="rtl"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
          className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-500 dark:bg-red-950/40"
        >
          !
        </motion.div>
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          لم نتمكن من تحميل هذه الصفحة
        </p>
        <p className="max-w-md text-slate-600 dark:text-slate-400">
          {error?.message || "تأكد أن النطاق الفرعي صحيح وأن الخادم يعمل."}
        </p>
      </motion.div>
    );
  }

  const hero = landing?.hero || {};
  const about = landing?.about || {};
  const stats = landing?.statistics || {};
  const services = Array.isArray(landing?.services) ? landing.services : [];
  const displayServices =
    services.length > 0
      ? services.slice(0, 4)
      : [
          {
            title: "شرح مبسط",
            description: "شرح واضح ومنظم يساعدك تفهم الدرس خطوة بخطوة بدون تعقيد.",
          },
          {
            title: "متابعة مستمرة",
            description: "متابعة مستواك وتوجيهك للخطوة التالية في كل مرحلة من التعلم.",
          },
          {
            title: "تدريب وتطبيق",
            description: "أسئلة وتطبيقات عملية تثبت المعلومة وتجهزك للاختبارات.",
          },
          {
            title: "دعم مستمر",
            description: "إجابة على استفساراتك ومتابعة تقدمك حتى تحقق هدفك.",
          },
        ];
  const faq = Array.isArray(landing?.faq) ? landing.faq : [];
  const testimonials = Array.isArray(landing?.testimonials)
    ? landing.testimonials
    : [];
  const contact = landing?.contact || {};
  const teacherGrades = Array.isArray(payload?.teacher_grades) ? payload.teacher_grades : [];

  const brandName = tenant.display_name || tenant.subdomain || subdomain;
  const teacherName = payload?.teacher?.name || brandName;
  const specialty = tenant?.specialty || payload?.teacher?.subject || "";
  const heroTitle =
    (hero.title && hero.title.trim()) ||
    (specialty ? `احترف ${specialty} مع ${teacherName}` : `تعلّم مع ${teacherName}`);
  const heroImage = hero.image_url || tenant.avatar_url;

  const placeholderPhoto =
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=85";
  const courseFallbackImage = hero.image_url || tenant.avatar_url || placeholderPhoto;
  const heroBgImage = hero.image_url || tenant.og_image_url || courseFallbackImage;

  const statBarItems = [
    stats.courses_count != null && {
      value: `${Number(stats.courses_count).toLocaleString("ar-EG")}+`,
      label: "كورس تعليمي",
    },
    stats.students_count != null && {
      value: `${Number(stats.students_count).toLocaleString("ar-EG")}+`,
      label: "طالب وطالبة",
    },
    stats.years_experience != null && {
      value: `${Number(stats.years_experience).toLocaleString("ar-EG")}+`,
      label: "سنوات خبرة",
    },
  ].filter(Boolean);

  const heroStats = [
    {
      value:
        stats.students_count != null
          ? `${Number(stats.students_count).toLocaleString("ar-EG")}+`
          : "10k+",
      label: "طالب",
      icon: FaUsers,
    },
    {
      value:
        stats.courses_count != null
          ? `${Number(stats.courses_count).toLocaleString("ar-EG")}+`
          : "50+",
      label: "كورس",
      icon: FaGraduationCap,
    },
    {
      value:
        stats.years_experience != null
          ? `${Number(stats.years_experience).toLocaleString("ar-EG")}+`
          : "10+",
      label: "سنوات خبرة",
      icon: FaAward,
    },
  ];

  const joinHref = contact.whatsapp || contact.telegram || "#cta";
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const loginHref = `${siteOrigin}/login`;
  const signupHref = `${siteOrigin}/signup`;

  const displayTestimonials =
    testimonials.length > 0
      ? testimonials.slice(0, 3)
      : [
          {
            name: "أحمد محمد",
            text: "أفضل منصة تعليمية جربتها، الشرح واضح والمتابعة ممتازة.",
            rating: 5,
          },
          {
            name: "سارة علي",
            text: "المحتوى منظم جداً وساعدني أحسن درجاتي بشكل ملحوظ.",
            rating: 5,
          },
          {
            name: "محمود حسن",
            text: "تجربة تعليمية رائعة مع متابعة مستمرة ودعم سريع.",
            rating: 5,
          },
        ];
  const benefitItems = [
    {
      title: displayServices[0]?.title || "شرح مبسط",
      description: displayServices[0]?.description || "شرح واضح ومنظم يساعدك تفهم الدرس خطوة بخطوة.",
      icon: FaBookOpen,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: displayServices[1]?.title || "متابعة مستمرة",
      description: displayServices[1]?.description || "متابعة مستواك وتوجيهك للخطوة التالية في كل مرحلة.",
      icon: FaChalkboardTeacher,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      title: displayServices[2]?.title || "تدريب وتطبيق",
      description: displayServices[2]?.description || "أسئلة وتطبيقات عملية تثبت المعلومة وتجهزك للاختبارات.",
      icon: FaClipboardList,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: displayServices[3]?.title || "دعم مستمر",
      description: displayServices[3]?.description || "إجابة على استفساراتك ومتابعة تقدمك حتى تحقق هدفك.",
      icon: FaVideo,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div
      dir="rtl"
      data-theme={isDarkMode ? "dark" : "light"}
      className={`tenant-public-page ${isDarkMode ? "dark tenant-dark" : "tenant-light"} min-h-screen overflow-x-hidden bg-white text-[var(--t-text)] antialiased selection:bg-blue-500/20 selection:text-slate-900 dark:selection:bg-orange-500/20 dark:selection:text-slate-100`}
      style={{
        ...cssVars,
        fontFamily,
        fontSize: "var(--t-font-body)",
        lineHeight: "var(--t-line-body)",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      }}
    >
      <style>{`
        .tenant-public-page {
          font-family: ${TENANT_FONT_BODY};
          font-feature-settings: "kern" 1, "liga" 1;
        }
        .tenant-public-page h1,
        .tenant-public-page h2,
        .tenant-public-page h3,
        .tenant-public-page .font-heading {
          font-family: ${TENANT_FONT_HEADING};
          letter-spacing: -0.01em;
        }
        .tenant-public-page.tenant-dark {
          background: #020617;
          color: #e2e8f0;
        }
        .tenant-public-page.tenant-dark section,
        .tenant-public-page.tenant-dark main {
          color: #e2e8f0;
        }
        .tenant-public-page.tenant-dark .bg-white,
        .tenant-public-page.tenant-dark .bg-white\\/90,
        .tenant-public-page.tenant-dark .bg-white\\/95,
        .tenant-public-page.tenant-dark .bg-white\\/80,
        .tenant-public-page.tenant-dark .bg-white\\/75,
        .tenant-public-page.tenant-dark .bg-slate-50,
        .tenant-public-page.tenant-dark .bg-slate-100,
        .tenant-public-page.tenant-dark .bg-\\[\\#f6f8fc\\],
        .tenant-public-page.tenant-dark .bg-\\[\\#f0f4fa\\],
        .tenant-public-page.tenant-dark .bg-\\[\\#f4f6f9\\] {
          background-color: #0f172a !important;
        }
        .tenant-public-page.tenant-dark .bg-blue-50 { background-color: rgb(30 58 138 / 0.2) !important; }
        .tenant-public-page.tenant-dark .bg-orange-50 { background-color: rgb(154 52 18 / 0.15) !important; }
        .tenant-public-page.tenant-dark .border-slate-100,
        .tenant-public-page.tenant-dark .border-slate-200,
        .tenant-public-page.tenant-dark .border-slate-200\\/60,
        .tenant-public-page.tenant-dark .border-slate-200\\/70,
        .tenant-public-page.tenant-dark .border-slate-200\\/80,
        .tenant-public-page.tenant-dark .border-slate-200\\/90 {
          border-color: #334155 !important;
        }
        .tenant-public-page.tenant-dark .text-slate-900 { color: #f8fafc !important; }
        .tenant-public-page.tenant-dark .text-slate-800 { color: #e2e8f0 !important; }
        .tenant-public-page.tenant-dark .text-slate-700 { color: #cbd5e1 !important; }
        .tenant-public-page.tenant-dark .text-slate-600 { color: #94a3b8 !important; }
        .tenant-public-page.tenant-dark .text-slate-500,
        .tenant-public-page.tenant-dark .text-slate-400 { color: #94a3b8 !important; }
        .tenant-public-page.tenant-dark .text-blue-600 { color: #60a5fa !important; }
        .tenant-public-page.tenant-dark .text-\\[\\#0f1f3d\\] { color: #f1f5f9 !important; }
        .tenant-public-page.tenant-dark .hover\\:text-\\[\\#0f1f3d\\]:hover { color: #f8fafc !important; }
        .tenant-public-page.tenant-dark .from-blue-50 { --tw-gradient-from: rgb(30 58 138 / 0.25) !important; }
        .tenant-public-page.tenant-dark .to-white { --tw-gradient-to: #0f172a !important; }
        .tenant-public-page.tenant-dark .from-orange-50 { --tw-gradient-from: rgb(154 52 18 / 0.2) !important; }
        .tenant-public-page.tenant-dark section .bg-\\[linear-gradient\\(180deg\\,\\#ffffff_0\\%\\,\\#f8fafc_45\\%\\,\\#ffffff_100\\%\\)\\] {
          background: linear-gradient(180deg, #020617 0%, #0f172a 45%, #020617 100%) !important;
        }
        .tenant-public-page.tenant-dark .border-dashed { border-color: #475569 !important; }
        .tenant-public-page .hero-text-layer h1 {
          text-shadow: 0 1px 2px rgba(0,0,0,0.25), 0 6px 24px rgba(2,6,23,0.55);
        }
        .tenant-public-page .hero-text-layer p,
        .tenant-public-page .hero-text-layer span {
          text-shadow: 0 1px 3px rgba(2,6,23,0.45);
        }
        html { scroll-behavior: smooth; }
        body:has(.tenant-public-page) { overflow-x: hidden; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
        }
      `}</style>

      {/* Navbar */}
      <TenantPublicNavbar
        brandName={brandName}
        specialty={specialty}
        tenantAvatar={tenant.avatar_url}
        loginHref={loginHref}
        signupHref={signupHref}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        navScrolled={navScrolled}
        brandHref="#home"
        navLinks={TENANT_NAV_LINKS}
      />

      <main className="bg-white transition-colors duration-300 dark:bg-slate-950">
        {/* Hero */}
        <section
          id="home"
          className="relative isolate min-h-[100svh] overflow-x-hidden min-[901px]:h-[100svh] min-[901px]:overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <HeroKenBurns
              src={heroBgImage}
              alt=""
              className="h-full w-full object-cover object-[88%_18%] max-[749px]:object-[88%_18%] min-[750px]:max-[900px]:object-[100%_28%] min-[901px]:object-[right_center]"
            />
          </div>

          <HeroGlowOrb
            className="pointer-events-none absolute left-0 top-1/4 h-64 w-64 -translate-x-1/4 rounded-full bg-blue-500/20 blur-3xl"
            delay={0}
          />
          <HeroGlowOrb
            className="pointer-events-none absolute bottom-20 right-10 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl"
            delay={2}
          />

          <HeroImageShadowLayers />

          <div className="relative mx-auto min-h-[100svh] max-w-[var(--t-max)] px-4 min-[901px]:flex min-[901px]:h-full min-[901px]:min-h-0 min-[901px]:flex-col md:px-6 lg:px-8">
            {/* ── موبايل (<750) ── */}
            <div className="flex min-h-[100svh] flex-col pb-6 pt-[4.75rem] max-[749px]:flex min-[750px]:hidden">
              <div className="h-[28vh] min-h-[7rem] max-h-[14rem] shrink-0" aria-hidden />
              <div className="flex flex-col justify-end">
                <HeroContent
                  specialty={specialty}
                  teacherName={teacherName}
                  heroTitle={heroTitle}
                  bioText={
                    about.bio ||
                    tenant.bio ||
                    payload?.teacher?.description ||
                    "شرح منظم، متابعة مستمرة، وتدريب مكثف يساعدك تحقق أفضل النتائج."
                  }
                  about={about}
                  signupHref={signupHref}
                  loginHref={loginHref}
                  heroStats={heroStats}
                  mode="mobile"
                />
              </div>
            </div>

            {/* ── تابلت (750–900): عمودين — نص يسار / صورة يمين ── */}
            <div className="hidden min-h-[100svh] min-[750px]:max-[900px]:grid min-[750px]:max-[900px]:grid-cols-2 min-[750px]:max-[900px]:items-end min-[750px]:max-[900px]:pb-10 min-[750px]:max-[900px]:pt-[4.75rem]">
              <div className="col-start-2 pb-2">
                <HeroContent
                  specialty={specialty}
                  teacherName={teacherName}
                  heroTitle={heroTitle}
                  bioText={
                    about.bio ||
                    tenant.bio ||
                    payload?.teacher?.description ||
                    "شرح منظم، متابعة مستمرة، وتدريب مكثف يساعدك تحقق أفضل النتائج."
                  }
                  about={about}
                  signupHref={signupHref}
                  loginHref={loginHref}
                  heroStats={heroStats}
                  mode="tablet"
                />
              </div>
            </div>

            {/* ── ديسكتوب (901+) ── */}
            <div className="hidden min-[901px]:flex min-[901px]:flex-1 min-[901px]:flex-col min-[901px]:justify-center min-[901px]:py-16 min-[901px]:pt-[4.75rem]">
              <HeroContent
                specialty={specialty}
                teacherName={teacherName}
                heroTitle={heroTitle}
                bioText={
                  about.bio ||
                  tenant.bio ||
                  payload?.teacher?.description ||
                  "شرح منظم، متابعة مستمرة، وتدريب مكثف يساعدك تحقق أفضل النتائج."
                }
                about={about}
                signupHref={signupHref}
                loginHref={loginHref}
                heroStats={heroStats}
                mode="desktop"
              />
            </div>
 
          </div>
        </section>

        {/* About — مخفي حالياً */}
        <section id="about" className="hidden" aria-hidden />

        {/* Stats — مخفي */}
        {false && statBarItems.length > 0 && null}

        {/* Grades — مخفي */}
        {false && teacherGrades.length > 0 && null}

        {/* FAQ — مخفي */}
        {false && faq.length > 0 && null}

        {/* Features / Why Us */}
        {displayServices.length > 0 && (
          <section id="services" className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-14 md:py-20 dark:border-slate-800 dark:bg-slate-900/40" dir="rtl">
            <div className="mx-auto max-w-[var(--t-max)] px-4 md:px-6 lg:px-8">
              <SectionHeading
                eyebrow="لماذا نحن"
                title="لماذا تتعلم معنا؟"
                subtitle="تجربة تعليمية تجمع بين الشرح الواضح والمتابعة المستمرة."
              />

              {statBarItems.length > 0 && (
                <StaggerGrid className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {statBarItems.map((item) => (
                    <StaggerItem key={item.label}>
                      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{item.value}</span>
                        <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerGrid>
              )}

              <StaggerGrid className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                {displayServices.map((s, i) => (
                  <StaggerItem key={`${s.title}-${i}`}>
                    <ServiceFeatureCard service={s} index={i} />
                  </StaggerItem>
                ))}
              </StaggerGrid>

              <Reveal className="mt-10" variant="scaleIn" delay={0.1}>
              <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3 text-right">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <FaGraduationCap />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">جاهز تبدأ؟</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">أنشئ حسابك وابدأ التعلم</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={loginHref}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200"
                  >
                    تسجيل الدخول
                  </a>
                  <a
                    href={signupHref}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    إنشاء حساب
                  </a>
                </div>
              </div>
              </Reveal>
            </div>
          </section>
        )}


        {/* Free Lectures */}
        <section id="videos" className="scroll-mt-20 border-t border-slate-200 bg-white py-14 md:py-20 dark:border-slate-800" dir="rtl">
          <div className="mx-auto max-w-[var(--t-max)] px-4 md:px-6 lg:px-8">
            <SectionHeading
              eyebrow="محاضرات مجانية"
              title="محاضرات مجانية"
              subtitle="شاهد محاضرات مجانية وتعرّف على أسلوب الشرح قبل الاشتراك."
            />

            {freeLecturesLoading ? (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : freeLectures.length > 0 ? (
              <StaggerGrid className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {freeLectures.map((lecture) => (
                  <StaggerItem key={lecture.id}>
                  <motion.button
                    type="button"
                    onClick={() => setActiveFreeLecture(lecture)}
                    className="group block w-full text-right"
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                      <motion.img
                        src={lecture.image_url || courseFallbackImage}
                        alt={lecture.title}
                        className="aspect-video w-full object-cover"
                        loading="lazy"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/45 transition group-hover:bg-slate-900/55">
                        <motion.span
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-md"
                          whileHover={{ scale: 1.1 }}
                        >
                          <FaPlay className="mr-[-2px]" />
                        </motion.span>
                      </div>
                    </div>
                    <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {lecture.title}
                    </p>
                  </motion.button>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            ) : (
              <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-900/50">
                <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  لا توجد محاضرات مجانية حالياً
                </p>
                <p className="mt-2 text-sm text-slate-500">تابعنا — سيتم إضافة محاضرات قريباً</p>
              </div>
            )}
          </div>
        </section>

        {/* Courses */}
        <section id="courses" className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-14 md:py-20 dark:border-slate-800 dark:bg-slate-900/40" dir="rtl">
          <div className="mx-auto max-w-[var(--t-max)] px-4 md:px-6 lg:px-8">
            <SectionHeading
              eyebrow="الكورسات"
              title="الكورسات المتاحة"
              subtitle="اختر الكورس المناسب واشترك للوصول إلى المحتوى كاملاً."
            />

            {coursesLoading ? (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  />
                ))}
              </div>
            ) : courses.length > 0 ? (
              <>
                <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {courses.length.toLocaleString("ar-EG")}
                  </span>{" "}
                  كورس متاح للاشتراك
                </p>

                <StaggerGrid className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((c, i) => (
                    <StaggerItem key={c.id ?? `course-${i}`}>
                      <CourseCard
                        course={c}
                        courseFallbackImage={courseFallbackImage}
                        loginHref={loginHref}
                      />
                    </StaggerItem>
                  ))}
                </StaggerGrid>
              </>
            ) : (
              <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-900">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-600 dark:bg-blue-900/30">
                  <FaBookOpen />
                </div>
                <p className="text-base font-semibold text-slate-800 dark:text-slate-100">لا توجد كورسات متاحة حالياً</p>
                <p className="mt-2 text-sm text-slate-500">سيتم عرض الكورسات هنا فور إضافتها</p>
                <a
                  href={signupHref}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  أنشئ حسابك
                  <FaArrowLeft className="text-xs" />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="border-t border-slate-200 bg-white px-4 py-14 dark:border-slate-800 dark:bg-slate-950 md:px-6 lg:px-8">
          <Reveal variant="scaleIn" className="mx-auto max-w-3xl">
          <motion.div
            className="rounded-xl bg-blue-600 px-6 py-10 text-center text-white md:px-10 md:py-12"
            whileHover={{ boxShadow: "0 24px 48px rgba(37, 99, 235, 0.25)" }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="font-heading text-2xl font-bold md:text-3xl">ابدأ رحلة التعلم اليوم</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-blue-100 md:text-base">
              انضم الآن واستفد من الشرح المنظم والمتابعة المستمرة.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <motion.a
                href={signupHref}
                className="inline-flex min-w-[140px] items-center justify-center rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                سجّل الآن
              </motion.a>
              <motion.a
                href={loginHref}
                className="inline-flex min-w-[140px] items-center justify-center rounded-lg border border-white/40 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                تسجيل الدخول
              </motion.a>
            </div>
          </motion.div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="border-t border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="mx-auto max-w-[var(--t-max)] px-4 py-12 md:px-6 lg:px-8">
          <StaggerGrid className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                {tenant.avatar_url ? (
                  <img src={tenant.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {brandName.slice(0, 1)}
                  </span>
                )}
                <p className="font-heading text-base font-bold text-slate-900 dark:text-slate-100">{brandName}</p>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {(tenant.bio || about.bio || "منصة تعليمية متكاملة تساعدك تحقق أفضل النتائج.").slice(0, 140)}
                {(tenant.bio || about.bio || "").length > 140 ? "…" : ""}
              </p>
            </StaggerItem>
            <StaggerItem>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">روابط سريعة</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  ["#home", "الرئيسية"],
                  ["#services", "لماذا نحن"],
                  ["#videos", "محاضرات مجانية"],
                  ["#courses", "الكورسات"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="transition hover:text-blue-500 dark:hover:text-orange-400">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </StaggerItem>
            <StaggerItem>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">الدعم</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href={loginHref} className="transition hover:text-blue-500 dark:hover:text-orange-400">
                    تسجيل الدخول
                  </a>
                </li>
                <li>
                  <a href={signupHref} className="transition hover:text-blue-500 dark:hover:text-orange-400">
                    إنشاء حساب
                  </a>
                </li>
                <li>
                  <a href={joinHref} className="transition hover:text-blue-500 dark:hover:text-orange-400">
                    تواصل معنا
                  </a>
                </li>
              </ul>
            </StaggerItem>
            <StaggerItem>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">تابعنا</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SocialLink href={contact.facebook} label="Facebook">
                  <FaFacebook />
                </SocialLink>
                <SocialLink href={contact.instagram} label="Instagram">
                  <FaInstagram />
                </SocialLink>
                <SocialLink href={contact.telegram} label="Telegram">
                  <FaTelegram />
                </SocialLink>
                <SocialLink href={contact.whatsapp} label="WhatsApp">
                  <FaWhatsapp />
                </SocialLink>
              </div>
            </StaggerItem>
          </StaggerGrid>
          <Reveal variant="fadeIn" delay={0.15}>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-slate-800 sm:flex-row">
            <p>© {new Date().getFullYear()} {brandName}. جميع الحقوق محفوظة.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-blue-500 dark:hover:text-orange-400">سياسة الخصوصية</a>
              <a href="#" className="hover:text-blue-500 dark:hover:text-orange-400">الشروط والأحكام</a>
            </div>
          </div>
          </Reveal>
        </div>
      </footer>

      <FreeLecturePlayerModal
        lecture={activeFreeLecture}
        onClose={() => setActiveFreeLecture(null)}
      />
    </div>
  );
}
