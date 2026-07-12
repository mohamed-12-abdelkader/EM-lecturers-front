import { motion, useReducedMotion } from "framer-motion";
import { FaArrowLeft, FaGraduationCap, FaPlay } from "react-icons/fa";
import {
  HeroGlowOrb,
  HeroStagger,
  HeroStaggerItem,
  Tilt3D,
} from "../../tenantLandingMotion";
import {
  TL_BLUE,
  TL_ORANGE,
  tlBtnOutlineDark,
  tlBtnPrimary,
  tlContainer,
  tlEyebrow,
} from "../../tenantLandingTheme";

const EASE = [0.22, 1, 0.36, 1];

function highlightTitle(title, teacherName) {
  if (!teacherName?.trim() || !title) return title;
  const name = teacherName.trim();
  const idx = title.indexOf(name);
  if (idx === -1) return title;
  return (
    <>
      {title.slice(0, idx)}
      <span className="text-blue-500">{name}</span>
      {title.slice(idx + name.length)}
    </>
  );
}

function PortraitCircle({ src, alt }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[380px]">
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow:
            "0 0 0 10px rgba(49,130,206,0.08), 0 28px 56px -14px rgba(49,130,206,0.35)",
        }}
        aria-hidden
      />

      <div
        className="absolute inset-[6px] overflow-hidden rounded-full"
        style={{
          background: `linear-gradient(160deg, #4299E1 0%, ${TL_BLUE} 45%, #2B6CB0 100%)`,
          transform: "translateZ(24px)",
        }}
      >
        <div
          className="pointer-events-none absolute left-[12%] top-[6%] h-[36%] w-[76%] rounded-full opacity-35 blur-xl"
          style={{
            background: "radial-gradient(ellipse, #fff 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <div
          className="pointer-events-none absolute left-1/2 z-[1] aspect-square w-[78%] -translate-x-1/2 rounded-full border-[3px]"
          style={{ bottom: "12%", borderColor: `${TL_ORANGE}CC` }}
          aria-hidden
        />

        {src ? (
          <div className="absolute inset-0 z-[2] flex items-end justify-center">
            <img
              src={src}
              alt={alt}
              className="h-[96%] w-auto max-w-[92%] object-contain object-bottom drop-shadow-[0_14px_28px_rgba(0,0,0,0.22)]"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FaGraduationCap className="text-6xl text-white/40" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}

function HeroPortrait({ src, alt, teacherName, specialty }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[420px]" dir="ltr">
      {!reduceMotion && (
        <>
          <motion.div
            className="pointer-events-none absolute -left-5 top-12 h-16 w-16 rounded-full opacity-70 blur-md"
            style={{ background: `${TL_ORANGE}55` }}
            animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -right-3 bottom-20 h-12 w-12 rounded-full opacity-60 blur-sm"
            style={{ background: `${TL_BLUE}50` }}
            animate={{ y: [0, 10, 0], x: [0, -5, 0] }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6,
            }}
            aria-hidden
          />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24, rotateY: -8 }}
        animate={{ opacity: 1, y: 0, rotateY: 0 }}
        transition={{ duration: 0.75, ease: EASE }}
        style={{ perspective: 1200 }}
      >
        <Tilt3D maxTilt={14} floatPx={9} floatDuration={5}>
          <div style={{ transformStyle: "preserve-3d" }}>
            <PortraitCircle src={src} alt={alt} />
          </div>
        </Tilt3D>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
        className="mt-6 text-center"
        dir="rtl"
      >
        <p className="font-heading text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
          {teacherName}
        </p>
        {specialty ? (
          <p className="mt-1 text-sm font-medium text-orange-500">{specialty}</p>
        ) : null}
      </motion.div>
    </div>
  );
}

export default function TenantProHero({
  specialty,
  teacherName,
  heroTitle,
  bioText,
  signupHref,
  loginHref,
  heroStats = [],
  teacherImageUrl,
}) {
  return (
    <section
      id="home"
      className="relative overflow-hidden border-b border-slate-200/80 pt-[4.75rem] dark:border-slate-800"
      dir="rtl"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#E8F2FF_0%,#F8FBFF_38%,#FFFFFF_72%)] dark:bg-[linear-gradient(165deg,#0B1220_0%,#0f172a_50%,#020617_100%)]"
        aria-hidden
      />

      <HeroGlowOrb
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/15"
        delay={0}
      />
      <HeroGlowOrb
        className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-orange-400/15 blur-3xl dark:bg-orange-500/10"
        delay={1.2}
      />

      <div className={`${tlContainer} relative py-12 md:py-16 lg:py-20`}>
        <div
          className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
          dir="ltr"
        >
          <div className="order-2 text-right lg:order-none" dir="rtl">
            <HeroStagger>
              {specialty ? (
                <HeroStaggerItem className="mb-4">
                  <span className={tlEyebrow}>{specialty}</span>
                </HeroStaggerItem>
              ) : null}

              <HeroStaggerItem as="h1">
                <h1 className="font-heading text-[1.85rem] font-bold leading-[1.35] tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.28]">
                  {highlightTitle(heroTitle, teacherName)}
                </h1>
              </HeroStaggerItem>

              <HeroStaggerItem
                as="p"
                className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300"
              >
                {bioText}
              </HeroStaggerItem>

              <HeroStaggerItem className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                <motion.a
                  href={signupHref}
                  className={`${tlBtnPrimary} !px-8 !py-3.5`}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ابدأ التعلّم الآن
                  <FaArrowLeft className="text-[10px]" />
                </motion.a>
                <motion.a
                  href={loginHref}
                  className={tlBtnOutlineDark}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  تسجيل الدخول
                </motion.a>
                <a
                  href="#videos"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3.5 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-500 dark:text-slate-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <FaPlay className="mr-[-1px] text-[10px] text-blue-500" />
                  </span>
                  محاضرة مجانية
                </a>
              </HeroStaggerItem>

              {heroStats.length > 0 ? (
                <HeroStaggerItem className="mt-10">
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {heroStats.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          whileHover={{ y: -4, rotateX: 6 }}
                          transition={{ type: "spring", stiffness: 320, damping: 20 }}
                          className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 text-right shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70 sm:p-4"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <div className="mb-1.5 flex items-center justify-end gap-2">
                            <Icon
                              className={`text-sm ${i % 2 === 0 ? "text-blue-500" : "text-orange-500"}`}
                            />
                            <p className="font-heading text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                              {item.value}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-500 sm:text-xs">{item.label}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </HeroStaggerItem>
              ) : null}
            </HeroStagger>
          </div>

          <div className="order-1 flex justify-center lg:order-none lg:justify-end">
            <HeroPortrait
              src={teacherImageUrl}
              alt={teacherName}
              teacherName={teacherName}
              specialty={specialty}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
