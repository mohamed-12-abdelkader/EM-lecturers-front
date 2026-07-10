import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaGraduationCap,
  FaPlay,
  FaStar,
} from "react-icons/fa";
import { HeroStagger, HeroStaggerItem } from "../../tenantLandingMotion";
import {
  tlBtnOutlineDark,
  tlBtnPrimary,
  tlBtnSecondary,
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

function HeroPortrait({ src, alt, teacherName, specialty }) {
  return (
    <div className="relative mx-auto w-full max-w-[420px]" dir="ltr">
      <div
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-500/10 via-transparent to-orange-500/10 blur-2xl"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_24px_60px_rgba(49,130,206,0.12)] dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-l from-blue-500 via-blue-400 to-orange-500" aria-hidden />

        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          {src ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover object-top"
              loading="eager"
              fetchpriority="high"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FaGraduationCap className="text-6xl text-blue-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5 text-right" dir="rtl">
            <p className="text-xs font-medium text-white/80">مدرس المنصة</p>
            <p className="font-heading text-lg font-bold text-white">{teacherName}</p>
            {specialty ? (
              <p className="mt-1 text-xs text-orange-300">{specialty}</p>
            ) : null}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
        className="absolute -left-2 top-8 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:-left-6"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-950/40">
            <FaStar className="text-sm" />
          </div>
          <div className="text-right" dir="rtl">
            <p className="font-heading text-sm font-bold text-slate-900 dark:text-white">4.9</p>
            <p className="text-[10px] text-slate-500">تقييم الطلاب</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: EASE }}
        className="absolute -bottom-3 -right-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:-right-5"
      >
        <div className="flex items-center gap-2" dir="rtl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/40">
            <FaCheckCircle className="text-sm" />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900 dark:text-white">محتوى معتمد</p>
            <p className="text-[10px] text-slate-500">شرح منظم</p>
          </div>
        </div>
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
      className="relative overflow-hidden border-b border-slate-200/80 bg-[#FAFBFC] pt-[4.75rem] dark:border-slate-800 dark:bg-slate-950"
      dir="rtl"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#EBF4FF_0%,#FAFBFC_35%,#FFFFFF_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-500/[0.06] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-orange-500/[0.05] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-[0.08]"
        aria-hidden
      />

      <div className={`${tlContainer} relative py-12 md:py-16 lg:py-20`}>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16" dir="ltr">
          <div className="order-2 text-right lg:order-none" dir="rtl">
            <HeroStagger>
              <HeroStaggerItem className="mb-5 flex flex-wrap items-center justify-end gap-2">
                {specialty ? <span className={tlEyebrow}>{specialty}</span> : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400">
                  <FaStar className="text-[10px]" />
                  منصة تعليمية موثوقة
                </span>
              </HeroStaggerItem>

              <HeroStaggerItem as="h1">
                <h1 className="font-heading text-[1.85rem] font-bold leading-[1.35] tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.25]">
                  {highlightTitle(heroTitle, teacherName)}
                </h1>
              </HeroStaggerItem>

              <HeroStaggerItem as="p" className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                {bioText}
              </HeroStaggerItem>

              <HeroStaggerItem className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <a href={signupHref} className={`${tlBtnPrimary} !px-8 !py-3.5`}>
                  ابدأ التعلّم الآن
                  <FaArrowLeft className="text-[10px]" />
                </a>
                <a href={loginHref} className={tlBtnOutlineDark}>
                  تسجيل الدخول
                </a>
                <a
                  href="#videos"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:text-blue-500 dark:text-slate-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <FaPlay className="mr-[-1px] text-[10px] text-blue-500" />
                  </span>
                  شاهد محاضرة مجانية
                </a>
              </HeroStaggerItem>

              {heroStats.length > 0 && (
                <HeroStaggerItem className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-4 sm:gap-6">
                    {heroStats.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="text-right">
                          <div className="mb-2 flex items-center justify-end gap-2">
                            <Icon
                              className={`text-sm ${i % 2 === 0 ? "text-blue-500" : "text-orange-500"}`}
                            />
                            <p className="font-heading text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                              {item.value}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 sm:text-sm">{item.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </HeroStaggerItem>
              )}
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

      <div className="relative border-t border-slate-200/80 bg-white/70 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div
          className={`${tlContainer} flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-4 text-xs text-slate-500 sm:text-sm`}
        >
          {[
            "شرح منظم وواضح",
            "متابعة مستمرة للطلاب",
            "محاضرات مجانية للتجربة",
            "دعم فني سريع",
          ].map((label) => (
            <span key={label} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
