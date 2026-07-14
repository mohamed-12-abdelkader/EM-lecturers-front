import { FaBookOpen, FaClipboardCheck, FaHeadset, FaRocket } from "react-icons/fa";
import { useReducedMotion } from "framer-motion";
import {
  DrawLine,
  PulseRing,
  Reveal,
  ShimmerCTA,
  StaggerGrid,
  StaggerItem,
  motion,
} from "../../tenantLandingMotion";
import {
  tlContainer,
  tlEyebrow,
  tlHeading,
  tlSectionMuted,
} from "../../tenantLandingTheme";

const STEPS = [
  {
    icon: FaBookOpen,
    title: "اختر مسارك",
    description: "سجّل حسابك واختر الصف والمادة المناسبة لك لتبدأ من المكان الصحيح.",
  },
  {
    icon: FaClipboardCheck,
    title: "تعلّم وطبق",
    description: "تابع الشرح المنظم، حل التدريبات، وقيّم مستواك باختبارات قصيرة مستمرة.",
  },
  {
    icon: FaHeadset,
    title: "احصل على متابعة",
    description: "اسأل، راجع نقاط ضعفك، وابقَ على تواصل حتى تثبت المعلومة وتصل لهدفك.",
  },
];

function StepCard({ step, index }) {
  const reduceMotion = useReducedMotion();
  const Icon = step.icon;
  const isOrange = index % 2 === 1;

  return (
    <StaggerItem variant="blur" className="relative text-center">
      <motion.div
        className="group relative mx-auto"
        whileHover={reduceMotion ? undefined : { y: -8 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <div className="relative z-[1] mx-auto mb-5 flex h-[4.25rem] w-[4.25rem] items-center justify-center">
          <PulseRing
            delay={index * 0.35}
            colorClass={isOrange ? "bg-orange-400/35" : "bg-blue-400/35"}
          />
          <motion.span
            className={`absolute inset-0 rounded-full ${
              isOrange ? "bg-orange-100 dark:bg-orange-950/50" : "bg-blue-100 dark:bg-blue-950/50"
            }`}
            aria-hidden
            animate={
              reduceMotion
                ? undefined
                : { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }
            }
            transition={{ duration: 3.2, repeat: Infinity, delay: index * 0.4, ease: "easeInOut" }}
          />
          <motion.span
            className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md ${
              isOrange ? "bg-orange-500 shadow-orange-500/25" : "bg-blue-500 shadow-blue-500/25"
            }`}
            whileHover={reduceMotion ? undefined : { rotate: [0, -8, 8, 0], scale: 1.08 }}
            transition={{ duration: 0.55 }}
          >
            <Icon className="text-lg" aria-hidden />
          </motion.span>
          <motion.span
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-bold text-white dark:border-slate-950"
            initial={reduceMotion ? false : { scale: 0, rotate: -20 }}
            whileInView={reduceMotion ? undefined : { scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.25 + index * 0.12 }}
          >
            {index + 1}
          </motion.span>
        </div>

        <h3 className="font-heading text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {step.title}
        </h3>
        <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-7 text-slate-600 dark:text-slate-400">
          {step.description}
        </p>
      </motion.div>
    </StaggerItem>
  );
}

export default function TenantProHowItWorks({ teacherName, specialty, signupHref }) {
  const reduceMotion = useReducedMotion();
  const subtitle = specialty
    ? `ثلاث خطوات واضحة توصلك لنتيجة أفضل في ${specialty} مع ${teacherName}.`
    : `ثلاث خطوات واضحة توصلك لنتيجة أفضل مع ${teacherName}.`;

  return (
    <section id="how-it-works" className={`scroll-mt-20 py-16 md:py-20 ${tlSectionMuted}`} dir="rtl">
      <div className={tlContainer}>
        <Reveal variant="blurUp" className="mx-auto max-w-2xl text-center">
          <span className={tlEyebrow}>كيف تبدأ؟</span>
          <h2 className={`${tlHeading} mt-3`}>رحلة التعلّم خطوة بخطوة</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            {subtitle}
          </p>
        </Reveal>

        <div className="relative mt-12">
          <DrawLine
            delay={0.15}
            className="pointer-events-none absolute left-[12%] right-[12%] top-[2.15rem] hidden h-[2px] bg-gradient-to-l from-blue-300 via-orange-300 to-blue-300 dark:from-blue-800 dark:via-orange-800/60 dark:to-blue-800 md:block"
          />

          <StaggerGrid className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, index) => (
              <StepCard key={step.title} step={step} index={index} />
            ))}
          </StaggerGrid>
        </div>

        <Reveal variant="springPop" delay={0.2} className="mt-12 flex justify-center">
          <ShimmerCTA>
            <motion.a
              href={signupHref}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-colors hover:bg-blue-600"
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            >
              <motion.span
                animate={reduceMotion ? undefined : { y: [0, -3, 0], rotate: [0, -12, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <FaRocket className="text-xs opacity-95" aria-hidden />
              </motion.span>
              ابدأ رحلتك الآن
            </motion.a>
          </ShimmerCTA>
        </Reveal>
      </div>
    </section>
  );
}
