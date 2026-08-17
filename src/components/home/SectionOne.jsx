import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { useColorModeValue } from "@chakra-ui/react";
import {
  FaGraduationCap,
  FaBookOpen,
  FaChalkboardTeacher,
  FaLaptop,
  FaUserGraduate,
  FaAward,
  FaLightbulb,
  FaPencilAlt,
} from "react-icons/fa";
import { landingFont } from "./landingTheme.js";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";
const HERO_IMAGE = "/images/section-one-hero.png";
const BG_ICONS = [
  { Icon: FaGraduationCap, className: "right-[4%] top-[18%]", size: "text-3xl", tone: "blue", delay: 0 },
  { Icon: FaBookOpen, className: "left-[5%] top-[22%]", size: "text-2xl", tone: "orange", delay: 0.4 },
  { Icon: FaLightbulb, className: "right-[8%] bottom-[28%]", size: "text-2xl", tone: "orange", delay: 0.8 },
  { Icon: FaChalkboardTeacher, className: "left-[7%] bottom-[24%]", size: "text-3xl", tone: "blue", delay: 1.2 },
  { Icon: FaLaptop, className: "right-[28%] top-[12%]", size: "text-xl", tone: "blue", delay: 0.2 },
  { Icon: FaPencilAlt, className: "left-[30%] bottom-[16%]", size: "text-xl", tone: "orange", delay: 0.6 },
];

const STATS = [
  { value: 200, suffix: "+", label: "محاضر", accent: BLUE, Icon: FaChalkboardTeacher },
  { value: 20000, suffix: "+", label: "طالب", accent: ORANGE, Icon: FaUserGraduate, format: "compact" },
  { value: 500, suffix: "+", label: "مؤسسة", accent: BLUE, Icon: FaGraduationCap },
  { value: 100, suffix: "K+", label: "اختبار", accent: ORANGE, Icon: FaAward },
];

const FEATURE_CHIPS = [
  { label: "محاضرات", color: BLUE },
  { label: "امتحانات", color: ORANGE },
  { label: "حضور", color: BLUE },
  { label: "أولياء الأمور", color: ORANGE },
];

function formatStat(value, format) {
  if (format === "compact" && value >= 1000) {
    const thousands = value / 1000;
    return Number.isInteger(thousands)
      ? `${thousands} ألف`
      : `${thousands.toFixed(1)} ألف`;
  }
  return value.toLocaleString("ar-EG");
}

function AnimatedStatValue({ value, suffix = "", format, active }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 24 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!active) return undefined;
    motionValue.set(0);
    const timeout = window.setTimeout(() => motionValue.set(value), 60);
    return () => window.clearTimeout(timeout);
  }, [active, value, motionValue]);

  useEffect(() => {
    const unsub = spring.on("change", (latest) => {
      setDisplay(formatStat(Math.round(latest), format));
    });
    return unsub;
  }, [spring, format]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

function EduIcons({ isLight }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {BG_ICONS.map(({ Icon, className, size, tone, delay }, i) => {
        const color = tone === "orange" ? ORANGE : BLUE;
        return (
          <motion.span
            key={i}
            className={`absolute hidden ${className} ${size} md:block`}
            style={{ color, opacity: isLight ? 0.14 : 0.16 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: isLight ? 0.14 : 0.16,
              y: [0, i % 2 === 0 ? -7 : 7, 0],
            }}
            transition={{
              opacity: { duration: 0.6, delay: delay * 0.3 },
              y: {
                duration: 5.5 + i * 0.35,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              },
            }}
          >
            <Icon />
          </motion.span>
        );
      })}
    </div>
  );
}

