import { motion } from "framer-motion";
import { FaArrowLeft, FaQuoteRight, FaStar } from "react-icons/fa";
import { Reveal, StaggerGrid, StaggerItem } from "../../tenantLandingMotion";
import {
  tlBtnOutline,
  tlBtnPrimary,
  tlCard,
  tlContainer,
  tlEyebrowOrange,
  tlHeading,
  tlSectionWhite,
} from "../../tenantLandingTheme";

function ReviewCard({ item }) {
  const rating = Number(item.rating) || 5;
  return (
    <article className={`${tlCard} relative h-full p-5 text-right md:p-6`} dir="rtl">
      <FaQuoteRight className="absolute right-4 top-4 text-2xl text-blue-100 dark:text-slate-800" aria-hidden />
      <div className="mb-3 flex justify-start gap-0.5 text-orange-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <FaStar key={i} className={`text-sm ${i < rating ? "opacity-100" : "opacity-20"}`} />
        ))}
      </div>
      <p className="relative text-sm leading-8 text-slate-600 dark:text-slate-300">"{item.text}"</p>
      <div className="mt-4 flex items-center justify-start gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
          {(item.name || "ط").slice(0, 1)}
        </span>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
          <p className="text-xs text-slate-500">طالب</p>
        </div>
      </div>
    </article>
  );
}

export function TenantProReviews({ testimonials }) {
  if (!testimonials?.length) return null;

  return (
    <section className={`py-16 md:py-20 ${tlSectionWhite}`} dir="rtl">
      <div className={tlContainer}>
        <Reveal variant="blurUp" className="text-right">
          <span className={tlEyebrowOrange}>آراء الطلاب</span>
          <h2 className={`${tlHeading} mt-3`}>ماذا يقول طلابنا؟</h2>
          <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 px-5 py-2.5 dark:border-orange-900/40 dark:bg-orange-950/30">
            <span className="font-heading text-2xl font-bold text-orange-500">4.9</span>
            <div className="text-right">
              <div className="flex justify-start gap-0.5 text-orange-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="text-xs" />
                ))}
              </div>
              <p className="text-[10px] text-slate-500">تقييم الطلاب</p>
            </div>
          </div>
        </Reveal>

        <StaggerGrid className="mt-8 grid gap-4 md:grid-cols-3">
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
    <section id="cta" className="bg-blue-500 py-16 md:py-20" dir="rtl">
      <div className={tlContainer}>
        <Reveal variant="scaleIn">
          <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900 md:p-12">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-2xl" aria-hidden />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div className="text-right">
                <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                  ابدأ رحلة التعلم اليوم
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400 md:text-base">
                  انضم الآن واستفد من الشرح المنظم والمتابعة المستمرة.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={signupHref} className={tlBtnPrimary}>
                    سجّل الآن
                    <FaArrowLeft className="text-xs" />
                  </a>
                  <a href={loginHref} className={`${tlBtnOutline} !border-blue-500 !text-blue-500 !bg-transparent hover:!bg-blue-50 dark:hover:!bg-blue-950/30`}>
                    تسجيل الدخول
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "محاضرات", value: "24/7", color: "text-blue-500" },
                  { label: "متابعة", value: "مستمرة", color: "text-orange-500" },
                  { label: "اختبارات", value: "فورية", color: "text-blue-500" },
                  { label: "دعم", value: "سريع", color: "text-orange-500" },
                ].map((chip) => (
                  <motion.div
                    key={chip.label}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center dark:border-slate-700 dark:bg-slate-800"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className={`font-heading text-base font-bold ${chip.color}`}>{chip.value}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{chip.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
