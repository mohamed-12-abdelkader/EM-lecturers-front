/**
 * هيرو إبداعي لمنصة المدرّس — أيقونات خلفية حسب المادة + تكوين سينمائي
 */
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaAward,
  FaGraduationCap,
  FaPlay,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";
import {
  HeroStagger,
  HeroStaggerItem,
} from "../../tenantLandingMotion";
import {
  getPortraitImageSrcSet,
} from "../../../../utils/highQualityImageUrl";
import {
  tlContainer,
} from "../../tenantLandingTheme";
import TenantAppLink from "../TenantAppLink";

const EASE = [0.22, 1, 0.36, 1];
const BLUE_500 = "#3182CE";

/* ─── Subject theme ─────────────────────────────────────────── */

function detectSubjectKey(specialty) {
  const s = String(specialty || "").toLowerCase();
  if (/كيم|chem|كمي/.test(s)) return "chemistry";
  if (/رياض|math|حساب|جبر|هندس|تفاضل|تكامل/.test(s)) return "math";
  if (/فيز|phys/.test(s)) return "physics";
  if (/أحيا|احيا|bio|بيو/.test(s)) return "biology";
  if (/عرب|نحو|بلاغ|أدب|ادب/.test(s)) return "arabic";
  if (/انج|engl|english/.test(s)) return "english";
  if (/تاريخ|جغراف|فلسف|نفس|اجتماع/.test(s)) return "humanities";
  if (/حاسب|برمج|كمبيوتر|computer|code|آيت/.test(s)) return "cs";
  if (/فرنس|ألمان|المان|ايطال|إسبان|لغ/.test(s)) return "language";
  return "general";
}

