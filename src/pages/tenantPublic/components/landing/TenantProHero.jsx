/**
 * هيرو landing للمنصة — وصف كامل + تخطيط موبايل أوضح
 */
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FaGraduationCap, FaPlay, FaWhatsapp } from "react-icons/fa";
import {
  HeroGlowOrb,
  HeroStagger,
  HeroStaggerItem,
  Tilt3D,
} from "../../tenantLandingMotion";
import {
  getBlurPlaceholderUrl,
  getPortraitImageSrcSet,
} from "../../../../utils/highQualityImageUrl";
import {
  TL_CYAN as CYAN,
  TL_NAVY as NAVY,
  tlContainer,
} from "../../tenantLandingTheme";
import TenantAppLink from "../TenantAppLink";

const EASE = [0.22, 1, 0.36, 1];

function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(min-width: ${breakpoint}px)`).matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isDesktop;
}

function SpecialtyBadge({ specialty, className = "" }) {
  if (!specialty) return null;
  return (
    <motion.span
      className={`inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--tl-border)] bg-[var(--tl-card)] px-3 py-1.5 text-xs font-semibold leading-snug text-[var(--tl-fg)] backdrop-blur-sm sm:text-sm ${className}`}
      whileHover={{ scale: 1.03, y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
    >
      <motion.span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: CYAN }}
        animate={{ scale: [1, 1.35, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <span>{specialty}</span>
    </motion.span>
  );
}

function HighlightsCard({ highlights, compact = false }) {
  if (!highlights?.length) return null;
  const items = compact ? highlights.slice(0, 3) : highlights;
  return (
    <motion.ul
      className={`rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] text-right shadow-sm ${
        compact ? "px-3.5 py-3" : "px-4 py-4 md:px-5 md:py-5"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {items.map((item, i) => (
        <motion.li
          key={`${item}-${i}`}
          className={`flex items-start gap-2.5 border-b border-[color:var(--tl-border)] last:border-0 last:pb-0 first:pt-0 ${
            compact ? "py-2.5" : "py-2.5 md:py-3"
          }`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
        >
          <span
            className="mt-2 h-2 w-2 shrink-0 rounded-full"
            style={{ background: CYAN }}
            aria-hidden
          />
          <span className="flex-1 text-[13px] font-medium leading-7 text-[var(--tl-fg)] sm:text-sm sm:leading-7">
            {item}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

function HeroActions({
  signupHref,
  loginHref,
  whatsappHref,
  showFreeVideos,
  stacked = false,
  compact = false,
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className={
          compact
            ? "grid w-full grid-cols-2 gap-2.5"
            : stacked
              ? "flex w-full flex-col gap-2.5"
              : "flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-start"
        }
      >
        <motion.div
          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className={compact ? "col-span-1" : "w-full sm:w-auto"}
        >
          <TenantAppLink
            href={signupHref}
            className={`inline-flex w-full items-center justify-center rounded-xl font-bold text-white shadow-lg transition hover:brightness-110 ${
              compact ? "px-3 py-3 text-[13px]" : "px-5 py-3.5 text-sm sm:min-w-[160px] sm:w-auto"
            }`}
            style={{
              background: CYAN,
              boxShadow: `0 10px 28px -8px ${CYAN}99`,
            }}
          >
            إنشاء حساب
          </TenantAppLink>
        </motion.div>
        <motion.div
          whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className={compact ? "col-span-1" : "w-full sm:w-auto"}
        >
          <TenantAppLink
            href={loginHref}
            className={`inline-flex w-full items-center justify-center rounded-xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] font-bold text-[var(--tl-fg)] shadow-sm transition hover:bg-[var(--tl-soft)] ${
              compact ? "px-3 py-3 text-[13px]" : "px-5 py-3.5 text-sm sm:min-w-[160px] sm:w-auto"
            }`}
          >
            تسجيل دخول
          </TenantAppLink>
        </motion.div>
        {whatsappHref ? (
          <motion.a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/50 bg-[#25D366]/12 font-bold text-[#128C7E] transition hover:bg-[#25D366]/20 [.tenant-dark_&]:border-[#25D366]/40 [.tenant-dark_&]:bg-[#25D366]/15 [.tenant-dark_&]:text-[#6EFFA0] ${
              compact
                ? "col-span-2 px-4 py-3 text-[13px]"
                : "px-5 py-3.5 text-sm sm:w-auto sm:min-w-[180px]"
            }`}
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <FaWhatsapp className="text-lg text-[#25D366]" />
            تواصل واتساب
          </motion.a>
        ) : null}
      </div>

      {showFreeVideos ? (
        <motion.a
          href="#videos"
          className={`inline-flex items-center gap-2.5 pt-0.5 text-sm font-semibold text-[var(--tl-muted)] transition hover:text-[var(--tl-fg)] ${
            compact ? "justify-center" : "justify-center sm:justify-start"
          }`}
          whileHover={reduceMotion ? undefined : { x: -4 }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--tl-border)] bg-[var(--tl-soft)]">
            <FaPlay className="mr-[-1px] text-[10px]" style={{ color: CYAN }} />
          </span>
          شاهد محاضرة مجانية
        </motion.a>
      ) : null}
    </div>
  );
}

function HeroCopy({
  specialty,
  teacherName,
  heroTitle,
  tagline,
  bioText,
  highlights,
  signupHref,
  loginHref,
  whatsappHref,
  showFreeVideos,
  align = "start",
  variant = "default",
}) {
  const isCenter = align === "center";
  const isMobile = variant === "mobile";
  const headline = (heroTitle && heroTitle.trim()) || teacherName;
  const showTeacherLine =
    Boolean(teacherName?.trim()) &&
    Boolean(heroTitle?.trim()) &&
    heroTitle.trim() !== teacherName.trim();

  const lead = (tagline && String(tagline).trim()) || "";
  const description = (bioText && String(bioText).trim()) || "";

  return (
    <HeroStagger>
      {specialty && !isMobile ? (
        <HeroStaggerItem
          className={`mb-3 sm:mb-4 ${isCenter ? "flex justify-center" : "flex justify-start"}`}
        >
          <SpecialtyBadge specialty={specialty} />
        </HeroStaggerItem>
      ) : null}

      <HeroStaggerItem className={isCenter ? "text-center" : "text-right"}>
        <h1
          className={`font-heading font-bold tracking-tight text-[var(--tl-fg)] ${
            isMobile
              ? "text-[1.5rem] leading-[1.4] sm:text-[1.75rem]"
              : "text-[1.65rem] leading-[1.35] sm:text-[2rem] lg:text-[2.75rem] lg:leading-[1.25]"
          }`}
        >
          {headline}
        </h1>
        {showTeacherLine ? (
          <p
            className={`mt-2 font-semibold text-[var(--tl-muted)] ${
              isMobile ? "text-sm sm:text-base" : "text-base sm:text-lg"
            }`}
          >
            مع {teacherName}
          </p>
        ) : null}
        {!isMobile ? (
          <motion.span
            className={`mt-3 block h-[3px] w-12 rounded-full sm:w-16 ${isCenter ? "mx-auto" : "ms-0"}`}
            style={{ background: CYAN, originX: isCenter ? 0.5 : 1 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 0.55, ease: EASE }}
            aria-hidden
          />
        ) : null}
      </HeroStaggerItem>

      {lead ? (
        <HeroStaggerItem className={`${isMobile ? "mt-3" : "mt-4"} ${isCenter ? "text-center" : "text-right"}`}>
          <p
            className={`font-semibold text-[var(--tl-fg)] ${
              isMobile
                ? "text-[0.9rem] leading-7"
                : "text-[0.95rem] leading-8 sm:text-base sm:leading-8"
            }`}
          >
            {lead}
          </p>
        </HeroStaggerItem>
      ) : null}

      {description ? (
        <HeroStaggerItem className={`mt-2.5 ${isCenter ? "text-center" : "text-right"}`}>
          <p
            className={`whitespace-pre-line text-[var(--tl-muted)] ${
              isMobile
                ? "text-[0.875rem] leading-[1.85]"
                : "text-[0.925rem] leading-8 sm:text-base sm:leading-8"
            }`}
          >
            {description}
          </p>
        </HeroStaggerItem>
      ) : null}

      {highlights.length > 0 ? (
        <HeroStaggerItem className={`w-full ${isMobile ? "mt-4" : "mt-5 sm:mt-6"}`}>
          <HighlightsCard highlights={highlights} compact={isMobile || isCenter} />
        </HeroStaggerItem>
      ) : null}

      <HeroStaggerItem className={`w-full ${isMobile ? "mt-5" : "mt-6 sm:mt-8"}`}>
        <HeroActions
          signupHref={signupHref}
          loginHref={loginHref}
          whatsappHref={whatsappHref}
          showFreeVideos={showFreeVideos}
          stacked={isMobile || isCenter}
          compact={isMobile}
        />
      </HeroStaggerItem>
    </HeroStagger>
  );
}

function TeacherImage({
  src,
  alt,
  className = "",
  fade = "bottom",
  priority = true,
  objectPosition = "center 18%",
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const blurSrc = src && !error ? getBlurPlaceholderUrl(src) : null;
  const srcSet = src && !error ? getPortraitImageSrcSet(src) : undefined;

  useEffect(() => {
    setLoaded(false);
    setError(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[var(--tl-card-solid)] ${className}`}>
      {src && !error ? (
        <>
          {blurSrc ? (
            <img
              src={blurSrc}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover"
              style={{ filter: "blur(16px)", objectPosition }}
              loading="eager"
              decoding="async"
            />
          ) : !loaded ? (
            <div className="absolute inset-0 animate-pulse bg-white/10" aria-hidden />
          ) : null}
          <img
            ref={imgRef}
            src={src}
            srcSet={srcSet}
            sizes="(min-width: 1024px) min(520px, 45vw), 100vw"
            alt={alt}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ objectPosition }}
            loading={priority ? "eager" : "lazy"}
            fetchpriority={priority ? "high" : "auto"}
            decoding="async"
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(160deg, #1e3a5f 0%, ${NAVY} 100%)` }}
        >
          <FaGraduationCap className="text-6xl text-white/25 sm:text-7xl" aria-hidden />
        </div>
      )}

      {fade === "mobile" ? null : fade === "bottom" ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[30%]"
          style={{
            background:
              "linear-gradient(to top, color-mix(in srgb, var(--tl-page-bg) 85%, transparent) 0%, transparent 100%)",
          }}
          aria-hidden
        />
      ) : fade === "side" ? (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-[24%]"
            style={{
              background:
                "linear-gradient(to left, color-mix(in srgb, var(--tl-page-bg) 70%, transparent) 0%, transparent 100%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[14%]"
            style={{
              background:
                "linear-gradient(to top, color-mix(in srgb, var(--tl-page-bg) 60%, transparent) 0%, transparent 100%)",
            }}
            aria-hidden
          />
        </>
      ) : null}
    </div>
  );
}

export default function TenantProHero({
  specialty,
  teacherName,
  heroTitle,
  bioText,
  tagline,
  highlights = [],
  signupHref,
  loginHref,
  whatsappHref,
  showFreeVideos = true,
  teacherImageUrl,
}) {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktop(1024);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : isDesktop ? 70 : 24]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -16]);

  const copyProps = {
    specialty,
    teacherName,
    heroTitle,
    tagline,
    bioText,
    highlights,
    signupHref,
    loginHref,
    whatsappHref,
    showFreeVideos,
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative overflow-hidden bg-[var(--tl-page-bg)]"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <HeroGlowOrb
          className="absolute -left-20 top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: CYAN }}
          delay={0}
        />
        <HeroGlowOrb
          className="absolute -right-16 bottom-20 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "#1e5a8a" }}
          delay={1.2}
        />
      </div>

      {!isDesktop ? (
        <div className="relative pb-8 pt-14 sm:pb-10">
          <motion.div className="relative w-full" style={{ y: imgY }}>
            <div className="relative mx-auto h-[min(52vh,380px)] min-h-[260px] w-full max-w-lg overflow-hidden sm:max-w-xl sm:min-h-[300px]">
              <TeacherImage
                src={teacherImageUrl}
                alt={teacherName}
                fade="mobile"
                priority
                objectPosition="center 12%"
                className="h-full w-full"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, var(--tl-page-bg) 0%, color-mix(in srgb, var(--tl-page-bg) 88%, transparent) 28%, color-mix(in srgb, var(--tl-page-bg) 20%, transparent) 62%, transparent 100%)",
                }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-20"
                style={{
                  background:
                    "linear-gradient(to bottom, color-mix(in srgb, var(--tl-page-bg) 65%, transparent) 0%, transparent 100%)",
                }}
                aria-hidden
              />
              {specialty ? (
                <div className="absolute bottom-14 right-4 z-[3] sm:right-5">
                  <SpecialtyBadge specialty={specialty} className="shadow-md backdrop-blur-md" />
                </div>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            className="relative z-[2] -mt-12 px-4 sm:-mt-14 sm:px-6"
            style={{ y: copyY }}
          >
            <div
              className="mx-auto max-w-xl overflow-hidden rounded-[1.75rem] border border-[color:var(--tl-border)] bg-[var(--tl-card-solid)] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)] backdrop-blur-sm [.tenant-light_&]:bg-white/95 [.tenant-dark_&]:bg-[var(--tl-card-solid)]"
            >
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(to left, ${CYAN}, #7EB8D9)` }}
                aria-hidden
              />
              <div className="p-5 pt-5 sm:p-6">
                <HeroCopy {...copyProps} align="start" variant="mobile" />
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="relative">
          <div
            className={`${tlContainer} grid items-center gap-10 pb-16 pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-16`}
          >
            <motion.div
              className="relative z-10 flex max-w-2xl flex-col justify-center py-6"
              style={{ y: copyY, transformStyle: "preserve-3d" }}
            >
              <HeroCopy {...copyProps} align="start" />
            </motion.div>

            <motion.div
              className="relative mx-auto w-full max-w-[440px] lg:mx-0 lg:justify-self-end lg:max-w-[480px]"
              style={{ y: imgY }}
            >
              {!reduceMotion && (
                <motion.div
                  className="pointer-events-none absolute -left-6 top-12 h-20 w-20 rounded-full blur-md"
                  style={{ background: `${CYAN}55` }}
                  animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden
                />
              )}
              <Tilt3D maxTilt={10} floatPx={8} floatDuration={5.2}>
                <TeacherImage
                  src={teacherImageUrl}
                  alt={teacherName}
                  fade="side"
                  priority
                  objectPosition="center 15%"
                  className="aspect-[3/4] max-h-[min(68vh,560px)] w-full rounded-3xl shadow-[0_32px_70px_-18px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
                />
              </Tilt3D>
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}
