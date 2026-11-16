import { useEffect } from "react";
import {
  FaArrowLeft,
  FaBookOpen,
  FaCheckCircle,
  FaClipboardCheck,
  FaFacebook,
  FaGraduationCap,
  FaHeadset,
  FaInstagram,
  FaPlay,
  FaQuoteRight,
  FaStar,
  FaTiktok,
  FaUsers,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { getCardImageUrl } from "../../../../utils/highQualityImageUrl";
import TenantAppLink from "../TenantAppLink";
import { getLandingDesign } from "../../tenantLandingDesigns";

const DEFAULT_JOURNEY = [
  {
    title: "اختر مسارك",
    description: "حدد الصف أو المستوى المناسب لك وابدأ من المكان الصحيح.",
  },
  {
    title: "تعلّم وطبق",
    description: "محاضرات منظمة، تمارين، وامتحانات تقيس فهمك أولًا بأول.",
  },
  {
    title: "احصل على متابعة",
    description: "متابعة مستمرة ودعم يساعدك تثبت مستواك وتطوره.",
  },
];

const SERVICE_ICONS = [FaBookOpen, FaClipboardCheck, FaGraduationCap, FaHeadset];

const TRUST_ITEMS = [
  { label: "دعم 24/7", icon: FaHeadset },
  { label: "محتوى متجدد", icon: FaBookOpen },
  { label: "متابعة قوية", icon: FaUsers },
  { label: "نتائج سريعة", icon: FaStar },
];

function courseHref(course) {
  const slug = course?.slug || (course?.id != null ? `course-${course.id}` : null);
  return slug ? `/course/${slug}` : "/courses";
}

/** يلوّن اسم المدرس داخل عنوان الهيرو بلون التمييز */
function highlightTeacherName(text, teacherName, accentColor) {
  if (!text) return text;
  const name = String(teacherName || "").trim();
  if (!name) return text;

  const candidates = [`أستاذ ${name}`, `استاذ ${name}`, name];
  for (const needle of candidates) {
    const idx = text.indexOf(needle);
    if (idx === -1) continue;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color: accentColor }}>{needle}</span>
        {text.slice(idx + needle.length)}
      </>
    );
  }
  return text;
}

function courseTitle(course) {
  return (course?.title || course?.name || "كورس").trim();
}

function coursePrice(course) {
  if (course?.is_free || course?.isFree) return "مجاني";
  const price = Number(course?.price);
  if (!Number.isFinite(price) || price <= 0) return "مجاني";
  return `${price.toLocaleString("ar-EG")} ج.م`;
}

function courseIsFree(course) {
  if (course?.is_free || course?.isFree) return true;
  const price = Number(course?.price);
  return !Number.isFinite(price) || price <= 0;
}

function courseGrade(course) {
  return course?.grade?.name || course?.grade_name || course?.grade || "";
}

function courseLessons(course) {
  const n = course?.lessons_count ?? course?.lectures_count ?? course?.videos_count;
  const num = Number(n);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function courseDescription(course) {
  return String(course?.description || course?.short_description || "").trim();
}

function CourseCard({ course, design, softBorder, cardShadow, fallbackImage }) {
  const img = getCardImageUrl(
    course.image_url || course.cover_url || course.thumbnail || fallbackImage,
  );
  const free = courseIsFree(course);
  const grade = courseGrade(course);
  const lessons = courseLessons(course);
  const description = courseDescription(course);
  const href = courseHref(course);

  return (
    <article
      className="group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1"
      style={{
        background: design.card,
        borderRadius: design.radius,
        border: `1px solid ${softBorder}`,
        boxShadow: cardShadow,
      }}
    >
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: `${design.accent}12` }}>
        {img ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FaBookOpen className="text-3xl opacity-35" style={{ color: design.accent }} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute right-3 top-3 flex flex-wrap gap-1.5">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"
            style={{ background: free ? "#16A34A" : design.accent }}
          >
            {free ? "مجاني" : "مدفوع"}
          </span>
          {grade ? (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur" style={{ color: design.fg }}>
              {grade}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 text-[1.05rem] font-extrabold leading-7" style={{ color: design.fg }}>
          {courseTitle(course)}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-7" style={{ color: design.muted }}>
          {description || "محاضرات منظمة ومتابعة مستمرة تساعدك تحقق أفضل نتيجة."}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {lessons != null ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: `${design.accent}12`, color: design.accent }}
            >
              <FaPlay className="text-[8px]" />
              {lessons.toLocaleString("ar-EG")} درس
            </span>
          ) : null}
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: `${design.accent}12`, color: design.accent }}
          >
            <FaCheckCircle className="text-[10px]" />
            متابعة ودعم
          </span>
        </div>

        <div
          className="mt-auto flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: softBorder }}
        >
          <div>
            <p className="text-[10px] font-medium" style={{ color: design.muted }}>
              السعر
            </p>
            <p className="text-lg font-black" style={{ color: design.accent }}>
              {coursePrice(course)}
            </p>
          </div>
          <TenantAppLink
            href={href}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition hover:brightness-110"
            style={solidBtn(design)}
          >
            التفاصيل
            <FaArrowLeft className="text-[10px]" />
          </TenantAppLink>
        </div>
      </div>
    </article>
  );
}