/** Inline subject glyphs — stroke icons that read well as watermarks */
const SUBJECT_ICONS = {
  chemistry: [
    // flask
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M26 8h12M28 8v14l-12 24a8 8 0 0 0 7 12h18a8 8 0 0 0 7-12L36 22V8" />
        <path d="M20 40h24" opacity=".5" />
        <circle cx="28" cy="46" r="2.2" fill="currentColor" stroke="none" />
        <circle cx="36" cy="50" r="1.6" fill="currentColor" stroke="none" opacity=".7" />
      </svg>
    ),
    // atom
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <ellipse cx="32" cy="32" rx="22" ry="8" />
        <ellipse cx="32" cy="32" rx="22" ry="8" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="22" ry="8" transform="rotate(-60 32 32)" />
        <circle cx="32" cy="32" r="3.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    // molecule
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <circle cx="18" cy="22" r="6" />
        <circle cx="42" cy="16" r="5" />
        <circle cx="46" cy="40" r="7" />
        <circle cx="22" cy="46" r="4.5" />
        <path d="M23 26l14-7M38 20l5 14M40 42L25 44" />
      </svg>
    ),
    // beaker
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M20 10h24M24 10v16l-8 26a6 6 0 0 0 5.7 8h20.6a6 6 0 0 0 5.7-8L40 26V10" />
        <path d="M18 44h28" opacity=".45" />
      </svg>
    ),
    // hexagon / benzene
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M32 8l18 10v20L32 48 14 38V18z" />
        <circle cx="32" cy="28" r="6" opacity=".55" />
      </svg>
    ),
  ],
  math: [
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
        <path d="M14 40c6-18 12-26 18-26s8 14 18 32" />
        <path d="M20 28h24" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="currentColor" {...p}>
        <text x="32" y="44" textAnchor="middle" fontSize="36" fontFamily="serif">
          ∑
        </text>
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
        <path d="M12 18h18L12 46h20" />
        <path d="M40 32h16M48 24v16" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
        <path d="M12 48L32 12l20 36z" />
        <path d="M20 48h24" opacity=".5" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="currentColor" {...p}>
        <text x="32" y="44" textAnchor="middle" fontSize="34" fontFamily="serif">
          ∞
        </text>
      </svg>
    ),
  ],
  physics: [
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <ellipse cx="32" cy="32" rx="22" ry="8" />
        <ellipse cx="32" cy="32" rx="22" ry="8" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="22" ry="8" transform="rotate(-60 32 32)" />
        <circle cx="32" cy="32" r="3.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
        <path d="M34 8L18 34h14L26 56l22-30H34z" fill="currentColor" fillOpacity=".15" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M8 24c8 0 8 16 16 16s8-16 16-16 8 16 16 16" />
        <path d="M8 40c8 0 8-16 16-16s8 16 16 16 8-16 16-16" opacity=".5" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <circle cx="32" cy="32" r="10" />
        <path d="M32 8v8M32 48v8M8 32h8M48 32h8M14 14l6 6M44 44l6 6M50 14l-6 6M20 44l-6 6" />
      </svg>
    ),
  ],
  biology: [
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M24 12c8 8 8 32 0 40M40 12c-8 8-8 32 0 40" />
        <path d="M20 24h24M18 32h28M20 40h24" opacity=".55" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <ellipse cx="32" cy="36" rx="16" ry="20" />
        <circle cx="32" cy="34" r="6" />
        <path d="M32 8v8" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M32 52V28M32 28c-10-2-16-10-14-18 10 2 16 10 14 18zM32 28c10-2 16-10 14-18-10 2-16 10-14 18z" />
      </svg>
    ),
  ],
  arabic: [
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M14 16h28a6 6 0 0 1 6 6v28H20a6 6 0 0 1-6-6V16z" />
        <path d="M48 16v34a6 6 0 0 1-6 6" />
        <path d="M22 28h18M22 36h14" opacity=".55" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M18 46l8-28 6 14 6-14 8 28" />
        <path d="M22 38h20" opacity=".5" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M16 48l24-32 8 6-24 32-10 2z" />
        <path d="M36 20l8 6" />
      </svg>
    ),
  ],
  english: [
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <circle cx="32" cy="32" r="22" />
        <path d="M10 32h44M32 10c8 8 8 36 0 44M32 10c-8 8-8 36 0 44" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
        <path d="M18 16h20a8 8 0 0 1 0 16H18zM18 32h22a8 8 0 0 1 0 16H18z" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M14 16h28a6 6 0 0 1 6 6v28H20a6 6 0 0 1-6-6V16z" />
        <path d="M22 28h18M22 36h12" />
      </svg>
    ),
  ],
  humanities: [
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <circle cx="32" cy="32" r="22" />
        <path d="M10 32h44M32 10c8 8 8 36 0 44M32 10c-8 8-8 36 0 44" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M12 44V22l20-8 20 8v22l-20 8z" />
        <path d="M32 14v38M12 22l20 8 20-8" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M14 16h28a6 6 0 0 1 6 6v28H20a6 6 0 0 1-6-6V16z" />
      </svg>
    ),
  ],
  cs: [
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
        <path d="M22 18L10 32l12 14M42 18l12 14-12 14M36 14L28 50" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <rect x="10" y="14" width="44" height="30" rx="4" />
        <path d="M24 52h16M32 44v8" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <circle cx="32" cy="32" r="8" />
        <circle cx="32" cy="14" r="4" />
        <circle cx="48" cy="40" r="4" />
        <circle cx="16" cy="40" r="4" />
        <path d="M32 22v2M38 36l4 3M26 36l-4 3" />
      </svg>
    ),
  ],
  language: [
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <circle cx="32" cy="32" r="22" />
        <path d="M10 32h44M32 10c8 8 8 36 0 44M32 10c-8 8-8 36 0 44" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M14 16h28a6 6 0 0 1 6 6v28H20a6 6 0 0 1-6-6V16z" />
      </svg>
    ),
  ],
  general: [
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M32 10L12 20v16c0 12 8 18 20 22 12-4 20-10 20-22V20z" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M14 16h28a6 6 0 0 1 6 6v28H20a6 6 0 0 1-6-6V16z" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M32 10v8M32 46v8M10 32h8M46 32h8" />
        <circle cx="32" cy="32" r="12" />
        <path d="M32 22v10l7 4" />
      </svg>
    ),
    (p) => (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path d="M20 48V28l12-10 12 10v20z" />
        <path d="M28 48V36h8v12" />
      </svg>
    ),
  ],
};

