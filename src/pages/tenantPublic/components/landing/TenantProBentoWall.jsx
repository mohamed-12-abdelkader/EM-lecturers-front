import { FaArrowLeft, FaCheck, FaGraduationCap } from "react-icons/fa";
import { motion } from "framer-motion";
import { Reveal, Tilt3D } from "../../tenantLandingMotion";
import { TL_CYAN, TL_LIME, TL_NAVY, tlBtnPrimary, tlContainer } from "../../tenantLandingTheme";
import TenantAppLink from "../TenantAppLink";

function AboutTeacherImage({ src, alt }) {
  return (
    <div className="relative mx-auto w-full max-w-[380px] md:max-w-[420px]" dir="ltr">
      <motion.div
        className="pointer-events-none absolute -bottom-4 -left-4 h-[90%] w-[80%] rounded-[1.75rem] opacity-80"
        style={{ background: `${TL_CYAN}33` }}
        animate={{ y: [0, 8, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-3 top-10 h-16 w-16 rounded-full border md:h-20 md:w-20"
        style={{ borderColor: `${TL_LIME}55`, background: `${TL_LIME}14` }}
        animate={{ scale: [1, 1.12, 1], y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      <Tilt3D maxTilt={12} floatPx={8} floatDuration={5.5}>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
          <div
            className="absolute inset-x-0 top-0 z-10 h-1"
            style={{ background: `linear-gradient(to left, ${TL_CYAN}, ${TL_LIME})` }}
            aria-hidden
          />

          <div
            className="aspect-[4/5] overflow-hidden"
            style={{ background: `linear-gradient(160deg, #1e3a5f 0%, ${TL_NAVY} 100%)` }}
          >
            {src ? (
              <motion.img
                src={src}
                alt={alt}
                className="h-full w-full object-cover object-top"
                loading="eager"
                decoding="async"
                fetchpriority="low"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <FaGraduationCap className="text-6xl text-white/25" aria-hidden />
              </div>
            )}
          </div>

          <div
            className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/10"
            aria-hidden
          />
        </div>
      </Tilt3D>
    </div>
  );
}

export default function TenantProBentoWall({
  teacherName,
  bioText,
  services,
  signupHref,
  teacherImageUrl,
}) {
  const benefitItems = services.slice(0, 4).map((s) => s.title).filter(Boolean);

  return (
    <section
      id="services"
      className="scroll-mt-20 bg-[var(--tl-section)] py-12 md:py-20"
      style={{ perspective: 1200 }}
      dir="rtl"
    >
      <div className={`${tlContainer} max-w-6xl`}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16" dir="ltr">
          <div className="order-1 flex justify-center px-2 sm:px-0 lg:order-none">
            <Reveal variant="depthIn">
              <AboutTeacherImage src={teacherImageUrl} alt={teacherName} />
            </Reveal>
          </div>

          <div className="order-2 text-right lg:order-none" dir="rtl">
            <Reveal variant="slideFromEnd">
              <p className="text-sm font-semibold" style={{ color: TL_CYAN }}>
                تعرّف علينا
              </p>
              <h2 className="font-heading mt-2 text-2xl font-bold text-[var(--tl-fg)] md:text-3xl">
                لماذا {teacherName}؟
              </h2>
              <p className="mt-5 text-sm leading-8 text-[var(--tl-muted)] sm:text-base sm:leading-8">
                {bioText}
              </p>

              {benefitItems.length > 0 && (
                <ul className="mt-6 space-y-3" style={{ perspective: 900 }}>
                  {benefitItems.map((title, i) => (
                    <motion.li
                      key={title}
                      className="flex items-start gap-3 rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] px-4 py-3 text-sm text-[var(--tl-fg)] shadow-sm"
                      initial={{ opacity: 0, x: 28, rotateY: -12 }}
                      whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{
                        y: -4,
                        scale: 1.02,
                        rotateX: 4,
                        borderColor: "rgba(0,160,227,0.4)",
                      }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${TL_LIME}22`, color: TL_LIME }}
                      >
                        <FaCheck className="text-[10px]" aria-hidden />
                      </span>
                      <span className="leading-6">{title}</span>
                    </motion.li>
                  ))}
                </ul>
              )}

              <TenantAppLink
                href={signupHref}
                className={`mt-8 w-full sm:w-auto ${tlBtnPrimary}`}
              >
                ابدأ الآن
                <FaArrowLeft className="text-xs" />
              </TenantAppLink>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