function useDesignFont(design) {
  useEffect(() => {
    if (!design?.fontHref) return undefined;
    const id = `tenant-design-font-${design.id}`;
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = design.fontHref;
    return undefined;
  }, [design]);
}

function solidBtn(design) {
  if (design.id === "ember") {
    return { background: design.accent2 || "#111827", color: "#fff" };
  }
  if (design.id === "navy") {
    return {
      background: `linear-gradient(135deg, ${design.accent}, ${design.accentSoft || design.accent2})`,
      color: design.accentFg,
      boxShadow: `0 12px 40px -12px ${design.accent}99`,
    };
  }
  return { background: design.accent, color: design.accentFg };
}

function ghostBtn(design, onDark = false) {
  if (onDark) {
    return {
      background: "transparent",
      color: "#fff",
      border: "1.5px solid rgba(255,255,255,0.35)",
    };
  }
  if (design.id === "ember") {
    return {
      background: "transparent",
      color: design.fg,
      border: `1.5px solid ${design.fg}33`,
    };
  }
  return {
    background: design.surface,
    color: design.fg,
    border: `1.5px solid ${design.muted}44`,
  };
}

function PrimaryButton({ design, href, children, solid = true, onDark = false, className = "" }) {
  const style = solid ? solidBtn(design) : ghostBtn(design, onDark);
  return (
    <TenantAppLink
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-extrabold transition hover:brightness-110 ${className}`}
      style={{ ...style, borderRadius: design.radius }}
    >
      {children}
      {solid ? <FaArrowLeft className="text-[10px]" /> : null}
    </TenantAppLink>
  );
}

function SectionHeading({ design, eyebrow, title, center = false, aside = null }) {
  return (
    <div
      className={`mb-10 flex flex-wrap items-end gap-4 ${
        center ? "mx-auto max-w-3xl flex-col text-center" : "justify-between"
      }`}
    >
      <div className={center ? "w-full" : "min-w-0 flex-1"}>
        {eyebrow ? (
          <p
            className="mb-2 text-xs font-bold tracking-[0.18em]"
            style={{ color: design.accent }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className="text-3xl font-extrabold leading-tight md:text-4xl"
          style={{ fontFamily: design.headingFont, color: design.fg }}
        >
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}

function heroDescription(model) {
  const specialty = String(model.specialty || "").trim();
  const tagline = String(model.heroTagline || "").trim();
  const bio = String(model.bioText || "").trim();
  // لا تعرض التخصص لوحده تحت العنوان — غالبًا مكرر في الـ title
  if (tagline && tagline !== specialty && !String(model.heroTitle || "").includes(tagline)) {
    return tagline;
  }
  if (bio && bio !== specialty) return bio;
  return "شرح منظم، متابعة مستمرة، وتدريب عملي يساعدك تحقق أفضل النتائج.";
}

function HeroActions({ design, model }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!model.hideSignup && model.signupHref ? (
        <TenantAppLink
          href={model.signupHref}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-extrabold transition hover:brightness-110 md:text-[0.95rem]"
          style={{ ...solidBtn(design), borderRadius: design.radius }}
        >
          ابدأ الآن
          <FaArrowLeft className="text-[10px]" />
        </TenantAppLink>
      ) : null}
      <TenantAppLink
        href={model.loginHref}
        className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-extrabold transition hover:brightness-105 md:text-[0.95rem]"
        style={{ ...ghostBtn(design), borderRadius: design.radius }}
      >
        تسجيل الدخول
      </TenantAppLink>
    </div>
  );
}

function PortraitOrFallback({ url, name, className = "", style }) {
  if (url) {
    return <img src={url} alt="" className={className} style={style} />;
  }
  return (
    <div
      className={`flex items-center justify-center text-lg font-bold ${className}`}
      style={style}
    >
      {name}
    </div>
  );
}

/** ember: بورتريه طولي + بطاقة إحصائيات عائمة */
function HeroEmber({ design, model }) {
  const stats = (model.stats || []).slice(0, 3);
  return (
    <section
      id="home"
      className="relative overflow-hidden px-5 pb-16 pt-[6.75rem] md:px-8 md:pb-24 md:pt-[8rem]"
    >
      <div
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: design.accentSoft }}
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: `${design.accent}55` }}
      />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
        <div className="order-2 text-right md:order-1">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold"
              style={{ background: `${design.accent}14`, color: design.accent }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: design.accent }} />
              منصة تعليمية متطورة
            </span>
            {model.specialty ? (
              <span
                className="rounded-full px-3 py-1.5 text-[11px] font-bold"
                style={{ background: "rgba(17,24,39,0.06)", color: design.fg }}
              >
                {model.specialty}
              </span>
            ) : null}
          </div>

          <h1
            className="text-[2rem] font-black leading-[1.55] tracking-tight sm:text-4xl sm:leading-[1.5] md:text-[2.75rem] md:leading-[1.45] lg:text-[3.1rem] lg:leading-[1.4]"
            style={{ fontFamily: design.headingFont, color: design.fg }}
          >
            {highlightTeacherName(model.heroTitle, model.teacherName, design.accent)}
          </h1>
          <div
            className="mt-4 h-1.5 w-16 rounded-full"
            style={{ background: `linear-gradient(90deg, ${design.accent}, ${design.accentSoft})` }}
          />
          <p className="mt-5 max-w-xl text-[0.98rem] leading-8 md:text-[1.05rem] md:leading-8" style={{ color: design.muted }}>
            {heroDescription(model)}
          </p>
          <div className="mt-8">
            <HeroActions design={design} model={model} />
          </div>

          {stats.length ? (
            <div
              className="mt-10 grid grid-cols-3 overflow-hidden rounded-2xl bg-white"
              style={{
                border: "1px solid rgba(15,23,42,0.06)",
                boxShadow: "0 22px 50px -28px rgba(15,23,42,0.28)",
              }}
            >
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="px-2 py-4 text-center sm:px-4 sm:py-5"
                  style={{
                    borderRight: i < stats.length - 1 ? "1px solid rgba(15,23,42,0.06)" : undefined,
                  }}
                >
                  <p className="text-xl font-black sm:text-2xl" style={{ color: design.accent }}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold sm:text-xs" style={{ color: design.muted }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="order-1 flex justify-center md:order-2 md:justify-end">
          <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
            <div
              className="absolute -inset-3 rotate-3 rounded-[2rem] opacity-90"
              style={{ background: `linear-gradient(145deg, ${design.accent}33, transparent 55%)` }}
            />
            <div
              className="relative overflow-hidden bg-white p-2.5 shadow-[0_40px_80px_-32px_rgba(15,23,42,0.45)]"
              style={{ borderRadius: "1.75rem" }}
            >
              <PortraitOrFallback
                url={model.teacherPortraitUrl}
                name={model.teacherName}
                className="aspect-[4/5] w-full object-cover object-top"
                style={{
                  borderRadius: "1.35rem",
                  background: `${design.accent}12`,
                  color: design.muted,
                }}
              />
              <div
                className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-3.5 backdrop-blur"
                style={{ boxShadow: "0 16px 40px -20px rgba(15,23,42,0.35)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
                    style={{ background: design.accent }}
                  >
                    {model.teacherPortraitUrl ? (
                      <img src={model.teacherPortraitUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (model.teacherName || "م").slice(0, 1)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{model.teacherName}</p>
                    <p className="truncate text-[11px]" style={{ color: design.muted }}>
                      {model.specialty || "مدرس المنصة"}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                    style={{ background: design.accent }}
                  >
                    مباشر
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** sky: تكوين تحريري + صورة عريضة مع بطاقة عائمة */
function HeroSky({ design, model }) {
  const stats = (model.stats || []).slice(0, 3);
  return (
    <section
      id="home"
      className="relative overflow-hidden px-5 pb-14 pt-[6.75rem] md:px-8 md:pb-20 md:pt-[8rem]"
      style={{ background: "linear-gradient(180deg, #EAF0FA 0%, #F5F8FC 48%, #F5F8FC 100%)" }}
    >
      <div className="relative mx-auto max-w-[1200px]">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 text-right lg:order-1">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-10 w-1.5 rounded-full" style={{ background: design.accent }} />
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em]" style={{ color: design.accent }}>
                  المنصة الرسمية
                </p>
                <p className="text-sm font-semibold" style={{ color: design.muted }}>
                  {model.specialty || model.brandName}
                </p>
              </div>
            </div>

            <h1
              className="text-[2rem] font-black leading-[1.55] sm:text-4xl sm:leading-[1.5] md:text-[2.7rem] md:leading-[1.45] lg:text-[3rem] lg:leading-[1.4]"
              style={{ fontFamily: design.headingFont, color: design.fg }}
            >
              {highlightTeacherName(model.heroTitle, model.teacherName, design.accent)}
            </h1>
            <p className="mt-5 max-w-xl text-[0.98rem] leading-8 md:text-[1.05rem]" style={{ color: design.muted }}>
              {heroDescription(model)}
            </p>
            <div className="mt-8">
              <HeroActions design={design} model={model} />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              <div
                className="absolute -inset-x-2 -bottom-2 top-8 rounded-[2rem] opacity-80"
                style={{ background: design.accent2 || design.fg }}
              />
              <div
                className="relative overflow-hidden shadow-[0_32px_70px_-34px_rgba(11,27,58,0.5)]"
                style={{ borderRadius: "1.65rem" }}
              >
                <PortraitOrFallback
                  url={model.teacherPortraitUrl}
                  name={model.teacherName}
                  className="aspect-[16/11] w-full object-cover object-top lg:aspect-[5/4]"
                  style={{ background: "#DCE6F5", color: design.muted }}
                />
                <div
                  className="absolute inset-x-0 top-0 flex items-center justify-between p-4"
                >
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold backdrop-blur" style={{ color: design.fg }}>
                    {model.teacherName}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold text-white"
                    style={{ background: design.accent }}
                  >
                    {model.specialty || "تعليمي"}
                  </span>
                </div>
              </div>

              {stats.length ? (
                <div
                  className="relative z-10 mx-3 -mt-8 grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 sm:mx-6 sm:-mt-10 sm:gap-3 sm:p-4"
                  style={{
                    border: "1px solid rgba(11,27,58,0.08)",
                    boxShadow: "0 20px 50px -24px rgba(11,27,58,0.4)",
                  }}
                >
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-lg font-black sm:text-xl" style={{ color: design.accent }}>
                        {stat.value}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold sm:text-[11px]" style={{ color: design.muted }}>
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** navy: إطار سينمائي بتوهج + بطاقة زجاجية */
function HeroNavy({ design, model }) {
  const stats = (model.stats || []).slice(0, 3);
  return (
    <section
      id="home"
      className="relative overflow-hidden px-5 pb-16 pt-[6.75rem] md:px-8 md:pb-24 md:pt-[8rem]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 85% 20%, ${design.accent}40, transparent 55%),
            radial-gradient(ellipse 45% 40% at 5% 70%, ${design.accentSoft}22, transparent 50%),
            radial-gradient(ellipse 30% 30% at 50% 100%, ${design.accent}18, transparent 50%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 md:grid-cols-2 md:gap-14 lg:gap-20">
        <div className="order-2 text-right md:order-1">
          <span
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold"
            style={{
              background: "rgba(59,130,246,0.12)",
              color: design.accentSoft,
              border: `1px solid ${design.accent}55`,
              boxShadow: `0 0 24px -8px ${design.accent}`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: design.accentSoft }} />
            منصة تعليمية إلكترونية متطورة
          </span>

          <h1
            className="text-[2rem] font-black leading-[1.55] text-white sm:text-4xl sm:leading-[1.5] md:text-[2.7rem] md:leading-[1.45] lg:text-[3.05rem] lg:leading-[1.4]"
            style={{ fontFamily: design.headingFont }}
          >
            {highlightTeacherName(model.heroTitle, model.teacherName, design.accentSoft || design.accent)}
          </h1>
          {model.specialty ? (
            <p
              className="mt-3 text-lg font-bold md:text-xl"
              style={{
                background: `linear-gradient(90deg, ${design.accentSoft}, ${design.accent})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {model.specialty}
            </p>
          ) : null}
          <p className="mt-5 max-w-xl text-[0.98rem] leading-8 md:text-[1.05rem]" style={{ color: design.muted }}>
            {heroDescription(model)}
          </p>
          <div className="mt-8">
            <HeroActions design={design} model={model} />
          </div>

          {stats.length ? (
            <div className="mt-10 flex flex-wrap gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[6.5rem] flex-1 rounded-2xl px-4 py-3.5 text-center backdrop-blur"
                  style={{
                    background: "rgba(15,28,48,0.65)",
                    border: `1px solid ${design.accent}40`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 40px -20px ${design.accent}`,
                  }}
                >
                  <p className="text-xl font-black" style={{ color: design.accentSoft }}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold" style={{ color: design.muted }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="order-1 flex justify-center md:order-2">
          <div className="relative w-full max-w-[400px]">
            <div
              className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
              style={{ background: `radial-gradient(circle, ${design.accent}55, transparent 65%)` }}
            />
            <div
              className="absolute -inset-1 rounded-[2rem] opacity-80"
              style={{
                background: `linear-gradient(145deg, ${design.accent}, ${design.accentSoft}, transparent 70%)`,
              }}
            />
            <div
              className="relative overflow-hidden p-1.5"
              style={{
                borderRadius: "1.85rem",
                background: design.surface,
                boxShadow: `0 40px 90px -30px ${design.accent}99`,
              }}
            >
              <div className="overflow-hidden" style={{ borderRadius: "1.45rem" }}>
                <PortraitOrFallback
                  url={model.teacherPortraitUrl}
                  name={model.teacherName}
                  className="aspect-[4/5] w-full object-cover object-top sm:aspect-[5/4]"
                  style={{ background: design.card, color: design.muted }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 p-4 pt-20"
                  style={{
                    background: `linear-gradient(transparent, ${design.pageBg}f2)`,
                  }}
                >
                  <div
                    className="rounded-2xl p-3.5 backdrop-blur-md"
                    style={{
                      background: "rgba(12,22,40,0.72)",
                      border: `1px solid ${design.accent}44`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-white">{model.teacherName}</p>
                        <p className="truncate text-[11px]" style={{ color: design.muted }}>
                          {model.specialty || "مدرس المنصة"}
                        </p>
                      </div>
                      <div
                        className="h-2 w-16 overflow-hidden rounded-full"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      >
                        <div
                          className="h-full w-[78%] rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${design.accent}, ${design.accentSoft})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroSection({ design, model }) {
  if (design.id === "ember") return <HeroEmber design={design} model={model} />;
  if (design.id === "sky") return <HeroSky design={design} model={model} />;
  return <HeroNavy design={design} model={model} />;
}

function WhyUsCta({ design, model, variant = "band" }) {
  const title = `هل أنت مستعد لأول خطوة للتفوق${model.specialty ? ` في ${model.specialty}` : ""}؟`;
  const actions = (
    <div className="flex flex-wrap gap-3">
      {!model.hideSignup && model.signupHref ? (
        <PrimaryButton design={design} href={model.signupHref}>
          ابدأ الآن
        </PrimaryButton>
      ) : null}
      <PrimaryButton
        design={design}
        href={model.whatsappHref || "#contact"}
        solid={false}
        onDark={variant !== "soft"}
      >
        تواصل
      </PrimaryButton>
    </div>
  );

  if (variant === "soft") {
    return (
      <div
        className="mt-10 flex flex-col items-start justify-between gap-5 rounded-3xl border px-6 py-6 md:flex-row md:items-center"
        style={{
          background: `${design.accent}0F`,
          borderColor: `${design.accent}33`,
        }}
      >
        <div>
          <p className="text-lg font-extrabold md:text-xl" style={{ color: design.fg }}>
            {title}
          </p>
          <p className="mt-1 text-sm" style={{ color: design.muted }}>
            انضم للمنصة وابدأ مسارًا واضحًا مع متابعة مستمرة.
          </p>
        </div>
        {actions}
      </div>
    );
  }

  if (variant === "split") {
    return (
      <div
        className="mt-12 overflow-hidden rounded-[1.75rem]"
        style={{ background: design.ctaBand || design.accent2 }}
      >
        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          <div className="px-6 py-8 text-white md:px-10">
            <p className="text-2xl font-black leading-snug md:text-3xl">{title}</p>
            <p className="mt-3 max-w-md text-sm leading-7 opacity-80">
              انضم للمنصة وابدأ مسارًا واضحًا مع متابعة مستمرة.
            </p>
          </div>
          <div
            className="flex items-center justify-start gap-3 px-6 py-6 md:justify-end md:px-8"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {actions}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-10 flex flex-col items-start justify-between gap-5 px-6 py-6 md:flex-row md:items-center"
      style={{
        background: design.ctaBand || design.fg,
        color: "#fff",
        borderRadius: design.radius,
        boxShadow: `0 24px 60px -28px ${design.accent}88`,
      }}
    >
      <div>
        <p className="text-lg font-extrabold md:text-xl">{title}</p>
        <p className="mt-1 text-sm opacity-75">انضم للمنصة وابدأ مسارًا واضحًا مع متابعة مستمرة.</p>
      </div>
      {actions}
    </div>
  );
}

/** ember: بطاقات ناعمة بظل دافئ */
function WhyUsEmber({ design, model, services }) {
  return (
    <section id="services" className="px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          design={design}
          center
          eyebrow="لماذا نحن"
          title={`لماذا تختار الدراسة مع ${model.teacherName || model.brandName}؟`}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
            return (
              <article
                key={service.title || index}
                className="relative overflow-hidden bg-white p-6 transition hover:-translate-y-1"
                style={{
                  borderRadius: "1.25rem",
                  boxShadow: "0 18px 50px -28px rgba(15,23,42,0.28)",
                  border: "1px solid rgba(15,23,42,0.05)",
                }}
              >
                <div
                  className="absolute -left-6 -top-6 h-20 w-20 rounded-full opacity-40"
                  style={{ background: `${design.accent}22` }}
                />
                <div className="relative mb-5 flex items-start justify-between">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg"
                    style={{ background: `${design.accent}14`, color: design.accent }}
                  >
                    <Icon />
                  </span>
                  <span className="text-2xl font-black opacity-15" style={{ color: design.accent2 }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="relative text-lg font-extrabold">{service.title}</h3>
                <p className="relative mt-2 text-sm leading-7" style={{ color: design.muted }}>
                  {service.description}
                </p>
                <div
                  className="relative mt-5 h-1 w-12 rounded-full"
                  style={{ background: design.accent }}
                />
              </article>
            );
          })}
        </div>
        <WhyUsCta design={design} model={model} variant="soft" />
      </div>
    </section>
  );
}

/** sky: عمود مقدمة + شبكة 2×2 بحدود كحلية */
function WhyUsSky({ design, model, services }) {
  return (
    <section
      id="services"
      className="px-5 py-16 md:px-8 md:py-20"
      style={{ background: "#EEF3FA" }}
    >
      <div className="mx-auto grid max-w-[1200px] items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div className="lg:sticky lg:top-28">
          <p className="mb-3 text-xs font-bold tracking-[0.18em]" style={{ color: design.accent }}>
            لماذا نحن
          </p>
          <h2
            className="text-3xl font-extrabold leading-tight md:text-4xl"
            style={{ fontFamily: design.headingFont, color: design.fg }}
          >
            لماذا تختار الدراسة مع {model.teacherName || model.brandName}؟
          </h2>
          <p className="mt-4 text-sm leading-8 md:text-base" style={{ color: design.muted }}>
            منهج واضح، متابعة حقيقية، وتجربة تعليمية مرتبة تساعدك توصل لهدفك خطوة بخطوة.
          </p>
          <div
            className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
            style={{ background: `${design.accent}14`, color: design.accent }}
          >
            {services.length} مميزات أساسية
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service, index) => {
            const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
            return (
              <article
                key={service.title || index}
                className="flex gap-4 bg-white p-5"
                style={{
                  borderRadius: "1.25rem",
                  border: "1px solid rgba(11,27,58,0.08)",
                  boxShadow: "0 14px 40px -28px rgba(11,27,58,0.35)",
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                    style={{ background: design.accent2 || design.fg }}
                  >
                    <Icon className="text-sm" />
                  </span>
                  <span className="text-[11px] font-black" style={{ color: design.accent }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold" style={{ color: design.fg }}>
                    {service.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-7" style={{ color: design.muted }}>
                    {service.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="mx-auto max-w-[1200px]">
        <WhyUsCta design={design} model={model} variant="split" />
      </div>
    </section>
  );
}

/** navy: بطاقات زجاجية مع أرقام كبيرة وتوهج */
function WhyUsNavy({ design, model, services, softBorder }) {
  return (
    <section
      id="services"
      className="relative overflow-hidden px-5 py-16 md:px-8 md:py-20"
      style={{ background: design.surface }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${design.accent}22, transparent 50%)`,
        }}
      />
      <div className="relative mx-auto max-w-[1200px]">
        <SectionHeading
          design={design}
          center
          eyebrow="لماذا نحن"
          title={`لماذا تختار الدراسة مع ${model.teacherName || model.brandName}؟`}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service, index) => {
            const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
            return (
              <article
                key={service.title || index}
                className="relative overflow-hidden p-6 md:p-7"
                style={{
                  background: `linear-gradient(145deg, ${design.card}, ${design.pageBg})`,
                  borderRadius: "1.35rem",
                  border: `1px solid ${softBorder}`,
                  boxShadow: `0 0 0 1px ${design.accent}10, 0 24px 60px -36px ${design.accent}66`,
                }}
              >
                <span
                  className="pointer-events-none absolute -left-2 -top-4 text-7xl font-black leading-none opacity-[0.07] md:text-8xl"
                  style={{ color: design.accentSoft || design.accent }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="relative flex items-start gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${design.accent}, ${design.accentSoft || design.accent2})`,
                      color: "#fff",
                      boxShadow: `0 12px 30px -10px ${design.accent}99`,
                    }}
                  >
                    <Icon />
                  </span>
                  <div>
                    <h3 className="text-xl font-extrabold">{service.title}</h3>
                    <p className="mt-2 text-sm leading-7" style={{ color: design.muted }}>
                      {service.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <WhyUsCta design={design} model={model} variant="band" />
      </div>
    </section>
  );
}

function WhyUsSection({ design, model, services, softBorder, cardShadow }) {
  if (design.id === "ember") {
    return <WhyUsEmber design={design} model={model} services={services} />;
  }
  if (design.id === "sky") {
    return <WhyUsSky design={design} model={model} services={services} />;
  }
  if (design.id === "navy") {
    return (
      <WhyUsNavy
        design={design}
        model={model}
        services={services}
        softBorder={softBorder}
      />
    );
  }
  // احتياطي
  return (
    <WhyUsEmber design={design} model={model} services={services} cardShadow={cardShadow} />
  );
}

function StructuredLanding({ design, model }) {
  const isDark = design.heroTone === "dark";
  const services = (model.services || []).slice(0, 4);
  const courses = model.courses || [];
  const testimonials = (model.testimonials || []).slice(0, 3);
  const journey = model.journey?.length ? model.journey : DEFAULT_JOURNEY;
  const freeLectures = model.freeLectures || [];
  const contact = model.contact || {};
  const softBorder = isDark ? `${design.accent}28` : "rgba(15,23,42,0.07)";
  const cardShadow = isDark
    ? `0 20px 50px -30px ${design.accent}66`
    : "0 22px 50px -28px rgba(15,23,42,0.28)";

  return (
    <div style={{ color: design.fg, background: design.pageBg }}>
      <HeroSection design={design} model={model} />

      <WhyUsSection
        design={design}
        model={model}
        services={services}
        softBorder={softBorder}
        cardShadow={cardShadow}
      />

      {/* Journey */}
      <section id="how-it-works" className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
        <SectionHeading design={design} center eyebrow="خطوات واضحة" title="رحلة التعلم خطوة بخطوة" />
        <div className="grid gap-4 md:grid-cols-3">
          {journey.slice(0, 3).map((step, index) => {
            const active = index === 1;
            return (
              <article
                key={step.title}
                className="p-6 transition"
                style={{
                  background: active ? design.card : design.surface,
                  borderRadius: design.radius,
                  border: active
                    ? `2px solid ${design.accent}`
                    : `1px solid ${softBorder}`,
                  boxShadow: active ? cardShadow : undefined,
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center text-sm font-black"
                  style={{
                    background: active ? design.accent : `${design.accent}18`,
                    color: active ? design.accentFg : design.accent,
                    borderRadius: "999px",
                  }}
                >
                  {index + 1}
                </div>
                <h3 className="mt-4 text-xl font-extrabold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7" style={{ color: design.muted }}>
                  {step.description}
                </p>
                <a
                  href="#courses"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold"
                  style={{ color: design.accent }}
                >
                  مشاهدة التفاصيل
                  <FaArrowLeft className="text-[10px]" />
                </a>
              </article>
            );
          })}
        </div>
        {!model.hideSignup && model.signupHref ? (
          <div className="mt-10 flex justify-center">
            <PrimaryButton design={design} href={model.signupHref}>
              ابدأ رحلتك الآن
            </PrimaryButton>
          </div>
        ) : null}
      </section>

      {/* Free lectures */}
      {freeLectures.length ? (
        <section
          id="videos"
          className="px-5 py-16 md:px-8"
          style={{ background: isDark ? design.surface : undefined }}
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionHeading design={design} eyebrow="جرّب قبل الاشتراك" title="محاضرات مجانية" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {freeLectures.slice(0, 6).map((lecture) => {
                const img = getCardImageUrl(
                  lecture.thumbnail || lecture.image_url || model.courseFallbackImage,
                );
                return (
                  <button
                    key={lecture.id || lecture.title}
                    type="button"
                    onClick={() => model.onPlayFreeLecture?.(lecture)}
                    className="overflow-hidden text-right transition hover:-translate-y-0.5"
                    style={{
                      background: design.card,
                      borderRadius: design.radius,
                      border: `1px solid ${softBorder}`,
                      boxShadow: cardShadow,
                    }}
                  >
                    <div className="relative">
                      {img ? (
                        <img src={img} alt="" className="h-40 w-full object-cover" />
                      ) : (
                        <div className="h-40 w-full" style={{ background: `${design.accent}22` }} />
                      )}
                      <span
                        className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full text-white"
                        style={{ background: design.accent }}
                      >
                        <FaPlay className="text-xs" />
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-extrabold leading-6">
                        {lecture.title || lecture.name || "محاضرة مجانية"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Courses */}
      {courses.length ? (
        <section
          id="courses"
          className="px-5 py-16 md:px-8 md:py-20"
          style={{ background: isDark && !freeLectures.length ? design.surface : undefined }}
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionHeading
              design={design}
              eyebrow="برامج المنصة"
              title="الكورسات المتاحة"
              aside={
                <TenantAppLink
                  href="/courses"
                  className="mb-2 inline-flex items-center gap-2 text-sm font-bold"
                  style={{ color: design.accent }}
                >
                  عرض الكل
                  <FaArrowLeft className="text-[10px]" />
                </TenantAppLink>
              }
            />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {courses.slice(0, 6).map((course) => (
                <CourseCard
                  key={course.id || courseTitle(course)}
                  course={course}
                  design={design}
                  softBorder={softBorder}
                  cardShadow={cardShadow}
                  fallbackImage={model.courseFallbackImage}
                />
              ))}
            </div>

            {courses.length > 6 ? (
              <div className="mt-8 flex justify-center">
                <PrimaryButton design={design} href="/courses" solid={false}>
                  عرض كل الكورسات ({courses.length.toLocaleString("ar-EG")})
                </PrimaryButton>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Testimonials */}
      {testimonials.length ? (
        <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <h2
              className="text-3xl font-extrabold md:text-4xl"
              style={{ fontFamily: design.headingFont }}
            >
              ماذا يقول طلابنا؟
            </h2>
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
              style={{ background: `${design.accent}16`, color: design.accent }}
            >
              <FaStar />
              تقييم 4.9 / 5
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <article
                key={item.name || index}
                className="flex flex-col p-6"
                style={{
                  background: design.surface,
                  borderRadius: design.radius,
                  border: `1px solid ${softBorder}`,
                  boxShadow: cardShadow,
                }}
              >
                <FaQuoteRight className="text-xl" style={{ color: design.accent }} />
                <p className="mt-4 flex-1 text-sm leading-7" style={{ color: design.muted }}>
                  {item.text || item.comment || item.content}
                </p>
                <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: softBorder }}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: `${design.accent}22`, color: design.accent }}
                    >
                      {(item.name || "ط").slice(0, 1)}
                    </span>
                    <div>
                      <p className="font-extrabold">{item.name || "طالب"}</p>
                      <p className="text-[11px]" style={{ color: design.muted }}>
                        {item.role || item.grade || "طالب بالمنصة"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: design.accent }}>
                    <FaStar />
                    {item.rating || "5.0"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Bottom CTA */}
      <section className="px-5 py-16 md:px-8" style={{ background: design.ctaBand || design.fg, color: "#fff" }}>
        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <h2 className="text-3xl font-black leading-tight md:text-4xl">
              ابدأ رحلة التعلم اليوم مع {model.teacherName || model.brandName}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 opacity-80">
              انضم لآلاف الطلاب وتابع شرحًا منظمًا مع متابعة مستمرة على منصة{" "}
              {model.brandName || model.teacherName}.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {!model.hideSignup && model.signupHref ? (
                <PrimaryButton design={design} href={model.signupHref}>
                  سجّل الآن
                </PrimaryButton>
              ) : null}
              <PrimaryButton design={design} href={model.loginHref} solid={false} onDark>
                تسجيل الدخول
              </PrimaryButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl px-4 py-4"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <Icon className="mb-2 text-lg" style={{ color: design.accentSoft || design.accent }} />
                  <p className="text-sm font-extrabold">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="border-t px-5 py-12 md:px-8"
        style={{
          background: isDark ? design.pageBg : design.ctaBand || "#0B1220",
          color: "#fff",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              {model.tenantAvatar ? (
                <img
                  src={model.tenantAvatar}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: design.accent }}
                >
                  {(model.brandName || "م").slice(0, 1)}
                </span>
              )}
              <p className="text-lg font-bold">{model.brandName}</p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-7 opacity-75">
              {model.bioSnippet || model.bioText}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                [contact.facebook, FaFacebook, "Facebook"],
                [contact.instagram, FaInstagram, "Instagram"],
                [contact.youtube, FaYoutube, "YouTube"],
                [contact.tiktok, FaTiktok, "TikTok"],
                [contact.whatsapp || model.whatsappHref, FaWhatsapp, "WhatsApp"],
              ]
                .filter(([href]) => href)
                .map(([href, Icon, label]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: "rgba(255,255,255,0.08)", color: design.accentSoft || design.accent }}
                  >
                    <Icon />
                  </a>
                ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold">روابط سريعة</p>
            <ul className="mt-4 space-y-2.5 text-sm opacity-75">
              {(model.quickLinks || [
                ["#home", "الرئيسية"],
                ["#services", "لماذا نحن"],
                ["#how-it-works", "كيف تبدأ"],
                ["#courses", "الكورسات"],
              ]).map(([href, label]) => (
                <li key={href + label}>
                  <a href={href} className="hover:opacity-100">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold">حسابك</p>
            <ul className="mt-4 space-y-2.5 text-sm opacity-75">
              <li>
                <TenantAppLink href={model.loginHref}>تسجيل الدخول</TenantAppLink>
              </li>
              {!model.hideSignup && model.signupHref ? (
                <li>
                  <TenantAppLink href={model.signupHref}>إنشاء حساب</TenantAppLink>
                </li>
              ) : null}
              <li>
                <TenantAppLink href="/courses">الكورسات</TenantAppLink>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold">تواصل معنا</p>
            <ul className="mt-4 space-y-2.5 text-sm opacity-75">
              {contact.whatsapp || model.whatsappHref ? (
                <li>
                  <a href={contact.whatsapp || model.whatsappHref} target="_blank" rel="noopener noreferrer">
                    واتساب الدعم
                  </a>
                </li>
              ) : null}
              {model.specialty ? <li>{model.specialty}</li> : null}
              <li>{model.teacherName || model.brandName}</li>
            </ul>
          </div>
        </div>
        <div
          className="mx-auto mt-10 max-w-[1200px] border-t pt-5 text-center text-xs opacity-60"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          جميع الحقوق محفوظة © {model.brandName} {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

export default function TenantAlternateLanding({ layout, model }) {
  const design = getLandingDesign(layout);
  useDesignFont(design);
  if (design.id === "bento") return null;
  return <StructuredLanding design={design} model={model} />;
}
