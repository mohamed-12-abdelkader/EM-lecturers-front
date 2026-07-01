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
const EASE = [0.22, 1, 0.36, 1];

function TeacherPortrait({ src, alt }) {
  if (!src) {
    return (
      <div className="flex aspect-[4/5] max-h-[520px] min-h-[360px] w-full items-center justify-center">
        <span className="text-6xl opacity-20">👨‍🏫</span>
      </div>
    );
  }

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[420px] md:max-w-[480px]"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative aspect-[4/5] min-h-[340px] w-full sm:min-h-[400px] lg:min-h-[460px]">
        <motion.div
          className="absolute inset-x-2 bottom-0 top-[6%] rounded-t-[2rem] rounded-b-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
          style={{
            background: `linear-gradient(165deg, ${BLUE}18 0%, ${BLUE}06 40%, #ffffff 100%)`,
          }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
        />
        <FloatingShape
          className="absolute right-4 top-[9%] h-16 w-1 rounded-full"
          style={{ backgroundColor: ORANGE }}
          delay={0.3}
        />
        <FloatingShape
          className="absolute left-5 top-[12%] h-9 w-9 rounded-full border-2 opacity-35"
          style={{ borderColor: BLUE }}
          delay={0.8}
          duration={7}
        />
        <div
          className="absolute inset-x-[14%] bottom-4 h-4 rounded-[100%]"
          style={{
            background: `radial-gradient(ellipse at center, ${BLUE}30 0%, transparent 70%)`,
          }}
        />
        <motion.img
          src={src}
          alt={alt}
          loading="eager"
          fetchpriority="high"
          decoding="async"
          draggable={false}
          className="absolute bottom-0 left-1/2 z-10 h-[90%] w-auto max-w-[92%] -translate-x-1/2 object-contain object-bottom"
          style={{ filter: "drop-shadow(0 16px 24px rgba(15, 23, 42, 0.15))" }}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: EASE, delay: 0.35 }}
        />
      </div>
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
      className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-[4.75rem] dark:from-slate-950 dark:to-slate-900"
      dir="rtl"
    >
      <HeroGlowOrb
        className="pointer-events-none absolute -left-20 top-32 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/15"
        delay={0}
      />
      <HeroGlowOrb
        className="pointer-events-none absolute -right-16 top-48 h-56 w-56 rounded-full bg-orange-400/20 blur-3xl dark:bg-orange-600/15"
        delay={2}
      />
      <FloatingShape
        className="pointer-events-none absolute left-[8%] top-[30%] h-3 w-3 rounded-full bg-orange-400/50"
        duration={5}
      />
      <FloatingShape
        className="pointer-events-none absolute right-[12%] top-[22%] h-2 w-2 rounded-full bg-blue-400/50"
        delay={1.2}
        duration={6.5}
      />

      <div
        className="absolute inset-x-0 top-[4.75rem] z-10 h-1"
        style={{ background: `linear-gradient(to left, ${ORANGE}, ${BLUE})` }}
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
                    className="inline-block rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: ORANGE }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    {specialty}
                  </motion.span>
                </HeroStaggerItem>
              ) : null}

              <HeroStaggerItem as="p" className="mb-2 text-sm font-bold" style={{ color: BLUE }}>
                منصة {teacherName}
              </HeroStaggerItem>

              <HeroStaggerItem
                as="h1"
                className="font-heading text-[1.65rem] font-black leading-[1.3] text-slate-900 dark:text-white sm:text-3xl md:whitespace-nowrap md:text-[2rem] lg:text-[2.35rem] lg:leading-[1.22] xl:text-[2.5rem]"
              >
                {heroTitle}
              </HeroStaggerItem>

              <HeroStaggerItem className="my-5 flex justify-end">
                <AnimatedUnderline className="w-14" color={ORANGE} />
              </HeroStaggerItem>

              <HeroStaggerItem as="p" className="mb-8 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-9">
                {bioText}
              </HeroStaggerItem>

              {(about.experience || about.qualifications) && (
                <HeroStaggerItem className="mb-8 flex flex-wrap justify-end gap-2">
                  {about.experience ? (
                    <motion.span
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(49,130,206,0.12)" }}
                    >
                      <FaAward style={{ color: ORANGE }} />
                      {about.experience}
                    </motion.span>
                  ) : null}
                  {about.qualifications ? (
                    <motion.span
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(221,107,32,0.12)" }}
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
                  className="inline-flex h-12 items-center justify-center rounded-xl border-2 bg-white px-8 text-sm font-bold dark:bg-slate-900"
                  style={{ borderColor: BLUE, color: BLUE }}
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(49,130,206,0.06)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                >
                  تسجيل الدخول
                </motion.a>
              </HeroStaggerItem>

              {heroStats.length > 0 && (
                <HeroStaggerItem className="mt-10">
                  <motion.div
                    className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.25 }}
                  >
                    {heroStats.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          className={`text-center ${i > 0 ? "border-r border-slate-100 dark:border-slate-800" : ""}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 + i * 0.1, duration: 0.45, ease: EASE }}
                        >
                          <Icon
                            className="mx-auto mb-1.5 text-base"
                            style={{ color: i % 2 === 0 ? BLUE : ORANGE }}
                          />
                          <p className="font-heading text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                            {item.value}
                          </p>
                          <p className="text-[0.65rem] text-slate-500 sm:text-xs">{item.label}</p>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </HeroStaggerItem>
              )}
            </HeroStagger>
          </div>

          <div className="relative z-10 order-1 flex justify-center md:order-none md:justify-end md:ps-2 lg:ps-4" dir="rtl">
            <TeacherPortrait src={teacherImageUrl} alt={teacherName} />
          </div>
        </div>
      </div>
    </section>
  );
}
