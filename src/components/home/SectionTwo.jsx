import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useColorModeValue } from "@chakra-ui/react";
import {
  FaGlobe,
  FaFileAlt,
  FaClipboardCheck,
  FaUserFriends,
  FaChartLine,
  FaVideo,
  FaClipboardList,
  FaCogs,
  FaRobot,
  FaHeadset,
  FaCheck,
} from "react-icons/fa";
import { landingFont } from "./landingTheme.js";
import { DotGrid } from "./landingDecor.jsx";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";

const features = [
  {
    id: 1,
    name: "منصة خاصة بيك",
    description:
      "منصتك باسمك وهويتك — تبني براند قوي لنفسك قدام الطلاب وأولياء الأمور، وتبقى وجهتك التعليمية الرسمية.",
    icon: FaGlobe,
    accent: BLUE,
    tag: "براند قوي",
    points: ["هوية باسمك", "حضور احترافي", "ثقة أعلى"],
  },
  {
    id: 2,
    name: "بنك الأسئلة",
    description:
      "خزّن أسئلتك مرة واحدة واستخدمها في أي امتحان أو كويز بضغطة — وفّر ساعات من التحضير.",
    icon: FaFileAlt,
    accent: ORANGE,
    tag: "مكتبة جاهزة",
    points: ["تصنيف ذكي", "إعادة استخدام", "توفير وقت"],
  },
  {
    id: 3,
    name: "إدارة السنتر والحضور",
    description:
      "سيستم متكامل لإدارة السنتر ومتابعة الحضور والغياب بسهولة — تنظيم يومي بدون ورق أو فوضى.",
    icon: FaClipboardCheck,
    accent: BLUE,
    tag: "تنظيم يومي",
    points: ["حضور وغياب", "إدارة السنتر", "سجل واضح"],
  },
  {
    id: 4,
    name: "متابعة تلقائية لولي الأمر",
    description:
      "ولي الأمر دايمًا على اطلاع — بنبعت تقرير أسبوعي أوتوماتيك بمستوى الطالب وحضوره وتقدمه.",
    icon: FaUserFriends,
    accent: ORANGE,
    tag: "تقرير أسبوعي",
    points: ["تقرير أسبوعي", "شفافية كاملة", "ثقة الأهالي"],
  },
  {
    id: 5,
    name: "محلل بيانات الطلاب",
    description:
      "محلل بيانات بيساعدك تفهم مستوى طلابك بوضوح — نقاط القوة والضعف، وتاخد قرارات مبنية على أرقام.",
    icon: FaChartLine,
    accent: BLUE,
    tag: "رؤية تحليلية",
    points: ["نقاط القوة", "نقاط الضعف", "قرارات أدق"],
  },
  {
    id: 6,
    name: "محاضرات مسجلة ولايف",
    description:
      "ارفع محاضرات مسجلة أو اعمل لايف يتم تسجيله وحفظه تلقائيًا — المحتوى يفضل متاح للطالب في أي وقت.",
    icon: FaVideo,
    accent: ORANGE,
    tag: "محتوى دائم",
    points: ["لايف مباشر", "تسجيل وحفظ", "مشاهدة لاحقًا"],
  },
  {
    id: 7,
    name: "نظام الاختبارات",
    description:
      "امتحانات بتوقيت تلقائي وتصحيح فوري — تجربة احترافية للطالب ونتائج واضحة ليك في لحظتها.",
    icon: FaClipboardList,
    accent: BLUE,
    tag: "تصحيح آلي",
    points: ["مؤقت ذكي", "تصحيح فوري", "نتائج سريعة"],
  },
  {
    id: 8,
    name: "إدارة ذكية للمنصة",
    description:
      "نظام إدارة ذكي يخلّي تشغيل منصتك أسهل — تحكم في الطلاب والمحتوى والإعدادات من مكان واحد.",
    icon: FaCogs,
    accent: ORANGE,
    tag: "تحكم كامل",
    points: ["لوحة واحدة", "إعدادات مرنة", "تشغيل أسهل"],
  },
  {
    id: 9,
    name: "مساعد AI للسوشيال",
    description:
      "مساعد ذكاء اصطناعي يساعدك تبني صفحة سوشيال قوية جدًا — محتوى، أفكار، وصياغة تخلي براندك يلفت الانتباه.",
    icon: FaRobot,
    accent: BLUE,
    tag: "سوشيال قوي",
    points: ["أفكار محتوى", "صياغة احترافية", "براند أقوى"],
  },
  {
    id: 10,
    name: "دعم فني 24/7",
    description:
      "فريق دعم فني متاح على مدار الساعة — أي مشكلة أو استفسار، هنكون معاك في أي وقت بدون انتظار.",
    icon: FaHeadset,
    accent: ORANGE,
    tag: "متاح دائمًا",
    points: ["دعم فوري", "على مدار الساعة", "استجابة سريعة"],
  },
];