const ICON_SLOTS = [
  { top: "8%", right: "6%", size: 56, opacity: 0.14, rotate: -12, dur: 7 },
  { top: "18%", left: "4%", size: 72, opacity: 0.11, rotate: 18, dur: 9 },
  { top: "42%", right: "10%", size: 44, opacity: 0.16, rotate: 8, dur: 6.5 },
  { bottom: "22%", left: "8%", size: 64, opacity: 0.12, rotate: -20, dur: 8 },
  { bottom: "12%", right: "18%", size: 48, opacity: 0.15, rotate: 14, dur: 7.5 },
  { top: "58%", left: "22%", size: 40, opacity: 0.1, rotate: -6, dur: 10 },
  { top: "28%", right: "28%", size: 36, opacity: 0.09, rotate: 22, dur: 8.5 },
  { bottom: "36%", right: "4%", size: 58, opacity: 0.13, rotate: -15, dur: 9.5 },
];

function SubjectBackdrop({ specialty, reduceMotion }) {
  const key = detectSubjectKey(specialty);
  const icons = SUBJECT_ICONS[key] || SUBJECT_ICONS.general;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* layered color mesh */}
      <div className="absolute inset-0" style={{ background: "var(--tl-hero-mesh)" }} />

      {/* drifting aurora orbs */}
      {[
        { className: "absolute -left-24 top-10 h-72 w-72", color: "var(--tl-hero-orb-a)", delay: 0 },
        { className: "absolute -right-16 top-1/3 h-80 w-80", color: "var(--tl-hero-orb-b)", delay: 1.2 },
        { className: "absolute bottom-0 left-1/3 h-64 w-64", color: "var(--tl-hero-orb-c)", delay: 0.6 },
      ].map((orb, i) =>
        reduceMotion ? (
          <div
            key={i}
            className={`${orb.className} rounded-full blur-3xl`}
            style={{ background: orb.color }}
          />
        ) : (
          <motion.div
            key={i}
            className={`${orb.className} rounded-full blur-3xl`}
            style={{ background: orb.color }}
            animate={{
              x: [0, i % 2 === 0 ? 24 : -18, 0],
              y: [0, i % 2 === 0 ? -18 : 22, 0],
              scale: [1, 1.12, 1],
              opacity: [0.75, 1, 0.75],
            }}
            transition={{ duration: 9 + i * 2, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
          />
        ),
      )}

      {/* diagonal light streak */}
      <div
        className="absolute inset-0 opacity-10 [.tenant-light_&]:opacity-12"
        style={{
          background:
            "linear-gradient(115deg, transparent 35%, rgba(49,130,206,0.03) 48%, rgba(49,130,206,0.02) 52%, transparent 65%)",
        }}
      />

      {/* soft grid dots */}
      <div
        className="absolute inset-0 opacity-[0.06] [.tenant-light_&]:opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(49,130,206,0.2) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse 75% 65% at 70% 40%, black 15%, transparent 72%)",
        }}
      />

      {key === "chemistry" ? (
        <div
          className="absolute inset-0 opacity-[0.03] [.tenant-light_&]:opacity-[0.025]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -18deg,
              transparent,
              transparent 42px,
              rgba(49,130,206,0.35) 42px,
              rgba(49,130,206,0.35) 43px
            )`,
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
          }}
        />
      ) : null}

      {ICON_SLOTS.map((slot, i) => {
        const Icon = icons[i % icons.length];
        const baseOpacity = Math.max(0.04, slot.opacity * 0.45);
        const color =
          i % 3 === 0 ? BLUE_500 : i % 3 === 1 ? "#63B3ED" : "#2B6CB0";
        if (reduceMotion) {
          return (
            <div
              key={i}
              className="absolute"
              style={{
                top: slot.top,
                bottom: slot.bottom,
                left: slot.left,
                right: slot.right,
                width: slot.size,
                height: slot.size,
                color,
                opacity: baseOpacity,
                transform: `rotate(${slot.rotate}deg)`,
              }}
            >
              <Icon className="h-full w-full" />
            </div>
          );
        }
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: slot.top,
              bottom: slot.bottom,
              left: slot.left,
              right: slot.right,
              width: slot.size,
              height: slot.size,
              color,
            }}
            animate={{
              y: [0, -14, 0],
              rotate: [slot.rotate, slot.rotate + 8, slot.rotate],
              opacity: [baseOpacity * 0.8, baseOpacity * 1.25, baseOpacity * 0.8],
            }}
            transition={{
              duration: slot.dur,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.35,
            }}
          >
            <Icon className="h-full w-full" />
          </motion.div>
        );
      })}

      <div
        className="absolute -bottom-8 -right-6 opacity-[var(--tl-hero-watermark-opacity)]"
        style={{ color: BLUE_500, width: "min(42vw, 320px)", height: "min(42vw, 320px)" }}
      >
        {(() => {
          const Big = icons[0];
          return <Big className="h-full w-full" />;
        })()}
      </div>
    </div>
  );
}

function OrbitingSubjectIcons({ specialty, reduceMotion }) {
  const key = detectSubjectKey(specialty);
  const icons = (SUBJECT_ICONS[key] || SUBJECT_ICONS.general).slice(0, 4);
  /* positions around a circular avatar */
  const positions = [
    { top: "2%", right: "2%", size: 44 },
    { top: "22%", left: "-6%", size: 38 },
    { bottom: "14%", right: "-4%", size: 42 },
    { bottom: "2%", left: "8%", size: 34 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden>
      {icons.map((Icon, i) => {
        const pos = positions[i];
        const node = (
          <div
            className="flex items-center justify-center rounded-2xl border border-[color:var(--tl-hero-chip-border)] bg-[var(--tl-hero-stat-bg)] shadow-lg backdrop-blur-md [.tenant-light_&]:bg-white"
            style={{
              width: pos.size + 14,
              height: pos.size + 14,
              color: i % 2 === 0 ? BLUE_500 : "#63B3ED",
              boxShadow: `0 12px 28px -12px ${BLUE_500}88`,
            }}
          >
            <Icon style={{ width: pos.size * 0.52, height: pos.size * 0.52 }} />
          </div>
        );
        if (reduceMotion) {
          return (
            <div key={i} className="absolute" style={pos}>
              {node}
            </div>
          );
        }
        return (
          <motion.div
            key={i}
            className="absolute"
            style={pos}
            animate={{ y: [0, -10, 0], rotate: [0, i % 2 === 0 ? 6 : -6, 0] }}
            transition={{ duration: 4.5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          >
            {node}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Shared UI ─────────────────────────────────────────────── */

function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(min-width: ${breakpoint}px)`).matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isDesktop;
}

