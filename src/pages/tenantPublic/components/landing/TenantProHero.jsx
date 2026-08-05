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

function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(min-width: ${breakpoint}px)`).matches : false,
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
      className={`inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--tl-border)] bg-[var(--tl-card)] px-3.5 py-1.5 text-[11px] font-semibold leading-snug text-[var(--tl-fg)] backdrop-blur-sm md:text-xs ${className}`}
      whileHover={{ scale: 1.04, y: -2 }}
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

function HighlightsCard({ highlights }) {
  if (!highlights?.length) return null;
  return (
    <motion.ul
      className="rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] px-4 py-4 text-right shadow-sm md:px-5 md:py-5"
      style={{ transformStyle: "preserve-3d" }}
      initial={{ rotateX: 12, opacity: 0.6 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {highlights.map((item, i) => (
        <motion.li
          key={item}
          className="flex items-start gap-2.5 border-b border-[color:var(--tl-border)] py-2.5 last:border-0 last:pb-0 first:pt-0 md:py-3"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 + i * 0.1, duration: 0.45 }}
          whileHover={{ x: -4, scale: 1.01 }}
        >
          <motion.span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ background: CYAN }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
            aria-hidden
          />
          <span className="flex-1 text-[13px] font-medium leading-6 text-[var(--tl-fg)] md:text-sm md:leading-7">
            {item}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

function HeroActions({ signupHref, loginHref, whatsappHref, showFreeVideos }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:justify-start">
        <motion.div
          whileHover={reduceMotion ? undefined : { y: -4, scale: 1.04, rotateX: 6 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="contents md:block"
        >
          <TenantAppLink
            href={signupHref}
            className="inline-flex items-center justify-center rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] md:min-w-[160px] md:px-8"
            style={{
              background: CYAN,
              boxShadow: `0 10px 28px -8px ${CYAN}99`,
            }}
          >
            إنشاء حساب
          </TenantAppLink>
        </motion.div>
        <motion.div
          whileHover={reduceMotion ? undefined : { y: -4, scale: 1.03, rotateX: 4 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="contents md:block"
        >
          <TenantAppLink
            href={loginHref}
            className="inline-flex items-center justify-center rounded-xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] px-4 py-3.5 text-sm font-bold text-[var(--tl-fg)] shadow-sm transition hover:bg-[var(--tl-soft)] active:scale-[0.98] md:min-w-[160px] md:px-8"
          >
            تسجيل دخول
          </TenantAppLink>
        </motion.div>
        {whatsappHref ? (
          <motion.a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/50 bg-[#25D366]/12 px-4 py-3.5 text-sm font-bold text-[#128C7E] transition hover:bg-[#25D366]/20 active:scale-[0.98] md:col-span-1 md:min-w-[180px] [.tenant-dark_&]:border-[#25D366]/40 [.tenant-dark_&]:bg-[#25D366]/15 [.tenant-dark_&]:text-[#6EFFA0]"
            whileHover={reduceMotion ? undefined : { y: -4, scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          >
            <FaWhatsapp className="text-lg text-[#25D366]" />
            تواصل واتساب
          </motion.a>
        ) : null}
      </div>

      {showFreeVideos ? (
        <motion.a
          href="#videos"
          className="inline-flex items-center justify-center gap-2.5 text-sm font-semibold text-[var(--tl-muted)] transition hover:text-[var(--tl-fg)] md:justify-start"
          whileHover={reduceMotion ? undefined : { x: -4 }}
        >
          <motion.span
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--tl-border)] bg-[var(--tl-soft)]"
            animate={reduceMotion ? undefined : { scale: [1, 1.12, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <FaPlay className="mr-[-1px] text-[10px]" style={{ color: CYAN }} />
          </motion.span>
          شاهد محاضرة مجانية
        </motion.a>
      ) : null}
    </div>
  );
}

function HeroCopy({
  specialty,
  teacherName,
  tagline,
  highlights,
  signupHref,
  loginHref,
  whatsappHref,
  showFreeVideos,
  align = "center",
}) {
  const isCenter = align === "center";

  return (
    <HeroStagger>
      {specialty ? (
        <HeroStaggerItem
          className={`mb-4 flex ${isCenter ? "justify-center" : "justify-start"}`}
        >
          <SpecialtyBadge specialty={specialty} />
        </HeroStaggerItem>
      ) : null}

      <HeroStaggerItem className={isCenter ? "text-center" : "text-right"}>
        <h1 className="font-heading text-[2rem] font-bold leading-tight tracking-tight text-[var(--tl-fg)] sm:text-[2.35rem] lg:text-[2.85rem]">
          {teacherName}
        </h1>
        <motion.span
          className={`mt-3 block h-[3px] w-14 rounded-full ${isCenter ? "mx-auto" : "ms-0"}`}
          style={{ background: CYAN, originX: isCenter ? 0.5 : 1 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.45, duration: 0.6, ease: EASE }}
          aria-hidden
        />
      </HeroStaggerItem>

      {tagline ? (
        <HeroStaggerItem className={`mt-4 ${isCenter ? "text-center" : "text-right"}`}>
          <p
            className="max-w-xl text-[0.95rem] font-medium leading-7 text-[var(--tl-muted)] md:text-base md:leading-8"
          >
            {tagline}
          </p>
        </HeroStaggerItem>
      ) : null}

      {highlights.length > 0 ? (
        <HeroStaggerItem className={`mt-6 ${isCenter ? "" : "max-w-xl"}`}>
          <HighlightsCard highlights={highlights} />
        </HeroStaggerItem>
      ) : null}

      <HeroStaggerItem className="mt-6 md:mt-8">
        <HeroActions
          signupHref={signupHref}
          loginHref={loginHref}
          whatsappHref={whatsappHref}
          showFreeVideos={showFreeVideos}
        />
      </HeroStaggerItem>
    </HeroStagger>
  );
}

function TeacherImage({ src, alt, className = "", fade = "bottom", priority = true }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  const blurSrc = src ? getBlurPlaceholderUrl(src) : null;
  const srcSet = src ? getPortraitImageSrcSet(src) : undefined;

  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[var(--tl-card-solid)] ${className}`}>
      {src ? (
        <>
          {blurSrc ? (
            <img
              src={blurSrc}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover object-top"
              style={{ filter: "blur(16px)" }}
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
            sizes="(min-width: 768px) min(520px, 45vw), 100vw"
            alt={alt}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            loading={priority ? "eager" : "lazy"}
            fetchpriority={priority ? "high" : "auto"}
            decoding="async"
            draggable={false}
            onLoad={() => setLoaded(true)}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(160deg, #1e3a5f 0%, ${NAVY} 100%)` }}
        >
          <FaGraduationCap className="text-7xl text-white/25 lg:text-8xl" aria-hidden />
        </div>
      )}

      {fade === "bottom" ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[50%]"
            style={{
              background:
                "linear-gradient(to top, var(--tl-hero-fade) 0%, color-mix(in srgb, var(--tl-hero-fade) 72%, transparent) 30%, transparent 100%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-20"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--tl-hero-fade) 55%, transparent) 0%, transparent 100%)",
            }}
            aria-hidden
          />
        </>
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-[28%]"
            style={{
              background:
                "linear-gradient(to left, var(--tl-hero-fade) 0%, transparent 100%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[18%]"
            style={{
              background:
                "linear-gradient(to top, var(--tl-hero-fade) 0%, transparent 100%)",
            }}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}

/**
 * هيرو سينمائي موحّد — موبايل (عمودي) + لابتوب/ديسكتوب (أفقي)
 * بنفس الألوان: كحلي / سماوي / أصفر + إحساس 3D
 */
export default function TenantProHero({
  specialty,
  teacherName,
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
  const isDesktop = useIsDesktop(768);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 90]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, reduceMotion ? 1 : 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -40]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduceMotion ? 1 : 0.35]);

  const resolvedTagline =
    (tagline && String(tagline).trim()) ||
    (bioText && String(bioText).trim().slice(0, 100)) ||
    "";

  const copyProps = {
    specialty,
    teacherName,
    tagline: resolvedTagline,
    highlights,
    signupHref,
    loginHref,
    whatsappHref,
    showFreeVideos,
  };

  const portrait = (
    <TeacherImage
      src={teacherImageUrl}
      alt={teacherName}
      fade={isDesktop ? "side" : "bottom"}
      priority
      className={
        isDesktop
          ? "aspect-[3/4] w-full max-h-[min(72vh,680px)] rounded-3xl ring-1 ring-white/10 shadow-[0_32px_70px_-18px_rgba(0,0,0,0.65)]"
          : "aspect-[4/5] max-h-[58vh] min-h-[280px] w-full"
      }
    />
  );

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative overflow-hidden bg-[var(--tl-page-bg)]"
      style={{ perspective: 1400 }}
      dir="rtl"
    >
      {/* Floating depth orbs */}
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
        <HeroGlowOrb
          className="absolute left-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full blur-2xl"
          style={{ background: "#7EB8D9" }}
          delay={0.6}
        />
      </div>

      {!isDesktop ? (
        <div className="relative">
          <motion.div className="relative w-full overflow-hidden pt-16" style={{ y: imgY, scale: imgScale }}>
            {portrait}
          </motion.div>
          <motion.div className="relative -mt-10 px-5 pb-8 pt-2" style={{ y: copyY, opacity: copyOpacity }}>
            <HeroCopy {...copyProps} align="center" />
          </motion.div>
        </div>
      ) : (
        <div className="relative">
          <div
            className={`${tlContainer} grid items-center gap-8 pt-24 pb-14 lg:grid-cols-2 lg:gap-10 lg:pb-16 xl:gap-14`}
          >
            <motion.div
              className="relative z-10 flex flex-col justify-center py-4 lg:py-8"
              style={{ y: copyY, opacity: copyOpacity, transformStyle: "preserve-3d" }}
            >
              <HeroCopy {...copyProps} align="start" />
            </motion.div>

            <motion.div
              className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:max-w-none"
              style={{ y: imgY, scale: imgScale }}
            >
              {!reduceMotion && (
                <>
                  <motion.div
                    className="pointer-events-none absolute -left-6 top-12 h-20 w-20 rounded-full blur-md"
                    style={{ background: `${CYAN}55` }}
                    animate={{ y: [0, -16, 0], x: [0, 10, 0] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden
                  />
                  <motion.div
                    className="pointer-events-none absolute -right-4 bottom-20 h-16 w-16 rounded-full blur-sm"
                    style={{ background: `${CYAN}50` }}
                    animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
                    transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                    aria-hidden
                  />
                </>
              )}
              <Tilt3D maxTilt={14} floatPx={12} floatDuration={5.2}>
                {portrait}
              </Tilt3D>
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}