const AUTO_PLAY_MS = 5000;

function DetailPanel({ feature, index, isLight }) {
  const Icon = feature.icon;
  const title = isLight ? "#0f172a" : "#ffffff";
  const muted = isLight ? "#64748b" : "#94a3b8";
  const surface = isLight ? "#ffffff" : "rgba(12, 24, 44, 0.9)";
  const border = isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.09)";
  const pointBg = isLight ? "rgba(15,23,42,0.03)" : "rgba(255,255,255,0.04)";

  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={feature.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border p-5 sm:p-7 lg:p-8"
        style={{
          background: surface,
          borderColor: border,
          boxShadow: isLight
            ? "0 20px 48px -28px rgba(15,23,42,0.18)"
            : "0 24px 48px -24px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${BLUE}, ${ORANGE})`,
          }}
        />
        <div
          className="pointer-events-none absolute -left-8 top-8 select-none text-[7rem] font-black leading-none sm:text-[8.5rem]"
          style={{ color: feature.accent, opacity: isLight ? 0.05 : 0.07 }}
          aria-hidden
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3 sm:mb-5">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white sm:h-14 sm:w-14 sm:rounded-2xl"
              style={{
                background: feature.accent,
                boxShadow: `0 12px 28px ${feature.accent}40`,
              }}
            >
              <Icon className="text-lg sm:text-xl" />
            </div>
            <div className="min-w-0">
              <span
                className="mb-1 inline-block text-[11px] font-bold"
                style={{ color: feature.accent }}
              >
                {feature.tag}
              </span>
              <h3
                className="text-xl font-extrabold leading-snug sm:text-2xl lg:text-[1.75rem]"
                style={{ color: title }}
              >
                {feature.name}
              </h3>
            </div>
          </div>

          <p
            className="mb-5 text-sm leading-7 sm:mb-6 sm:text-[15px] sm:leading-8"
            style={{ color: muted }}
          >
            {feature.description}
          </p>

          <ul className="grid gap-2 sm:grid-cols-3 sm:gap-2.5">
            {feature.points.map((point) => (
              <li
                key={point}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-bold sm:text-[13px]"
                style={{ background: pointBg, color: title }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${feature.accent}18`, color: feature.accent }}
                >
                  <FaCheck className="text-[9px]" />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <div
            className="mt-5 h-[3px] overflow-hidden rounded-full sm:mt-6"
            style={{
              background: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.08)",
            }}
          >
            <motion.div
              key={`bar-${feature.id}`}
              className="h-full rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: AUTO_PLAY_MS / 1000, ease: "linear" }}
              style={{ background: `linear-gradient(90deg, ${BLUE}, ${ORANGE})` }}
            />
          </div>
        </div>
      </motion.article>
    </AnimatePresence>
  );
}

const SectionTwo = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const chipRefs = useRef([]);

  const isLight = useColorModeValue(true, false);
  const pageBg = useColorModeValue("#F7FAFC", "#0a1628");
  const titleColor = useColorModeValue("#0f172a", "#ffffff");
  const mutedText = useColorModeValue("#64748b", "#94a3b8");
  const badgeBorder = useColorModeValue("rgba(221,107,32,0.3)", "rgba(221,107,32,0.4)");
  const badgeBg = useColorModeValue("rgba(221,107,32,0.08)", "rgba(221,107,32,0.12)");
  const badgeColor = useColorModeValue("#C05621", "#F6AD55");
  const railBg = useColorModeValue("#ffffff", "rgba(12, 24, 44, 0.85)");
  const railBorder = useColorModeValue("rgba(15,23,42,0.08)", "rgba(255,255,255,0.09)");
  const idleText = useColorModeValue("#475569", "#94a3b8");
  const idleIconBg = useColorModeValue("rgba(15,23,42,0.05)", "rgba(255,255,255,0.06)");
  const chipIdleBg = useColorModeValue("#ffffff", "rgba(255,255,255,0.05)");
  const chipIdleBorder = useColorModeValue("rgba(15,23,42,0.1)", "rgba(255,255,255,0.1)");

  const goNext = useCallback(() => {
    setActive((i) => (i + 1) % features.length);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(goNext, AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, goNext, active]);

  useEffect(() => {
    const el = chipRefs.current[active];
    if (el?.scrollIntoView) {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [active]);

  return (
    <section
      id="teacher-features"
      dir="rtl"
      className="relative overflow-hidden py-14 sm:py-20 lg:py-24"
      style={{ ...landingFont, background: pageBg }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-20 right-[-12%] h-[300px] w-[300px] rounded-full blur-[100px]"
          style={{ background: `${BLUE}${isLight ? "1A" : "28"}` }}
        />
        <div
          className="absolute bottom-[-8%] left-[-10%] h-[260px] w-[260px] rounded-full blur-[90px]"
          style={{ background: `${ORANGE}${isLight ? "14" : "1C"}` }}
        />
      </div>
      <DotGrid dark={!isLight} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header — مضغوط خاصة على الموبايل */}
        <motion.header
          className="mb-6 flex flex-col items-center gap-3 text-center sm:mb-8 sm:gap-4 md:mb-10 md:flex-row md:items-center md:gap-5 md:text-right"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <div className="relative shrink-0">
            <span
              className="absolute left-1/2 top-1/2 h-[108%] w-[108%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-xl"
              style={{
                background: `radial-gradient(circle, ${ORANGE}36 0%, ${BLUE}24 55%, transparent 72%)`,
              }}
              aria-hidden
            />
            <div className="relative z-[1] h-[88px] w-[88px] overflow-hidden rounded-full sm:h-[112px] sm:w-[112px] md:h-[124px] md:w-[124px]">
              <img
                src="/images/section-two-thinking.png"
                alt=""
                className="h-full w-full scale-[1.08] object-cover object-center"
                loading="eager"
              />
            </div>
          </div>

          <div className="min-w-0 max-w-xl">
            <span
              className="mb-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold sm:mb-2 sm:text-[11px]"
              style={{
                borderColor: badgeBorder,
                background: badgeBg,
                color: badgeColor,
              }}
            >
              مستعد تتفاجئ؟
            </span>
            <h2
              className="text-lg font-extrabold leading-snug sm:text-xl md:text-2xl"
              style={{ color: titleColor }}
            >
              هنقدملك إيه يا مستر{" "}
              <span style={{ color: ORANGE }}>داخل المنصة؟</span>
            </h2>
            <p
              className="mx-auto mt-1.5 max-w-md text-[13px] leading-6 sm:mt-2 sm:text-sm sm:leading-7 md:mx-0"
              style={{ color: mutedText }}
            >
              أدوات قوية هتخلي شغلك أسهل وأسرع — اختار أي ميزة واستكشفها بنفسك
            </p>
          </div>
        </motion.header>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
        >
          {/* موبايل: شريط اختيار أفقي */}
          <div className="mb-4 lg:hidden">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
              {features.map((item, i) => {
                const Icon = item.icon;
                const isActive = active === i;
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      chipRefs.current[i] = el;
                    }}
                    type="button"
                    onClick={() => setActive(i)}
                    className="flex shrink-0 snap-center items-center gap-2 rounded-full border px-3.5 py-2 transition-colors"
                    style={{
                      borderColor: isActive ? `${item.accent}66` : chipIdleBorder,
                      background: isActive ? `${item.accent}14` : chipIdleBg,
                      color: isActive ? titleColor : idleText,
                      boxShadow: isActive
                        ? `0 8px 20px -12px ${item.accent}88`
                        : "none",
                    }}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                      style={{ background: isActive ? item.accent : idleIconBg, color: isActive ? "#fff" : idleText }}
                    >
                      <Icon className="text-[11px]" />
                    </span>
                    <span className="whitespace-nowrap text-[12px] font-bold">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* المحتوى */}
          <div className="grid gap-4 lg:grid-cols-[240px_1fr] lg:gap-5 xl:grid-cols-[260px_1fr]">
            {/* ديسكتوب: قائمة جانبية */}
            <nav
              className="hidden overflow-hidden rounded-2xl border p-2 lg:block"
              style={{ background: railBg, borderColor: railBorder }}
              aria-label="قائمة الخدمات"
            >
              {features.map((item, i) => {
                const Icon = item.icon;
                const isActive = active === i;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(i)}
                    className="relative mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right last:mb-0"
                    style={{
                      background: isActive
                        ? isLight
                          ? `${item.accent}12`
                          : `${item.accent}1A`
                        : "transparent",
                      color: isActive ? titleColor : idleText,
                    }}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="featureRailActive"
                        className="absolute inset-y-1 right-0 w-[3px] rounded-full"
                        style={{ background: item.accent }}
                      />
                    ) : null}
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: isActive ? item.accent : idleIconBg,
                        color: isActive ? "#fff" : idleText,
                      }}
                    >
                      <Icon className="text-sm" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                      {item.name}
                    </span>
                    <span
                      className="text-[10px] font-black tabular-nums"
                      style={{
                        color: isActive ? item.accent : isLight ? "#cbd5e1" : "#475569",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </button>
                );
              })}
            </nav>

            <DetailPanel
              feature={features[active]}
              index={active}
              isLight={isLight}
            />
          </div>

          {/* نقاط الموبايل */}
          <div className="mt-4 flex items-center justify-center gap-1.5 lg:hidden">
            {features.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={item.name}
                onClick={() => setActive(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: active === i ? 22 : 6,
                  background:
                    active === i
                      ? `linear-gradient(90deg, ${BLUE}, ${ORANGE})`
                      : isLight
                        ? "rgba(15,23,42,0.15)"
                        : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionTwo;