function TeacherPortrait({
  src,
  alt,
  className = "",
  priority = true,
  objectPosition = "center bottom",
  contain = true,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const srcSet = src && !error ? getPortraitImageSrcSet(src) : undefined;

  useEffect(() => {
    setLoaded(false);
    setError(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src && !error ? (
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          sizes="(min-width: 1024px) 420px, 80vw"
          alt={alt}
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
            contain ? "object-contain object-bottom" : "object-cover"
          } ${loaded ? "opacity-100" : "opacity-0"}`}
          style={contain ? undefined : { objectPosition }}
          loading={priority ? "eager" : "lazy"}
          fetchpriority={priority ? "high" : "auto"}
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <FaGraduationCap className="text-6xl text-white/35 sm:text-7xl" aria-hidden />
        </div>
      )}
      {!loaded && src && !error ? (
        <div className="absolute inset-0 animate-pulse bg-white/10" aria-hidden />
      ) : null}
    </div>
  );
}

/** دائرة زرقاء + صورة المدرّس (بدون خلفية) + أيقونات المادة حوليها */
function TeacherHeroAvatar({
  src,
  alt,
  specialty,
  reduceMotion,
  sizeClass = "h-[280px] w-[280px] sm:h-[320px] sm:w-[320px] lg:h-[400px] lg:w-[400px]",
}) {
  return (
    <div className={`relative mx-auto ${sizeClass}`}>
      {/* soft outer glow */}
      <div
        className="absolute -inset-4 rounded-full opacity-50 blur-2xl [.tenant-light_&]:opacity-35"
        style={{
          background: `radial-gradient(circle, ${BLUE_500}99 0%, transparent 70%)`,
        }}
        aria-hidden
      />

      {/* decorative ring */}
      <div
        className="absolute -inset-2 rounded-full border-2 border-[#3182CE]/35 [.tenant-light_&]:border-[#3182CE]/45"
        aria-hidden
      />
      {!reduceMotion ? (
        <motion.div
          className="absolute -inset-5 rounded-full border border-dashed border-[#3182CE]/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
      ) : null}

      {/* blue.500 circular stage for cutout photo */}
      <div
        className="relative h-full w-full overflow-hidden rounded-full shadow-[0_28px_60px_-18px_rgba(49,130,206,0.55)] ring-4 ring-white/25 [.tenant-light_&]:ring-[#3182CE]/20"
        style={{
          background: `radial-gradient(circle at 35% 28%, #63B3ED 0%, ${BLUE_500} 48%, #2B6CB0 100%)`,
        }}
      >
        {/* subtle subject watermark inside circle */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.12]"
          aria-hidden
        >
          {(() => {
            const Icon = (SUBJECT_ICONS[detectSubjectKey(specialty)] || SUBJECT_ICONS.general)[0];
            return <Icon className="h-[55%] w-[55%] text-white" />;
          })()}
        </div>

        <TeacherPortrait
          src={src}
          alt={alt}
          priority
          contain
          className="relative z-[1] h-full w-full scale-[1.14] translate-y-6 sm:translate-y-7 lg:translate-y-8"
        />

        {/* soft bottom shade so cutout sits into the circle */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[18%] rounded-b-full"
          style={{
            background: "linear-gradient(to top, rgba(43,108,176,0.35), transparent)",
          }}
          aria-hidden
        />
      </div>

      <OrbitingSubjectIcons specialty={specialty} reduceMotion={reduceMotion} />
    </div>
  );
}

function HeroActions({ signupHref, loginHref, whatsappHref, showFreeVideos }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-stretch">
        <motion.div
          whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="sm:min-w-[168px]"
        >
          <TenantAppLink
            href={signupHref || loginHref}
            className="inline-flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${BLUE_500} 0%, #2B6CB0 100%)`,
              boxShadow: `0 16px 40px -12px ${BLUE_500}99`,
            }}
          >
            {signupHref ? "ابدأ التعلم الآن" : "دخول برقم الطالب"}
          </TenantAppLink>
        </motion.div>

        {signupHref ? (
          <motion.div
            whileHover={reduceMotion ? undefined : { y: -3 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <TenantAppLink
              href={loginHref}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[color:var(--tl-hero-btn-outline-border)] bg-[var(--tl-hero-btn-outline-bg)] px-6 py-3.5 text-sm font-bold text-[var(--tl-hero-btn-outline-fg)] backdrop-blur-sm transition hover:brightness-95"
            >
              تسجيل دخول
            </TenantAppLink>
          </motion.div>
        ) : null}

        {whatsappHref ? (
          <motion.a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--tl-hero-wa-border)] bg-[var(--tl-hero-wa-bg)] px-5 py-3.5 text-sm font-bold text-[var(--tl-hero-wa-fg)] transition hover:brightness-95 sm:w-auto"
            whileHover={reduceMotion ? undefined : { y: -3 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <FaWhatsapp className="text-lg text-[#25D366]" />
            واتساب
          </motion.a>
        ) : null}
      </div>

      {showFreeVideos ? (
        <motion.a
          href="#videos"
          className="group inline-flex items-center gap-3 self-start text-sm font-semibold text-[var(--tl-hero-muted)] transition hover:text-[var(--tl-hero-fg)]"
          whileHover={reduceMotion ? undefined : { x: -3 }}
        >
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--tl-hero-chip-border)] bg-[var(--tl-hero-chip-bg)]">
            {!reduceMotion ? (
              <motion.span
                className="absolute inset-0 rounded-full border border-[#3182CE]/40"
                animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            ) : null}
            <FaPlay className="mr-[-1px] text-[11px]" style={{ color: BLUE_500 }} />
          </span>
          شاهد محاضرة مجانية
        </motion.a>
      ) : null}
    </div>
  );
}