function StatsStrip({ isLight, titleColor, mutedText }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="mt-9 sm:mt-10"
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {STATS.map(({ value, suffix, label, format, accent, Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.06 * i }}
            whileHover={{ y: -3 }}
            className="rounded-xl border px-3 py-3.5 sm:px-3.5 sm:py-4"
            style={{
              borderColor: isLight ? `${accent}28` : "rgba(255,255,255,0.1)",
              background: cardBg,
              boxShadow: isLight ? `0 8px 22px -16px ${accent}55` : "none",
            }}
          >
            <div
              className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: `${accent}18`, color: accent }}
            >
              <Icon className="text-[11px]" />
            </div>
            <p
              className="text-xl font-extrabold tracking-tight sm:text-2xl"
              style={{ color: titleColor }}
            >
              <AnimatedStatValue
                value={value}
                suffix={suffix === "K+" ? "" : suffix}
                format={format}
                active={inView}
              />
              {suffix === "K+" ? (
                <span style={{ color: accent }}>K+</span>
              ) : null}
            </p>
            <p
              className="mt-0.5 text-[11px] font-semibold sm:text-[12px]"
              style={{ color: mutedText }}
            >
              {label}
            </p>
            <div
              className="mt-2.5 h-[2px] w-8 rounded-full"
              style={{ background: accent }}
              aria-hidden
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function HeroIllustrationFrame({ isLight }) {
  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
      <motion.div
        className="pointer-events-none absolute -inset-4 rounded-[1.75rem] opacity-70 blur-2xl"
        style={{
          background: `radial-gradient(circle at 40% 40%, ${BLUE}40, ${ORANGE}28 52%, transparent 70%)`,
        }}
        animate={{ opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-xl border sm:rounded-2xl"
        style={{
          borderColor: isLight ? `${BLUE}33` : `${BLUE}44`,
          background: isLight ? "#ffffff" : "#0b1220",
          boxShadow: isLight
            ? `0 22px 48px -22px ${BLUE}55`
            : `0 24px 52px -20px rgba(0,0,0,0.55)`,
        }}
      >
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/11]">
          <img
            src={HERO_IMAGE}
            alt="معلّم يفكر في حلول تعليمية — منصة EM Lectures"
            className="h-full w-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
            draggable={false}
          />
        </div>
      </motion.div>
    </div>
  );
}

const SectionOne = () => {
  const isLight = useColorModeValue(true, false);
  const pageBg = useColorModeValue("#F8FAFC", "#0a1628");
  const titleColor = useColorModeValue("#0f172a", "#ffffff");
  const mutedText = useColorModeValue("#64748b", "#94a3b8");
  const secondaryBtnBg = useColorModeValue("#ffffff", "rgba(255,255,255,0.04)");
  const chipBg = useColorModeValue("rgba(255,255,255,0.9)", "rgba(255,255,255,0.05)");

  return (
    <section
      dir="rtl"
      className="relative flex min-h-[calc(100svh-72px)] items-center overflow-hidden transition-colors duration-300"
      style={{ ...landingFont, background: pageBg }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-28 right-[-8%] h-[420px] w-[420px] rounded-full blur-[110px]"
          style={{ background: `${BLUE}${isLight ? "22" : "30"}` }}
        />
        <div
          className="absolute bottom-[-12%] left-[-6%] h-[340px] w-[340px] rounded-full blur-[100px]"
          style={{ background: `${ORANGE}${isLight ? "18" : "22"}` }}
        />
      </div>
      <EduIcons isLight={isLight} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-16">
          <div className="order-1 max-w-xl lg:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold sm:text-[12px]"
              style={{
                borderColor: `${ORANGE}55`,
                background: chipBg,
                color: titleColor,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: ORANGE }}
              />
              منصة إدارة تعليمية للمدرسين والمؤسسات
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="mb-4 text-[1.85rem] font-extrabold leading-[1.35] sm:text-[2.35rem] lg:text-[2.65rem] lg:leading-[1.28]"
              style={{ color: titleColor }}
            >
              امتلك منظومتك التعليمية{" "}
              <span style={{ color: BLUE }}>المتكاملة</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-5 max-w-md text-[14px] leading-7 sm:text-[15px] sm:leading-8"
              style={{ color: mutedText }}
            >
              محاضرات، امتحانات، حضور، ومتابعة أولياء الأمور — كل أدواتك في
              منصة واحدة باسمك، من رياض الأطفال حتى الجامعات.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.14 }}
              className="mb-6 flex flex-wrap gap-2"
            >
              {FEATURE_CHIPS.map((chip, i) => (
                <motion.span
                  key={chip.label}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.16 + i * 0.05 }}
                  className="rounded-full px-3 py-1 text-[11px] font-bold sm:text-[12px]"
                  style={{
                    color: chip.color,
                    background: `${chip.color}14`,
                    border: `1px solid ${chip.color}33`,
                  }}
                >
                  {chip.label}
                </motion.span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
            >
              <Link to="/create-platform" className="w-full sm:w-auto">
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white sm:w-auto sm:min-w-[172px]"
                  style={{
                    background: BLUE,
                    boxShadow: `0 14px 28px -10px ${BLUE}77`,
                  }}
                >
                  ابدأ مجانًا
                  <span aria-hidden>←</span>
                </motion.button>
              </Link>

              <a href="#hero-visual" className="w-full sm:w-auto">
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border px-5 py-3.5 text-sm font-bold sm:w-auto"
                  style={{
                    borderColor: `${ORANGE}66`,
                    background: secondaryBtnBg,
                    color: titleColor,
                  }}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: `${ORANGE}22`, color: ORANGE }}
                  >
                    <FaLightbulb className="text-[10px]" />
                  </span>
                  اكتشف المنصة
                </motion.button>
              </a>            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.24 }}
              className="mt-4 text-[12px] sm:text-[13px]"
              style={{ color: mutedText }}
            >
              تجربة مجانية ١٤ يوم — بدون بطاقة ائتمان
            </motion.p>

            <StatsStrip
              isLight={isLight}
              titleColor={titleColor}
              mutedText={mutedText}
            />
          </div>

          <motion.div
            id="hero-visual"
            className="order-2 w-full scroll-mt-28 lg:justify-self-end"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            <HeroIllustrationFrame isLight={isLight} />
          </motion.div>        </div>
      </div>
    </section>
  );
};

export default SectionOne;
