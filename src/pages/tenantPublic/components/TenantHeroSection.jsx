import { motion } from "framer-motion";
import { FaArrowLeft, FaAward, FaGraduationCap } from "react-icons/fa";
import {
  HeroStagger,
  HeroStaggerItem,
  HeroGlowOrb,
  FloatingShape,
  AnimatedUnderline,
} from "../tenantLandingMotion";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";
const BLUE_SOFT = "rgba(49, 130, 206, 0.12)";
const BLUE_MID = "rgba(49, 130, 206, 0.22)";
const EASE = [0.22, 1, 0.36, 1];

function TeacherPortrait({ src, alt }) {
  if (!src) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <span className="text-6xl opacity-20">👨‍🏫</span>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-[360px] items-end justify-center px-2 sm:max-w-[380px]" dir="ltr">
      {/* توهج ناعم خلف الشخص — بدون إطار */}
      <div
        className="pointer-events-none absolute bottom-6 left-1/2 h-28 w-[72%] -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: `${BLUE}30` }}
      />

      {/* شريحة لونية خلفية مائلة */}
      <div
        className="pointer-events-none absolute bottom-10 left-1/2 z-0 h-[62%] w-[78%] -translate-x-1/2 -rotate-2 rounded-3xl"
        style={{
          background: `linear-gradient(145deg, ${BLUE}18 0%, ${BLUE}08 100%)`,
        }}
      />

      {/* خط برتقالي زخرفي */}
      <div
        className="pointer-events-none absolute bottom-[32%] right-[6%] z-0 hidden h-14 w-1 rounded-full sm:block"
        style={{ backgroundColor: ORANGE }}
      />

      {/* الصورة — العنصر الأساسي */}
      <motion.img
        src={src}
        alt={alt}
        loading="eager"
        fetchpriority="high"
        decoding="async"
        draggable={false}
        className="relative z-10 w-auto max-w-full object-contain object-bottom"
        style={{
          height: "clamp(380px, 52vh, 500px)",
          filter: `drop-shadow(0 22px 34px ${BLUE}40)`,
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: [0, -7, 0] }}
        transition={{
          opacity: { duration: 0.65, ease: EASE, delay: 0.2 },
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
        }}
      />

      {/* قاعدة بسيطة تحت الصورة */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-[5] flex w-[64%] -translate-x-1/2 flex-col items-center gap-1.5">
        <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: BLUE }} />
        <div
          className="h-2.5 w-full rounded-[100%]"
          style={{
            background: `radial-gradient(ellipse at center, ${BLUE}50 0%, transparent 72%)`,
          }}
        />
      </div>
    </div>
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
      className="relative overflow-hidden bg-gradient-to-b from-blue-50/90 via-white to-white pt-[4.75rem] dark:from-slate-950 dark:via-slate-900 dark:to-slate-900"
      dir="rtl"
    >
      <HeroGlowOrb
        className="pointer-events-none absolute -left-20 top-32 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: BLUE_MID }}
        delay={0}
      />
      <HeroGlowOrb
        className="pointer-events-none absolute -right-16 top-48 h-56 w-56 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(49, 130, 206, 0.14)" }}
        delay={2}
      />
      <FloatingShape
        className="pointer-events-none absolute left-[8%] top-[30%] h-3 w-3 rounded-full"
        style={{ backgroundColor: `${BLUE}88` }}
        duration={5}
      />
      <FloatingShape
        className="pointer-events-none absolute right-[12%] top-[22%] h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: `${BLUE}99` }}
        delay={1.2}
        duration={6.5}
      />
      <FloatingShape
        className="pointer-events-none absolute left-[18%] top-[18%] h-1.5 w-8 rounded-full"
        style={{ backgroundColor: `${BLUE}55` }}
        delay={0.6}
        duration={8}
      />

      <div
        className="absolute inset-x-0 top-[4.75rem] z-10 h-1.5"
        style={{ background: `linear-gradient(to left, ${BLUE}, ${BLUE}cc 45%, ${ORANGE})` }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-14 pt-8 md:px-8 lg:pb-16 lg:pt-12">
        <div
          className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-20 xl:gap-24"
          dir="ltr"
        >
          <div className="relative z-20 order-2 text-right md:order-none md:pe-2 lg:pe-4" dir="rtl">
            <HeroStagger>
              {specialty ? (
                <HeroStaggerItem className="mb-4">
                  <motion.span
                    className="inline-block rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm ring-2 ring-[#3182CE] ring-offset-1"
                    style={{
                      backgroundColor: ORANGE,
                      boxShadow: `0 4px 14px ${BLUE}33`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    {specialty}
                  </motion.span>
                </HeroStaggerItem>
              ) : null}

              <HeroStaggerItem
                as="p"
                className="mb-2 inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: BLUE }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: BLUE }}
                />
                منصة {teacherName}
              </HeroStaggerItem>

              <HeroStaggerItem
                as="h1"
                className="font-heading text-[1.65rem] font-black leading-[1.3] sm:text-3xl md:whitespace-nowrap md:text-[2rem] lg:text-[2.35rem] lg:leading-[1.22] xl:text-[2.5rem]"
                style={{ color: BLUE }}
              >
                {heroTitle}
              </HeroStaggerItem>

              <HeroStaggerItem className="my-5 flex items-center justify-end gap-2">
                <AnimatedUnderline className="w-10" color={BLUE} />
                <div className="h-1 w-4 rounded-full" style={{ backgroundColor: ORANGE }} />
              </HeroStaggerItem>

              <HeroStaggerItem as="p" className="mb-8 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-9">
                {bioText}
              </HeroStaggerItem>

              {(about.experience || about.qualifications) && (
                <HeroStaggerItem className="mb-8 flex flex-wrap justify-end gap-2">
                  {about.experience ? (
                    <motion.span
                      className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium shadow-sm dark:bg-slate-900 dark:text-slate-200"
                      style={{ borderColor: `${BLUE}55`, color: BLUE }}
                      whileHover={{ y: -3, boxShadow: `0 8px 20px ${BLUE}22` }}
                    >
                      <FaAward style={{ color: BLUE }} />
                      {about.experience}
                    </motion.span>
                  ) : null}
                  {about.qualifications ? (
                    <motion.span
                      className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium shadow-sm dark:bg-slate-900 dark:text-slate-200"
                      style={{ borderColor: `${BLUE}40`, color: "#334155" }}
                      whileHover={{ y: -3, boxShadow: `0 8px 20px ${BLUE}18` }}
                    >
                      <FaGraduationCap style={{ color: BLUE }} />
                      {about.qualifications}
                    </motion.span>
                  ) : null}
                </HeroStaggerItem>
              )}

              <HeroStaggerItem className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <motion.a
                  href={signupHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-sm font-bold text-white shadow-md"
                  style={{ backgroundColor: ORANGE }}
                  whileHover={{ scale: 1.04, boxShadow: "0 12px 28px rgba(221,107,32,0.35)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                >
                  ابدأ التعلّم الآن
                  <motion.span
                    animate={{ x: [0, -4, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <FaArrowLeft className="text-[10px]" />
                  </motion.span>
                </motion.a>
                <motion.a
                  href={loginHref}
                  className="inline-flex h-12 items-center justify-center rounded-xl border-2 px-8 text-sm font-bold text-white dark:bg-slate-900"
                  style={{ borderColor: BLUE, backgroundColor: BLUE }}
                  whileHover={{ scale: 1.03, backgroundColor: "#2b6cb0", boxShadow: `0 10px 24px ${BLUE}40` }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                >
                  تسجيل الدخول
                </motion.a>
              </HeroStaggerItem>

              {heroStats.length > 0 && (
                <HeroStaggerItem className="mt-10">
                  <motion.div
                    className="grid grid-cols-3 gap-3 rounded-2xl border-2 p-4 shadow-sm dark:bg-slate-900"
                    style={{
                      borderColor: `${BLUE}44`,
                      background: `linear-gradient(135deg, ${BLUE_SOFT} 0%, #ffffff 55%, ${BLUE_SOFT} 100%)`,
                      boxShadow: `0 8px 28px ${BLUE}14`,
                    }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.25 }}
                  >
                    {heroStats.map((item, i) => {
                      const Icon = item.icon;
                      const iconColor = i === 1 ? ORANGE : BLUE;
                      return (
                        <motion.div
                          key={item.label}
                          className={`text-center ${i > 0 ? "border-r" : ""}`}
                          style={{ borderColor: `${BLUE}22` }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 + i * 0.1, duration: 0.45, ease: EASE }}
                        >
                          <Icon
                            className="mx-auto mb-1.5 text-base"
                            style={{ color: iconColor }}
                          />
                          <p
                            className="font-heading text-lg font-black sm:text-xl"
                            style={{ color: i === 1 ? ORANGE : BLUE }}
                          >
                            {item.value}
                          </p>
                          <p className="text-[0.65rem] sm:text-xs" style={{ color: `${BLUE}cc` }}>
                            {item.label}
                          </p>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </HeroStaggerItem>
              )}
            </HeroStagger>
          </div>

          <div className="relative z-10 order-1 flex w-full items-center justify-center md:order-none" dir="ltr">
            <TeacherPortrait src={teacherImageUrl} alt={teacherName} />
          </div>
        </div>
      </div>
    </section>
  );
}