function HeroStatsRow({ stats }) {
  if (!stats?.length) return null;
  return (
    <div className="mt-8 grid grid-cols-3 gap-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon || FaGraduationCap;
        return (
          <motion.div
            key={`${stat.label}-${i}`}
            className="rounded-2xl border border-[color:var(--tl-hero-stat-border)] bg-[var(--tl-hero-stat-bg)] px-2.5 py-3 text-center shadow-sm backdrop-blur-sm sm:px-3 sm:text-right"
            style={{
              boxShadow: i === 0 ? `inset 0 0 0 1px rgba(49,130,206,0.12), 0 8px 24px -16px ${BLUE_500}66` : undefined,
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.45, ease: EASE }}
          >
            <div className="mb-1 flex items-center justify-center gap-1.5 sm:justify-start">
              <Icon
                className="text-[10px] opacity-80"
                style={{ color: "var(--tl-hero-accent)" }}
                aria-hidden
              />
              <span className="font-heading text-base font-bold tracking-tight text-[var(--tl-hero-fg)] sm:text-lg">
                {stat.value}
              </span>
            </div>
            <p className="text-[10px] font-medium text-[var(--tl-hero-muted)] sm:text-[11px]">
              {stat.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

function HeroCopy({
  specialty,
  teacherName,
  heroTitle,
  tagline,
  signupHref,
  loginHref,
  whatsappHref,
  showFreeVideos,
  stats,
  compact = false,
}) {
  const brand = (teacherName && teacherName.trim()) || "المدرّس";
  const customTitle = heroTitle?.trim() || "";
  const showCustomTitle = Boolean(customTitle) && customTitle !== brand;
  const supportLine = showCustomTitle
    ? customTitle
    : specialty
      ? `احترف ${specialty}`
      : "";
  const lead =
    (tagline && String(tagline).trim()) ||
    (specialty
      ? `شرح منظم ومتابعة مستمرة في ${specialty} حتى تحقق أفضل نتيجة.`
      : "شرح منظم ومتابعة مستمرة تساعدك تحقق أفضل النتائج.");

  const subjectKey = detectSubjectKey(specialty);
  const PrimaryIcon = (SUBJECT_ICONS[subjectKey] || SUBJECT_ICONS.general)[0];

  return (
    <HeroStagger>
      {specialty ? (
        <HeroStaggerItem>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--tl-hero-chip-border)] bg-[var(--tl-hero-chip-bg)] px-3.5 py-1.5 backdrop-blur-md">
            <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ color: BLUE_500 }}>
              <PrimaryIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold text-[var(--tl-hero-chip-fg)] sm:text-sm">
              {specialty}
            </span>
          </div>
        </HeroStaggerItem>
      ) : null}

      <HeroStaggerItem>
        <h1
          className={`font-heading font-bold tracking-tight text-[var(--tl-hero-fg)] ${
            compact
              ? "text-[2.05rem] leading-[1.22] sm:text-[2.45rem]"
              : "text-[2.35rem] leading-[1.15] sm:text-[3rem] lg:text-[3.55rem] lg:leading-[1.1]"
          }`}
        >
          {brand}
        </h1>
        {supportLine ? (
          <p
            className={`mt-2.5 font-heading font-semibold ${
              compact ? "text-base leading-7 sm:text-lg" : "text-lg leading-8 sm:text-xl lg:text-[1.65rem]"
            }`}
            style={{
              background: `linear-gradient(90deg, var(--tl-hero-support-from) 0%, ${BLUE_500} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {supportLine}
          </p>
        ) : null}

        <motion.span
          className="mt-4 block h-[3px] w-16 rounded-full"
          style={{ background: `linear-gradient(90deg, ${BLUE_500}, #63B3ED)`, originX: 1 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
          aria-hidden
        />
      </HeroStaggerItem>

      <HeroStaggerItem className={compact ? "mt-4" : "mt-5"}>
        <p
          className={`max-w-lg text-[var(--tl-hero-muted)] ${
            compact
              ? "text-[0.925rem] leading-7"
              : "text-base leading-8 sm:text-[1.05rem]"
          }`}
        >
          {lead}
        </p>
      </HeroStaggerItem>

      <HeroStaggerItem className={compact ? "mt-6" : "mt-7 sm:mt-8"}>
        <HeroActions
          signupHref={signupHref}
          loginHref={loginHref}
          whatsappHref={whatsappHref}
          showFreeVideos={showFreeVideos}
        />
      </HeroStaggerItem>

      <HeroStaggerItem>
        <HeroStatsRow stats={stats} />
      </HeroStaggerItem>
    </HeroStagger>
  );
}

/* ─── Main ──────────────────────────────────────────────────── */

export default function TenantProHero({
  specialty,
  teacherName,
  heroTitle,
  bioText: _bioText,
  tagline,
  highlights: _highlights = [],
  signupHref,
  loginHref,
  whatsappHref,
  showFreeVideos = true,
  teacherImageUrl,
  stats = [],
}) {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktop(1024);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 36]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -10]);

  const copyProps = useMemo(
    () => ({
      specialty,
      teacherName,
      heroTitle,
      tagline,
      signupHref,
      loginHref,
      whatsappHref,
      showFreeVideos,
      stats,
    }),
    [specialty, teacherName, heroTitle, tagline, signupHref, loginHref, whatsappHref, showFreeVideos, stats],
  );

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate overflow-hidden"
      dir="rtl"
      style={{ background: "var(--tl-hero-bg)" }}
    >
      <SubjectBackdrop specialty={specialty} reduceMotion={reduceMotion} />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-20"
        style={{ background: "linear-gradient(to top, var(--tl-page-bg), transparent)" }}
        aria-hidden
      />

      {!isDesktop ? (
        <div className="relative z-[2] pb-10 pt-32 sm:pt-28">
          <motion.div className={`relative ${tlContainer}`} style={{ y: imgY }}>
            <TeacherHeroAvatar
              src={teacherImageUrl}
              alt={teacherName}
              specialty={specialty}
              reduceMotion={reduceMotion}
              sizeClass="h-[260px] w-[260px] sm:h-[300px] sm:w-[300px]"
            />
          </motion.div>

          <motion.div className={`relative z-[2] mt-10 ${tlContainer}`} style={{ y: copyY }}>
            <HeroCopy {...copyProps} compact />
          </motion.div>
        </div>
      ) : (
        <div className={`${tlContainer} relative z-[2] grid min-h-[min(90vh,760px)] items-center gap-10 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 xl:gap-12`}>
          <motion.div className="relative max-w-xl" style={{ y: copyY }}>
            <HeroCopy {...copyProps} />
          </motion.div>

          <motion.div className="relative flex w-full justify-center lg:justify-end" style={{ y: imgY }}>
            <TeacherHeroAvatar
              src={teacherImageUrl}
              alt={teacherName}
              specialty={specialty}
              reduceMotion={reduceMotion}
              sizeClass="h-[360px] w-[360px] xl:h-[420px] xl:w-[420px]"
            />
          </motion.div>
        </div>
      )}
    </section>
  );
}
