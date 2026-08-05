import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaAward, FaGraduationCap, FaUsers } from "react-icons/fa";
import {
  fetchTenantPublic,
  fetchPlatformPublicFreeLectures,
  fetchPlatformPublicCourses,
  readCachedTenantPublic,
} from "../../api/tenantPublicApi";
import FreeLecturePlayerModal from "./components/FreeLecturePlayerModal";
import TenantProHero from "./components/landing/TenantProHero";
import TenantProBentoWall from "./components/landing/TenantProBentoWall";
import TenantProVideoStrip from "./components/landing/TenantProVideoStrip";
import TenantProCoursesBento from "./components/landing/TenantProCoursesBento";
import { TenantProReviews, TenantProCta } from "./components/landing/TenantProReviewsCta";
import TenantProHowItWorks from "./components/landing/TenantProHowItWorks";
import TenantProFooter from "./components/landing/TenantProFooter";
import {
  TL_ACCENT,
  TL_PRIMARY,
  TL_SECONDARY,
  TL_BORDER,
  getTenantThemeCssVars,
} from "./tenantLandingTheme";
import {
  TenantPublicNavbar,
  useTenantPublicTheme,
} from "./components/TenantPublicNavbar";
import { motion, ScrollProgress } from "./tenantLandingMotion";
import { useTenantPageMetadata } from "../../Hooks/tenantPublic/useTenantPageMetadata";
import { getCardImageUrl, getPortraitImageUrl } from "../../utils/highQualityImageUrl";
import TenantSeoHead from "./components/TenantSeoHead";
import TenantLandingLoader from "./components/landing/TenantLandingLoader";

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

  const cachedTenant = useMemo(
    () => (subdomain ? readCachedTenantPublic(subdomain) : undefined),
    [subdomain],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tenant-public", subdomain],
    queryFn: () => fetchTenantPublic(subdomain),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    initialData: cachedTenant,
    // اعتبر الكاش قديماً قليلاً ليعمل refetch هادئ في الخلفية
    initialDataUpdatedAt: cachedTenant ? Date.now() - 60_000 : undefined,
  });

  // الكورسات والمحاضرات بالتوازي مع بيانات المنصة (مش بعد ما تخلص)
  const platformQueryEnabled = Boolean(subdomain);

  const { data: freeLecturesResponse, isLoading: freeLecturesLoading } = useQuery({
    queryKey: ["platform-free-lectures", subdomain],
    queryFn: () => fetchPlatformPublicFreeLectures(subdomain),
    enabled: platformQueryEnabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  const { data: coursesResponse, isLoading: coursesLoading } = useQuery({
    queryKey: ["platform-courses", subdomain],
    queryFn: () => fetchPlatformPublicCourses(subdomain),
    enabled: platformQueryEnabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
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

  // Preload LCP portrait as early as possible
  useEffect(() => {
    if (!teacherPortraitUrl || typeof document === "undefined") return undefined;
    const id = "tenant-hero-image-preload";
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "preload";
      link.as = "image";
      document.head.appendChild(link);
    }
    link.href = teacherPortraitUrl;
    link.setAttribute("fetchpriority", "high");
    return undefined;
  }, [teacherPortraitUrl]);

  // Warm cache for first visible course / lecture thumbs
  useEffect(() => {
    const urls = [
      ...freeLectures.slice(0, 3).map((l) => l.image_url),
      ...courses.slice(0, 4).map((c) => c.image_url || c.cover_url || c.thumbnail || c.avatar),
    ]
      .filter(Boolean)
      .map((u) => getCardImageUrl(u));

    urls.forEach((href) => {
      const img = new Image();
      img.decoding = "async";
      img.src = href;
    });
  }, [freeLectures, courses]);

  const teacher = payload?.teacher;
  const seoFallback = useMemo(
    () => ({ tenant, teacher, subdomain, theme }),
    [tenant, teacher, subdomain, theme],
  );
  useTenantPageMetadata(subdomain, "home", undefined, seoFallback);

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

  // امنع حجب الصفحة بالكامل لو عندنا كاش جاهز (حتى لو في refetch بالخلفية)
  const waitingForFirstPaint = isLoading && !data?.data?.tenant;

  if (waitingForFirstPaint) {
    // الشاشة الفاخرة مرة واحدة عند أول دخول للمنصة — مش مع كل تنقّل/رجوع
    let showSplash = true;
    try {
      const key = subdomain ? `em-tenant-splash:${subdomain}` : "";
      if (key && sessionStorage.getItem(key) === "1") {
        showSplash = false;
      } else if (key) {
        sessionStorage.setItem(key, "1");
      }
    } catch {
      /* ignore */
    }
    if (!showSplash) {
      return (
        <div
          className="min-h-screen"
          style={{ background: "#0A1628" }}
          aria-busy="true"
          aria-label="جاري التحميل"
        />
      );
    }
    return <TenantLandingLoader subdomain={subdomain} />;
  }

  if ((isError && !payload?.tenant) || !payload?.tenant) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0A1628] px-4 text-center"
        dir="rtl"
      >
        <p className="text-lg font-semibold text-white">لم نتمكن من تحميل هذه الصفحة</p>
        <p className="max-w-md text-[#7EB8D9]">
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

  const heroTagline =
    (hero.subtitle && String(hero.subtitle).trim()) ||
    (about.tagline && String(about.tagline).trim()) ||
    "";

  const heroHighlights = (() => {
    const fromArray = (v) =>
      Array.isArray(v)
        ? v
            .map((item) =>
              typeof item === "string"
                ? item.trim()
                : item?.title || item?.text || item?.label || "",
            )
            .filter(Boolean)
        : [];

    const direct =
      [
        fromArray(about.highlights),
        fromArray(about.achievements),
        fromArray(about.points),
        fromArray(hero.highlights),
      ].find((list) => list.length > 0) || [];

    if (direct.length) return direct.slice(0, 4);

    const qual = about.qualifications || about.experience;
    if (typeof qual === "string" && qual.trim()) {
      const lines = qual
        .split(/\n|•|●|-|–/)
        .map((s) => s.trim())
        .filter((s) => s.length > 3);
      if (lines.length) return lines.slice(0, 4);
    }

    if (services.length) {
      return services
        .slice(0, 3)
        .map((s) => s.title || s.description)
        .filter(Boolean);
    }
    return [];
  })();

  const placeholderPhoto = getCardImageUrl(
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=480&q=70&auto=format",
  );
  const courseFallbackImage = getCardImageUrl(
    hero.image_url || tenant.avatar_url || placeholderPhoto,
  );

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

  const loginHref = "/login";
  const signupHref = "/signup";
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

  const themeCssVars = getTenantThemeCssVars(isDarkMode);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      dir="rtl"
      data-theme={isDarkMode ? "dark" : "light"}
      className={`tenant-public-page ${isDarkMode ? "tenant-dark" : "tenant-light"} min-h-screen overflow-x-hidden antialiased transition-colors duration-300`}
      style={{
        ...cssVars,
        ...themeCssVars,
        fontFamily: TENANT_FONT_BODY,
        fontSize: "var(--t-font-body)",
        lineHeight: "var(--t-line-body)",
        WebkitFontSmoothing: "antialiased",
        background: "var(--tl-page-bg)",
        color: "var(--tl-fg)",
      }}
    >
      <TenantSeoHead subdomain={subdomain} />
      <style>{`
        .tenant-public-page h1,
        .tenant-public-page h2,
        .tenant-public-page h3,
        .tenant-public-page .font-heading {
          font-family: ${TENANT_FONT_HEADING};
        }
        .tenant-public-page {
          background: var(--tl-page-bg) !important;
          color: var(--tl-fg);
        }
        html { scroll-behavior: smooth; }
        body:has(.tenant-public-page.tenant-light) {
          overflow-x: hidden;
          background: #F4F7FB;
        }
        body:has(.tenant-public-page.tenant-dark) {
          overflow-x: hidden;
          background: #0A1628;
        }
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
          tagline={heroTagline}
          highlights={heroHighlights}
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
