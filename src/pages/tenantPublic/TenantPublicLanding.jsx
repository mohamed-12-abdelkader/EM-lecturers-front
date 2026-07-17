import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaAward, FaGraduationCap, FaUsers } from "react-icons/fa";
import {
  fetchTenantPublic,
  fetchPlatformPublicFreeLectures,
  fetchPlatformPublicCourses,
} from "../../api/tenantPublicApi";
import FreeLecturePlayerModal from "./components/FreeLecturePlayerModal";
import TenantProHero from "./components/landing/TenantProHero";
import TenantProBentoWall from "./components/landing/TenantProBentoWall";
import TenantProVideoStrip from "./components/landing/TenantProVideoStrip";
import TenantProCoursesBento from "./components/landing/TenantProCoursesBento";
import { TenantProReviews, TenantProCta } from "./components/landing/TenantProReviewsCta";
import TenantProHowItWorks from "./components/landing/TenantProHowItWorks";
import TenantProFooter from "./components/landing/TenantProFooter";
import { TL_ACCENT, TL_PRIMARY, TL_SECONDARY, TL_BORDER } from "./tenantLandingTheme";
import {
  TenantPublicNavbar,
  useTenantPublicTheme,
} from "./components/TenantPublicNavbar";
import { motion, ScrollProgress } from "./tenantLandingMotion";
import { useTenantPageMetadata } from "../../Hooks/tenantPublic/useTenantPageMetadata";
import { getPortraitImageUrl } from "../../utils/highQualityImageUrl";

const TENANT_FONT_LINK_ID = "tenant-public-arabic-fonts";
const TENANT_FONT_BODY = "'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif";
const TENANT_FONT_HEADING = "'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif";

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

function buildCssVars(theme) {
  if (!theme) {
    return {
      "--tl-primary": TL_PRIMARY,
      "--tl-secondary": TL_SECONDARY,
      "--tl-accent": TL_ACCENT,
      "--tl-border": TL_BORDER,
    };
  }
  return {
    "--t-primary": theme.primary_color || TL_PRIMARY,
    "--t-secondary": theme.secondary_color || TL_SECONDARY,
    "--t-accent": theme.accent_color || TL_ACCENT,
    "--t-text": theme.text_color || "#0F172A",
    "--tl-primary": theme.primary_color || TL_PRIMARY,
    "--tl-secondary": theme.secondary_color || TL_SECONDARY,
    "--tl-accent": theme.accent_color || TL_ACCENT,
    "--tl-border": TL_BORDER,
    "--t-font-body": theme.font_body_size || "1rem",
    "--t-line-body": theme.line_height_body || "1.75",
    "--t-weight-heading": theme.font_weight_heading || "700",
    "--t-max": theme.layout_max_width || "1400px",
  };
}

const DEFAULT_SERVICES = [
  { title: "شرح مبسط", description: "شرح واضح ومنظم يساعدك تفهم الدرس خطوة بخطوة بدون تعقيد." },
  { title: "متابعة مستمرة", description: "متابعة مستواك وتوجيهك للخطوة التالية في كل مرحلة من التعلم." },
  { title: "تدريب وتطبيق", description: "أسئلة وتطبيقات عملية تثبت المعلومة وتجهزك للاختبارات." },
  { title: "دعم مستمر", description: "إجابة على استفساراتك ومتابعة تقدمك حتى تحقق هدفك." },
];

const DEFAULT_TESTIMONIALS = [
  { name: "أحمد محمد", text: "أفضل منصة تعليمية جربتها، الشرح واضح والمتابعة ممتازة.", rating: 5 },
  { name: "سارة علي", text: "المحتوى منظم جداً وساعدني أحسن درجاتي بشكل ملحوظ.", rating: 5 },
  { name: "محمود حسن", text: "تجربة تعليمية رائعة مع متابعة مستمرة ودعم سريع.", rating: 5 },
];

function buildWhatsAppHref(numberOrUrl) {
  if (!numberOrUrl) return null;
  const raw = String(numberOrUrl).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("wa.me/") || raw.startsWith("api.whatsapp.com/")) {
    return raw.startsWith("http") ? raw : `https://${raw}`;
  }
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

