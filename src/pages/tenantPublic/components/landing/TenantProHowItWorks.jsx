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
  TL_CYAN,
  TL_LIME,
  TL_NAVY_SOFT,
  tlBtnPrimary,
  tlContainer,
  tlEyebrow,
  tlHeading,
} from "../../tenantLandingTheme";
import TenantAppLink from "../TenantAppLink";
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
  const isLime = index % 2 === 1;
  const accent = isLime ? TL_LIME : TL_CYAN;

  return (
    <StaggerItem variant="blur" className="relative text-center">
      <motion.div
        className="group relative mx-auto rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-6 md:border-0 md:bg-transparent md:px-0 md:py-0"
        style={{ transformStyle: "preserve-3d", perspective: 900 }}
        whileHover={reduceMotion ? undefined : { y: -12, rotateX: 10, scale: 1.04, z: 40 }}
        transition={{ type: "spring", stiffness: 280, damping: 20 }}
      >
        <div className="relative z-[1] mx-auto mb-4 flex h-[4.25rem] w-[4.25rem] items-center justify-center md:mb-5">
          <PulseRing delay={index * 0.35} colorClass={isLime ? "bg-[#D4E157]/35" : "bg-[#00A0E3]/35"} />
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ background: `${accent}22` }}
            aria-hidden
            animate={
              reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }
            }
            transition={{ duration: 3.2, repeat: Infinity, delay: index * 0.4, ease: "easeInOut" }}
          />
          <motion.span
            className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md"
            style={{
              background: accent,
              color: isLime ? "#0A1628" : "#fff",
              boxShadow: `0 10px 24px -8px ${accent}88`,
            }}
            whileHover={reduceMotion ? undefined : { rotate: [0, -8, 8, 0], scale: 1.08 }}
            transition={{ duration: 0.55 }}
          >
            <Icon className="text-lg" aria-hidden />
          </motion.span>
          <motion.span
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0A1628] text-[10px] font-bold text-white"
            style={{ background: TL_NAVY_SOFT }}
            initial={reduceMotion ? false : { scale: 0, rotate: -20 }}
            whileInView={reduceMotion ? undefined : { scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.25 + index * 0.12 }}
          >
            {index + 1}
          </motion.span>
        </div>

        <h3 className="font-heading text-lg font-bold text-white transition-colors group-hover:text-[#00A0E3]">
          {step.title}
        </h3>
        <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-7 text-[#7EB8D9]">
          {step.description}
        </p>
      </motion.div>
    </StaggerItem>
  );
}

export default function TenantProHowItWorks({ teacherName, specialty, signupHref }) {
  const subtitle = specialty
    ? `ثلاث خطوات واضحة توصلك لنتيجة أفضل في ${specialty} مع ${teacherName}.`
    : `ثلاث خطوات واضحة توصلك لنتيجة أفضل مع ${teacherName}.`;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 py-12 md:py-20"
      style={{ background: TL_NAVY_SOFT, perspective: 1200 }}
      dir="rtl"
    >
      <div className={tlContainer}>
        <Reveal variant="depthIn" className="mx-auto max-w-2xl text-center">
          <span className={tlEyebrow}>كيف تبدأ؟</span>
          <h2 className={`${tlHeading} mt-3`}>رحلة التعلّم خطوة بخطوة</h2>
          <p className="mt-3 text-sm leading-7 text-[#7EB8D9] sm:text-base">{subtitle}</p>
        </Reveal>

        <div className="relative mt-10 md:mt-12">
          <DrawLine
            delay={0.15}
            className="pointer-events-none absolute left-[12%] right-[12%] top-[2.15rem] hidden h-[2px] bg-gradient-to-l from-[#00A0E3]/70 via-[#D4E157]/70 to-[#00A0E3]/70 md:block"
          />

          <StaggerGrid className="relative grid gap-4 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, index) => (
              <StepCard key={step.title} step={step} index={index} />
            ))}
          </StaggerGrid>
        </div>

        <Reveal variant="springPop" delay={0.2} className="mt-10 flex justify-center md:mt-12">
          <ShimmerCTA>
            <TenantAppLink
              href={signupHref}
              className={`w-full max-w-sm sm:w-auto ${tlBtnPrimary}`}
            >
              <span className="inline-flex items-center gap-2">
                <FaRocket className="text-xs opacity-95" aria-hidden />
                ابدأ رحلتك الآن
              </span>
            </TenantAppLink>
          </ShimmerCTA>
        </Reveal>
      </div>
    </section>
  );
}
