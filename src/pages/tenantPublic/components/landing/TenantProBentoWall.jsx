/**
 * سيكشن «تعرّف علينا» — تكوين إبداعي متناسق مع الهيرو (blue.500)
 */
import { useReducedMotion } from "framer-motion";
import {
  FaArrowLeft,
  FaBookOpen,
  FaCheck,
  FaComments,
  FaGraduationCap,
  FaLightbulb,
  FaUsers,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Reveal } from "../../tenantLandingMotion";
import { tlContainer } from "../../tenantLandingTheme";
import { getPortraitImageSrcSet } from "../../../../utils/highQualityImageUrl";
import TenantAppLink from "../TenantAppLink";

const BLUE = "#3182CE";
const BLUE_DARK = "#2B6CB0";
const BLUE_LIGHT = "#63B3ED";
const EASE = [0.22, 1, 0.36, 1];

const BENEFIT_ICONS = [FaLightbulb, FaBookOpen, FaUsers, FaComments];

function AboutAvatar({ src, alt }) {
  const reduceMotion = useReducedMotion();
  const srcSet = src ? getPortraitImageSrcSet(src) : undefined;

  return (
    <div className="relative mx-auto w-[min(100%,320px)] sm:w-[360px]">
      <div
        className="absolute -inset-6 rounded-full opacity-35 blur-3xl [.tenant-light_&]:opacity-20"
        style={{ background: `radial-gradient(circle, ${BLUE}70 0%, transparent 68%)` }}
        aria-hidden
      />

      {!reduceMotion ? (
        <motion.div
          className="absolute -inset-5 rounded-full border border-dashed border-[#3182CE]/28"
          animate={{ rotate: 360 }}
          transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
      ) : (
        <div
          className="absolute -inset-5 rounded-full border border-dashed border-[#3182CE]/28"
          aria-hidden
        />
      )}

      <div
        className="absolute -inset-2 rounded-full border-2 border-[#3182CE]/28"
        aria-hidden
      />

      {/* إطار دائري كامل + خلفية blue.500 لصورة بدون خلفية */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-full shadow-[0_28px_56px_-18px_rgba(49,130,206,0.5)] ring-4 ring-white/25 [.tenant-light_&]:ring-[#3182CE]/18"
        style={{
          background: `radial-gradient(circle at 35% 22%, ${BLUE_LIGHT} 0%, ${BLUE} 46%, ${BLUE_DARK} 100%)`,
        }}
      >
        {src ? (
          <img
            src={src}
            srcSet={srcSet}
            sizes="(min-width: 640px) 360px, 80vw"
            alt={alt}
            className="absolute inset-0 h-full w-full object-contain object-bottom"
            style={{
              transform: "scale(1.14) translateY(18px)",
              transformOrigin: "center bottom",
            }}
            loading="eager"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FaGraduationCap className="text-6xl text-white/35" aria-hidden />
          </div>
        )}
      </div>

      <motion.div
        className="absolute -right-1 top-[10%] z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card-solid)] shadow-lg"
        style={{ color: BLUE }}
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <FaGraduationCap className="text-base" />
      </motion.div>
      <motion.div
        className="absolute -left-1 bottom-[16%] z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card-solid)] shadow-lg"
        style={{ color: BLUE_LIGHT }}
        animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        aria-hidden
      >
        <FaLightbulb className="text-sm" />
      </motion.div>
    </div>
  );
}

function BenefitCard({ item, index }) {
  const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length];
  const title = typeof item === "string" ? item : item?.title;
  const description = typeof item === "string" ? null : item?.description;

  if (!title) return null;

  return (
    <motion.li
      className="group relative overflow-hidden rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] p-4 shadow-[var(--tl-shadow)]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: 0.06 * index, duration: 0.45, ease: EASE }}
      whileHover={{ y: -3, borderColor: "rgba(49,130,206,0.4)" }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(to bottom, ${BLUE}, ${BLUE_LIGHT})` }}
        aria-hidden
      />

      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
          style={{
            background: `linear-gradient(145deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
            boxShadow: `0 10px 22px -10px ${BLUE}aa`,
          }}
        >
          <Icon className="text-sm" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className="font-heading text-[11px] font-bold tabular-nums"
              style={{ color: BLUE }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-heading text-sm font-bold text-[var(--tl-fg)] sm:text-[15px]">
              {title}
            </h3>
          </div>
          {description ? (
            <p className="mt-1.5 text-xs leading-6 text-[var(--tl-muted)] sm:text-[13px] sm:leading-6">
              {description}
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--tl-muted)]">
              <FaCheck className="text-[9px]" style={{ color: BLUE }} aria-hidden />
              ميزة أساسية في أسلوب التدريس
            </p>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export default function TenantProBentoWall({
  teacherName,
  bioText,
  services = [],
  signupHref,
  teacherImageUrl,
}) {
  const benefitItems = (services || []).slice(0, 4);

  return (
    <section
      id="services"
      className="relative scroll-mt-20 overflow-hidden bg-[var(--tl-section)] py-14 md:py-20"
      dir="rtl"
    >
      {/* subtle section atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 8% 30%, rgba(49,130,206,0.06) 0%, transparent 55%), radial-gradient(ellipse 40% 40% at 92% 70%, rgba(49,130,206,0.04) 0%, transparent 50%)",
        }}
        aria-hidden
      />

      <div className={`${tlContainer} relative z-[1] max-w-6xl`}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* copy */}
          <div className="order-2 lg:order-1">
            <Reveal variant="slideFromEnd">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3182CE]/25 bg-[#3182CE]/10 px-3.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3182CE]" aria-hidden />
                <span className="text-xs font-bold text-[#2B6CB0] [.tenant-dark_&]:text-[#90CDF4]">
                  تعرّف علينا
                </span>
              </div>

              <h2 className="font-heading text-[1.65rem] font-extrabold leading-snug tracking-tight text-[var(--tl-fg)] sm:text-3xl md:text-[2.1rem]">
                لماذا{" "}
                <span
                  style={{
                    background: `linear-gradient(90deg, ${BLUE} 0%, ${BLUE_LIGHT} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {teacherName}
                </span>
                ؟
              </h2>

              <motion.span
                className="mt-3 block h-[3px] w-14 rounded-full"
                style={{ background: `linear-gradient(90deg, ${BLUE}, ${BLUE_LIGHT})`, originX: 1 }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: EASE }}
                aria-hidden
              />

              <p className="mt-5 max-w-xl text-sm leading-8 text-[var(--tl-muted)] sm:text-[15px] sm:leading-8">
                {bioText}
              </p>

              {benefitItems.length > 0 ? (
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {benefitItems.map((item, i) => (
                    <BenefitCard
                      key={typeof item === "string" ? item : item?.title || i}
                      item={item}
                      index={i}
                    />
                  ))}
                </ul>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <TenantAppLink
                  href={signupHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                  style={{
                    background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
                    boxShadow: `0 14px 32px -12px ${BLUE}aa`,
                  }}
                >
                  ابدأ الآن
                  <FaArrowLeft className="text-xs" />
                </TenantAppLink>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] px-5 py-3.5 text-sm font-bold text-[var(--tl-fg)] transition hover:border-[#3182CE]/40"
                >
                  كيف تبدأ؟
                </a>
              </div>
            </Reveal>
          </div>

          {/* avatar */}
          <div className="order-1 flex justify-center lg:order-2">
            <Reveal variant="depthIn">
              <AboutAvatar src={teacherImageUrl} alt={teacherName} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
