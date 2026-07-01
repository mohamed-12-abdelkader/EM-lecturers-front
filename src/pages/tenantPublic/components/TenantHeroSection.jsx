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
      <div className="flex min-h-[320px] w-full items-center justify-center">
        <span className="text-6xl opacity-20">👨‍🏫</span>
      </div>
    );
  }

  return (
    <motion.div
      className="relative mx-auto w-fit max-w-full"
      dir="ltr"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {/* هالة خلف البطاقة */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-70 blur-2xl"
        style={{ background: `linear-gradient(145deg, ${BLUE}30, ${ORANGE}18)` }}
        aria-hidden
      />

      <motion.div
        className="relative overflow-hidden rounded-2xl border-[3px] bg-white shadow-[0_22px_44px_rgba(49,130,206,0.22)] dark:bg-slate-900"
        style={{ borderColor: BLUE }}
        animate={{ y: [0, -5, 0] }}
        transition={{ y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }}
      >
        {/* شريط علوي — بطاقة عرض */}
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-2.5 dark:border-slate-700"
          style={{
            borderColor: `${BLUE}25`,
            background: `linear-gradient(90deg, ${BLUE}16 0%, transparent 100%)`,
          }}
        >
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ORANGE }} />
            <span className="h-2 w-2 rounded-full opacity-50" style={{ backgroundColor: BLUE }} />
            <span className="h-2 w-2 rounded-full opacity-30" style={{ backgroundColor: BLUE }} />
          </div>
          <div className="h-1 w-14 rounded-full" style={{ backgroundColor: BLUE }} aria-hidden />
        </div>

        {/* الصورة داخل البطاقة — العرض يتبع الصورة */}
        <div className="flex items-end justify-center bg-gradient-to-b from-blue-100/50 to-white px-3 pb-0 pt-2 sm:px-4 dark:from-blue-950/45 dark:to-slate-900">
          <motion.img
            src={src}
            alt={alt}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            draggable={false}
            className="block h-auto max-h-[min(420px,48vh)] w-auto max-w-[248px] object-contain object-bottom sm:max-w-[268px] md:max-w-[288px]"
            style={{ filter: "drop-shadow(0 10px 18px rgba(15, 23, 42, 0.12))" }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.15 }}
          />
        </div>

        {/* شريط علامة تجارية */}
        <div className="flex h-2" aria-hidden>
          <div className="flex-[3]" style={{ backgroundColor: BLUE }} />
          <div className="flex-1" style={{ backgroundColor: ORANGE }} />
        </div>
      </motion.div>

      {/* ظل أرضي */}
      <div
        className="mx-auto mt-3 h-3 w-[90%] rounded-[100%]"
        style={{ background: `radial-gradient(ellipse at center, ${BLUE}45 0%, transparent 72%)` }}
        aria-hidden
      />
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
