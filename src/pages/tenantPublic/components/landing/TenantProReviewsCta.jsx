import { motion } from "framer-motion";
import { FaArrowLeft, FaQuoteRight, FaStar } from "react-icons/fa";
import {
  DepthCard,
  Reveal,
  ShimmerCTA,
  StaggerGrid,
  StaggerItem,
} from "../../tenantLandingMotion";
import {
  TL_CYAN,
  TL_LIME,
  TL_NAVY,
  TL_NAVY_SOFT,
  tlBtnOutline,
  tlBtnPrimary,
  tlCard,
  tlContainer,
  tlEyebrowOrange,
  tlHeading,
} from "../../tenantLandingTheme";
import TenantAppLink from "../TenantAppLink";

function ReviewCard({ item }) {
  const rating = Number(item.rating) || 5;
  return (
    <DepthCard maxTilt={12} floatPx={4} className="h-full">
      <article className={`${tlCard} relative h-full p-5 text-right md:p-6`} dir="rtl">
        <FaQuoteRight className="absolute right-4 top-4 text-2xl text-white/10" aria-hidden />
        <div className="mb-3 flex justify-start gap-0.5" style={{ color: TL_LIME }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.6, rotateY: -40 }}
              whileInView={{ opacity: i < rating ? 1 : 0.2, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 * i, type: "spring", stiffness: 400, damping: 18 }}
            >
              <FaStar className="text-sm" />
            </motion.span>
          ))}
        </div>
        <p className="relative text-sm leading-8 text-[#7EB8D9]">"{item.text}"</p>
        <div className="mt-4 flex items-center justify-start gap-3 border-t border-white/10 pt-4">
          <motion.span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: TL_CYAN }}
            whileHover={{ scale: 1.12, rotate: 8 }}
          >
            {(item.name || "ط").slice(0, 1)}
          </motion.span>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{item.name}</p>
            <p className="text-xs text-[#7EB8D9]/80">طالب</p>
          </div>
        </div>
      </article>
    </DepthCard>
  );
}

export function TenantProReviews({ testimonials }) {
  if (!testimonials?.length) return null;

  return (
    <section className="py-12 md:py-20" style={{ background: TL_NAVY, perspective: 1200 }} dir="rtl">
      <div className={tlContainer}>
        <Reveal variant="depthIn" className="text-right">
          <span className={tlEyebrowOrange}>آراء الطلاب</span>
          <h2 className={`${tlHeading} mt-3`}>ماذا يقول طلابنا؟</h2>
          <motion.div
            className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-[#D4E157]/25 bg-[#D4E157]/10 px-5 py-2.5"
            whileHover={{ scale: 1.05, rotateX: 8, y: -4 }}
            transition={{ type: "spring", stiffness: 360, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <span className="font-heading text-2xl font-bold" style={{ color: TL_LIME }}>
              4.9
            </span>
            <div className="text-right">
              <div className="flex justify-start gap-0.5" style={{ color: TL_LIME }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="text-xs" />
                ))}
              </div>
              <p className="text-[10px] text-[#7EB8D9]">تقييم الطلاب</p>
            </div>
          </motion.div>
        </Reveal>

        <div
          className="-mx-4 mt-8 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:hidden"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {testimonials.map((item, i) => (
            <div key={`m-${item.name}-${i}`} className="w-[85vw] max-w-[320px] shrink-0 snap-center">
              <ReviewCard item={item} />
            </div>
          ))}
        </div>

        <StaggerGrid className="mt-8 hidden gap-4 md:grid md:grid-cols-3">
          {testimonials.map((item, i) => (
            <StaggerItem key={`${item.name}-${i}`} variant="blur">
              <ReviewCard item={item} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

export function TenantProCta({ signupHref, loginHref }) {
  return (
    <section
      id="cta"
      className="relative overflow-hidden py-12 md:py-20"
      style={{ background: TL_NAVY_SOFT, perspective: 1400 }}
      dir="rtl"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full blur-2xl"
        style={{ background: `${TL_CYAN}22` }}
        animate={{ x: [0, 24, 0], y: [0, 12, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full blur-2xl"
        style={{ background: `${TL_LIME}18` }}
        animate={{ x: [0, -18, 0], y: [0, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />

      <div className={`${tlContainer} relative`}>
        <Reveal variant="depthIn">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)] backdrop-blur-sm md:p-12"
            whileHover={{ rotateX: 4, y: -6, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full blur-2xl"
              style={{ background: `${TL_LIME}14` }}
              aria-hidden
            />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div className="text-right">
                <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
                  ابدأ رحلة التعلم اليوم
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#7EB8D9] md:text-base">
                  انضم الآن واستفد من الشرح المنظم والمتابعة المستمرة.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                  <ShimmerCTA>
                    <TenantAppLink href={signupHref} className={`w-full sm:w-auto ${tlBtnPrimary}`}>
                      سجّل الآن
                      <FaArrowLeft className="text-xs" />
                    </TenantAppLink>
                  </ShimmerCTA>
                  <TenantAppLink href={loginHref} className={`w-full sm:w-auto ${tlBtnOutline}`}>
                    تسجيل الدخول
                  </TenantAppLink>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3" style={{ perspective: 900 }}>
                {[
                  { label: "محاضرات", value: "24/7", color: TL_CYAN },
                  { label: "متابعة", value: "مستمرة", color: TL_LIME },
                  { label: "اختبارات", value: "فورية", color: TL_CYAN },
                  { label: "دعم", value: "سريع", color: TL_LIME },
                ].map((chip, i) => (
                  <motion.div
                    key={chip.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3.5 text-center"
                    initial={{ opacity: 0, y: 20, rotateX: 24 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.08 * i, duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.05, rotateX: 10, z: 30 }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <p className="font-heading text-base font-bold" style={{ color: chip.color }}>
                      {chip.value}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#7EB8D9]">{chip.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
