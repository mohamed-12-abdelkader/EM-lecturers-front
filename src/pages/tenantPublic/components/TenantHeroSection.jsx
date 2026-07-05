import { motion } from "framer-motion";
import { FaArrowLeft, FaAward, FaGraduationCap } from "react-icons/fa";
import { HeroStagger, HeroStaggerItem, Tilt3D } from "../tenantLandingMotion";
import { TL_BLUE, TL_ORANGE, tlBtnOutline, tlBtnPrimary } from "../tenantLandingTheme";

const EASE = [0.22, 1, 0.36, 1];

const PORTRAIT_BG = {
  hero: `linear-gradient(165deg, ${TL_BLUE} 0%, #2b6cb0 50%, #2563a8 100%)`,
  about: `linear-gradient(155deg, #FBD38D 0%, ${TL_ORANGE} 38%, #c05621 72%, #9c4221 100%)`,
};

function highlightTeacherName(text, teacherName) {
  if (!text || !teacherName?.trim()) return text;
  const name = teacherName.trim();
  const idx = text.indexOf(name);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: TL_BLUE }}>{name}</span>
      {text.slice(idx + name.length)}
    </>
  );
}

function PortraitFrame({ src, alt, variant, sizeVar }) {
  const isAbout = variant === "about";
  const ringColor = isAbout ? TL_BLUE : TL_ORANGE;
  const glowColor = isAbout ? TL_ORANGE : TL_BLUE;

  return (
    <div className="relative mx-auto aspect-square" style={{ width: sizeVar }} dir="ltr">
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          border: `4px solid ${glowColor}35`,
          boxShadow: `0 0 0 8px ${glowColor}12, 0 28px 56px ${glowColor}40`,
        }}
        aria-hidden
      />

      <motion.div
        className="absolute inset-[4px] overflow-hidden rounded-full"
        style={{
          background: PORTRAIT_BG[variant],
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <div
          className="pointer-events-none absolute left-[10%] top-[8%] h-[40%] w-[80%] rounded-full opacity-30 blur-lg"
          style={{ background: "radial-gradient(ellipse, #fff 0%, transparent 70%)" }}
          aria-hidden
        />

        <div
          className="pointer-events-none absolute left-1/2 z-[1] aspect-square rounded-full"
          style={{
            width: "76%",
            bottom: "14%",
            border: `3px solid ${ringColor}`,
            boxShadow: `inset 0 0 0 1px ${ringColor}55, 0 8px 24px ${ringColor}30`,
            transform: "translateX(-50%)",
          }}
          aria-hidden
        />

        {src ? (
          <div
            className="absolute inset-x-0 bottom-0 z-[2] flex justify-center overflow-hidden"
            style={{ height: "100%" }}
          >
            <motion.img
              src={src}
              alt={alt}
              loading="eager"
              fetchpriority="high"
              decoding="async"
              draggable={false}
              className="h-[112%] w-auto min-w-[108%] max-w-none object-cover object-bottom"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl opacity-40">👨‍🏫</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/** بورتريه مع أنيميشن 3D — hero أزرق / about برتقالي */
export function TeacherPortrait({ src, alt, variant = "hero", enable3D = true }) {
  const sizeVar = variant === "about" ? "min(380px, 90vw)" : "min(360px, 88vw)";
  const isAbout = variant === "about";

  const portrait = (
    <PortraitFrame src={src} alt={alt} variant={variant} sizeVar={sizeVar} />
  );

  if (!enable3D) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {portrait}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      {!isAbout && (
        <>
          <motion.div
            className="pointer-events-none absolute -left-6 top-10 h-20 w-20 rounded-full opacity-70 blur-md"
            style={{ background: `${TL_ORANGE}55` }}
            animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -right-4 bottom-16 h-14 w-14 rounded-full opacity-60 blur-sm"
            style={{ background: `${TL_BLUE}45` }}
            animate={{ y: [0, 10, 0], x: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            aria-hidden
          />
        </>
      )}

      {isAbout && (
        <>
          <motion.div
            className="pointer-events-none absolute -right-8 top-6 h-24 w-24 rounded-full opacity-50 blur-lg"
            style={{ background: `${TL_BLUE}35` }}
            animate={{ y: [0, -12, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -left-4 bottom-8 h-16 w-16 rounded-full opacity-55 blur-md"
            style={{ background: `${TL_ORANGE}40` }}
            animate={{ y: [0, 8, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            aria-hidden
          />
        </>
      )}

      <Tilt3D maxTilt={isAbout ? 10 : 14} floatPx={isAbout ? 6 : 9} floatDuration={isAbout ? 6 : 5}>
        {portrait}
      </Tilt3D>
    </motion.div>
  );
}

export default function TenantHeroSection({
  specialty,
  teacherName,
  heroTitle,
  bioText,
  about = {},
  signupHref,
  loginHref,
  heroStats = [],
  teacherImageUrl,
}) {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#f4f8fc] pt-[4.75rem] dark:bg-slate-950"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <motion.div
          className="absolute -left-32 top-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: TL_BLUE }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 bottom-12 h-56 w-56 rounded-full opacity-25 blur-3xl"
          style={{ background: TL_ORANGE }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 md:px-8 md:pb-20 md:pt-14">
        <div
          className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16"
          dir="ltr"
        >
          <div className="order-2 text-right lg:order-none" dir="rtl">
            <HeroStagger>
              {specialty ? (
                <HeroStaggerItem className="mb-3">
                  <span
                    className="inline-block rounded-full px-4 py-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: TL_ORANGE }}
                  >
                    {specialty}
                  </span>
                </HeroStaggerItem>
              ) : null}

              <HeroStaggerItem as="p" className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                منصة{" "}
                <span className="font-bold" style={{ color: TL_BLUE }}>
                  {teacherName}
                </span>
              </HeroStaggerItem>

              <HeroStaggerItem as="h1">
                <h1 className="font-heading text-[1.75rem] font-bold leading-snug text-slate-900 dark:text-white sm:text-3xl lg:text-[2.35rem] lg:leading-tight">
                  {highlightTeacherName(heroTitle, teacherName)}
                </h1>
              </HeroStaggerItem>

              <HeroStaggerItem as="p" className="mb-8 mt-5 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
                {bioText}
              </HeroStaggerItem>

              {(about.experience || about.qualifications) && (
                <HeroStaggerItem className="mb-6 flex flex-wrap justify-end gap-2">
                  {about.experience ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <FaAward style={{ color: TL_ORANGE }} />
                      {about.experience}
                    </span>
                  ) : null}
                  {about.qualifications ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <FaGraduationCap style={{ color: TL_BLUE }} />
                      {about.qualifications}
                    </span>
                  ) : null}
                </HeroStaggerItem>
              )}

              <HeroStaggerItem className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <a href={signupHref} className={`${tlBtnPrimary} gap-2`}>
                  ابدأ التعلّم الآن
                  <FaArrowLeft className="text-[10px]" />
                </a>
                <a href={loginHref} className={tlBtnOutline}>
                  تسجيل الدخول
                </a>
              </HeroStaggerItem>

              {heroStats.length > 0 && (
                <HeroStaggerItem className="mt-10">
                  <div className="grid grid-cols-3 gap-3" style={{ perspective: 900 }}>
                  {heroStats.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        className="rounded-2xl border border-slate-100 bg-white px-3 py-4 text-center shadow-[0_6px_20px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900"
                        style={{ transformStyle: "preserve-3d" }}
                        whileHover={{
                          y: -6,
                          rotateX: 6,
                          rotateY: i === 0 ? -4 : i === 2 ? 4 : 0,
                          boxShadow: "0 16px 32px rgba(49, 130, 206, 0.15)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 22 }}
                      >
                        <Icon
                          className="mx-auto mb-2 text-lg"
                          style={{ color: i === 1 ? TL_ORANGE : TL_BLUE }}
                        />
                        <p className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                          {item.value}
                        </p>
                        <p className="mt-0.5 text-[0.65rem] text-slate-500 sm:text-xs">{item.label}</p>
                      </motion.div>
                    );
                  })}
                  </div>
                </HeroStaggerItem>
              )}
            </HeroStagger>
          </div>

          <div className="order-1 flex justify-center lg:order-none">
            <TeacherPortrait src={teacherImageUrl} alt={teacherName} variant="hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
