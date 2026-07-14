import { motion, useReducedMotion } from "framer-motion";
import { FaArrowLeft, FaGraduationCap, FaPlay, FaWhatsapp } from "react-icons/fa";
import {
  CountUp,
  HeroGlowOrb,
  HeroStagger,
  HeroStaggerItem,
  PulseRing,
  ShimmerCTA,
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
      <motion.span
        className="inline-block text-blue-500"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.55, ease: EASE }}
      >
        {name}
      </motion.span>
      {title.slice(idx + name.length)}
    </>
  );
}

function HeroPortrait({ src, alt, teacherName, specialty }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[360px] sm:max-w-[400px]" dir="ltr">
      <motion.div
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-70 blur-2xl"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${TL_BLUE}22 0%, transparent 65%)`,
        }}
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.45, 0.75, 0.45], scale: [1, 1.04, 1] }
        }
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-x-3 bottom-0 top-6 rounded-[1.75rem]"
        style={{
          background: `linear-gradient(145deg, ${TL_ORANGE}18 0%, ${TL_BLUE}12 100%)`,
          transform: "translate(10px, 12px)",
        }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 36, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.85, ease: EASE }}
        className="relative"
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
          whileHover={reduceMotion ? undefined : { scale: 1.015 }}
          transition={
            reduceMotion
              ? { duration: 0.35 }
              : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
          }
          className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-slate-100 shadow-[0_24px_48px_-18px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            {src ? (
              <motion.img
                src={src}
                alt={alt}
                className="h-full w-full object-cover object-top"
                loading="eager"
                fetchpriority="high"
                decoding="async"
                draggable={false}
                initial={{ scale: 1.12 }}
                animate={{ scale: reduceMotion ? 1 : [1.08, 1, 1.03] }}
                transition={
                  reduceMotion
                    ? { duration: 0.8, ease: EASE }
                    : { duration: 14, repeat: Infinity, ease: "easeInOut" }
                }
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{
                  background: `linear-gradient(160deg, #60A5FA 0%, ${TL_BLUE} 55%, #1E40AF 100%)`,
                }}
              >
                <FaGraduationCap className="text-7xl text-white/35" aria-hidden />
              </div>
            )}

            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent"
              aria-hidden
            />

            <div
              className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/25"
              aria-hidden
            />

            {/* Soft light sweep */}
            {!reduceMotion ? (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
                  backgroundSize: "220% 100%",
                }}
                animate={{ backgroundPosition: ["120% 0", "-40% 0"] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
              />
            ) : null}

            <motion.div
              className="absolute inset-x-0 bottom-0 p-5 text-right sm:p-6"
              dir="rtl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.55, ease: EASE }}
            >
              <p className="font-heading text-lg font-bold tracking-tight text-white sm:text-xl">
                {teacherName}
              </p>
              {specialty ? (
                <p className="mt-1 text-sm font-medium text-orange-300">{specialty}</p>
              ) : null}
            </motion.div>
          </div>
        </motion.div>
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
  whatsappHref,
  showFreeVideos = true,
  heroStats = [],
  teacherImageUrl,
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="home"
      className="relative overflow-hidden border-b border-slate-200/80 pt-[4.75rem] dark:border-slate-800"
      dir="rtl"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#F1F7FF_0%,#F8FBFF_42%,#FFFFFF_78%)] dark:bg-[linear-gradient(165deg,#0B1220_0%,#0f172a_50%,#020617_100%)]"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#3182CE22_1px,transparent_1px)] [background-size:22px_22px] dark:opacity-20"
        aria-hidden
        animate={reduceMotion ? undefined : { backgroundPosition: ["0px 0px", "22px 22px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <HeroGlowOrb
        className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/10"
        delay={0}
      />
      <HeroGlowOrb
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl dark:bg-orange-500/8"
        delay={1.2}
      />

      <div className={`${tlContainer} relative py-12 md:py-16 lg:py-20`}>
        <div
          className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 xl:gap-20"
          dir="ltr"
        >
          <div className="order-2 text-right lg:order-none" dir="rtl">
            <HeroStagger>
              {specialty ? (
                <HeroStaggerItem className="mb-4">
                  <motion.span
                    className={tlEyebrow}
                    whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                  >
                    {specialty}
                  </motion.span>
                </HeroStaggerItem>
              ) : null}

              <HeroStaggerItem as="h1">
                <h1 className="font-heading text-[1.9rem] font-bold leading-[1.32] tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.25]">
                  {highlightTitle(heroTitle, teacherName)}
                </h1>
              </HeroStaggerItem>

              <HeroStaggerItem
                as="p"
                className="mt-5 max-w-xl text-[0.98rem] leading-8 text-slate-600 dark:text-slate-300 sm:text-base"
              >
                {bioText}
              </HeroStaggerItem>

              <HeroStaggerItem className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <ShimmerCTA>
                  <motion.a
                    href={signupHref}
                    className={`${tlBtnPrimary} !px-8 !py-3.5`}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ابدأ التعلّم الآن
                    <FaArrowLeft className="text-[10px]" />
                  </motion.a>
                </ShimmerCTA>
                {whatsappHref ? (
                  <motion.a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-3.5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaWhatsapp className="text-base text-[#25D366]" />
                    تواصل واتساب
                  </motion.a>
                ) : null}
                <motion.a
                  href={loginHref}
                  className={tlBtnOutlineDark}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  تسجيل الدخول
                </motion.a>
              </HeroStaggerItem>

              {showFreeVideos ? (
                <HeroStaggerItem className="mt-4 flex justify-end">
                  <motion.a
                    href="#videos"
                    className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-500 dark:text-slate-400"
                    whileHover={{ x: -4 }}
                  >
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <PulseRing delay={0.2} colorClass="bg-blue-400/30" />
                      <FaPlay className="mr-[-1px] text-[10px] text-blue-500" />
                    </span>
                    شاهد محاضرة مجانية
                  </motion.a>
                </HeroStaggerItem>
              ) : null}

              {heroStats.length > 0 ? (
                <HeroStaggerItem className="mt-10">
                  <motion.div
                    className="flex flex-wrap items-stretch justify-end gap-0 divide-x-0 rounded-2xl border border-slate-200/90 bg-white/70 p-1 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/60 sm:divide-x sm:divide-x-reverse sm:divide-slate-200 dark:sm:divide-slate-700"
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.55, ease: EASE }}
                  >
                    {heroStats.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          className="flex min-w-[6.5rem] flex-1 flex-col items-end gap-1 px-4 py-3 sm:px-5"
                          whileHover={reduceMotion ? undefined : { y: -3 }}
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`text-xs ${i % 2 === 0 ? "text-blue-500" : "text-orange-500"}`}
                            />
                            <p className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                              <CountUp value={item.value} />
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-500 sm:text-xs">{item.label}</p>
                        </motion.div>
                      );
                    })}
                  </motion.div>
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