/** Social links from teacher payload (+ optional landing.contact fallback). */
function buildTeacherSocialLinks(teacher, landingContact = {}) {
  return {
    facebook: teacher?.facebook_url || landingContact.facebook || null,
    instagram: teacher?.instagram_url || landingContact.instagram || null,
    youtube: teacher?.youtube_url || null,
    tiktok: teacher?.tiktok_url || null,
    telegram: landingContact.telegram || null,
    whatsapp:
      buildWhatsAppHref(teacher?.whatsapp_number) ||
      buildWhatsAppHref(landingContact.whatsapp) ||
      null,
  };
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

  const teacherPortraitUrl = useMemo(() => {
    const hero = landing?.hero || {};
    const raw = hero.image_url || tenant?.avatar_url || null;
    return raw ? getPortraitImageUrl(raw) : null;
  }, [landing, tenant]);

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
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0F172A]"
        dir="rtl"
      >
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#A16207] border-r-[#2563EB]" />
        </div>
        <p className="text-sm font-medium text-slate-400">جاري تحميل الصفحة…</p>
      </motion.div>
    );
  }

  if (isError || !payload?.tenant) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F8FAFC] px-4 text-center dark:bg-slate-950"
        dir="rtl"
      >
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">لم نتمكن من تحميل هذه الصفحة</p>
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
  const testimonials = Array.isArray(landing?.testimonials) ? landing.testimonials : [];
  const socialLinks = buildTeacherSocialLinks(teacher, landing?.contact || {});

  const brandName = tenant.display_name || tenant.subdomain || subdomain;
  const teacherName = teacher?.name || brandName;
  const specialty = tenant?.specialty || teacher?.subject || "";
  const heroTitle =
    (hero.title && hero.title.trim()) ||
    (specialty ? `احترف ${specialty} مع ${teacherName}` : `تعلّم مع ${teacherName}`);

  const bioText =
    about.bio ||
    tenant.bio ||
    teacher?.description ||
    "شرح منظم، متابعة مستمرة، وتدريب مكثف يساعدك تحقق أفضل النتائج.";

  const placeholderPhoto =
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=3840&q=100&auto=format";
  const courseFallbackImage = hero.image_url || tenant.avatar_url || placeholderPhoto;

  const displayServices = services.length > 0 ? services.slice(0, 4) : DEFAULT_SERVICES;
  const displayTestimonials = testimonials.length > 0 ? testimonials.slice(0, 3) : DEFAULT_TESTIMONIALS;

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
      value: stats.students_count != null ? `${Number(stats.students_count).toLocaleString("ar-EG")}+` : "10k+",
      label: "طالب",
      icon: FaUsers,
    },
    {
      value: stats.courses_count != null ? `${Number(stats.courses_count).toLocaleString("ar-EG")}+` : "50+",
      label: "كورس",
      icon: FaGraduationCap,
    },
    {
      value: stats.years_experience != null ? `${Number(stats.years_experience).toLocaleString("ar-EG")}+` : "10+",
      label: "سنوات خبرة",
      icon: FaAward,
    },
  ];

  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const loginHref = `${siteOrigin}/login`;
  const signupHref = `${siteOrigin}/signup`;
  const joinHref = socialLinks.whatsapp || socialLinks.telegram || "#contact";
  const whatsappHref = socialLinks.whatsapp;

  const showFreeLectures = !freeLecturesLoading && freeLectures.length > 0;
  const showCourses = !coursesLoading && courses.length > 0;

  const landingNavLinks = [
    ["#home", "الرئيسية"],
    ["#services", "لماذا نحن"],
    ["#how-it-works", "كيف تبدأ"],
    ...(showFreeLectures ? [["#videos", "محاضرات مجانية"]] : []),
    ...(showCourses ? [["#courses", "الكورسات"]] : []),
  ];

  const footerQuickLinks = [
    ["#home", "الرئيسية"],
    ["#services", "لماذا نحن"],
    ["#how-it-works", "كيف تبدأ"],
    ...(showFreeLectures ? [["#videos", "محاضرات مجانية"]] : []),
    ...(showCourses ? [["#courses", "الكورسات"]] : []),
  ];

  const bioSnippet = (tenant.bio || about.bio || "منصة تعليمية متكاملة تساعدك تحقق أفضل النتائج.").slice(0, 140);
  const bioSuffix = (tenant.bio || about.bio || "").length > 140 ? "…" : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      dir="rtl"
      data-theme={isDarkMode ? "dark" : "light"}
      className={`tenant-public-page ${isDarkMode ? "dark tenant-dark" : "tenant-light"} min-h-screen overflow-x-hidden bg-[#F8FAFC] text-[var(--t-text)] antialiased`}
      style={{
        ...cssVars,
        fontFamily: TENANT_FONT_BODY,
        fontSize: "var(--t-font-body)",
        lineHeight: "var(--t-line-body)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        .tenant-public-page h1,
        .tenant-public-page h2,
        .tenant-public-page h3,
        .tenant-public-page .font-heading {
          font-family: ${TENANT_FONT_HEADING};
        }
        .tenant-public-page.tenant-dark { background: #020617; color: #e2e8f0; }
        html { scroll-behavior: smooth; }
        body:has(.tenant-public-page) { overflow-x: hidden; }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
      `}</style>

      <ScrollProgress />

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
        navLinks={landingNavLinks}
      />

      <main>
        <TenantProHero
          specialty={specialty}
          teacherName={teacherName}
          heroTitle={heroTitle}
          bioText={bioText}
          signupHref={signupHref}
          loginHref={loginHref}
          whatsappHref={whatsappHref}
          showFreeVideos={showFreeLectures}
          heroStats={heroStats}
          teacherImageUrl={teacherPortraitUrl}
        />

        <TenantProBentoWall
          teacherName={teacherName}
          bioText={bioText}
          services={displayServices}
          signupHref={signupHref}
          teacherImageUrl={teacherPortraitUrl}
        />

        <TenantProHowItWorks
          teacherName={teacherName}
          specialty={specialty}
          signupHref={signupHref}
        />

        {showFreeLectures ? (
          <TenantProVideoStrip
            lectures={freeLectures}
            loading={freeLecturesLoading}
            fallbackImage={courseFallbackImage}
            onPlay={setActiveFreeLecture}
          />
        ) : null}

        {showCourses ? (
          <TenantProCoursesBento
            courses={courses}
            loading={coursesLoading}
            fallbackImage={courseFallbackImage}
            loginHref={loginHref}
            signupHref={signupHref}
          />
        ) : null}

        <TenantProReviews testimonials={displayTestimonials} />

        <TenantProCta signupHref={signupHref} loginHref={loginHref} />
      </main>

      <TenantProFooter
        brandName={brandName}
        tenantAvatar={tenant.avatar_url}
        bioSnippet={bioSnippet + bioSuffix}
        loginHref={loginHref}
        signupHref={signupHref}
        joinHref={joinHref}
        contact={socialLinks}
        quickLinks={footerQuickLinks}
      />

      <FreeLecturePlayerModal lecture={activeFreeLecture} onClose={() => setActiveFreeLecture(null)} />
    </motion.div>
  );
}
