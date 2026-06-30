import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaFileAlt,
  FaClipboardList,
  FaBookOpen,
  FaBell,
  FaMobileAlt,
  FaChartBar,
  FaCreditCard,
} from "react-icons/fa";
import { BRAND, landingFont } from "./landingTheme.js";
import { DotGrid, MeshGlow } from "./landingDecor.jsx";

const features = [
  {
    id: 1,
    name: "إدارة الطلاب",
    description:
      "لوحة ذكية لمتابعة الحضور والنتائج وتقدم كل طالب — كل البيانات في مكان واحد واضح.",
    icon: FaUsers,
    gradient: "from-blue-500 to-cyan-400",
    accent: "#22d3ee",
    stat: "تتبع لحظي",
  },
  {
    id: 2,
    name: "بنك الأسئلة",
    description:
      "خزّن أسئلتك مرة واحدة واستخدمها في أي امتحان أو كويز بضغطة — وفّر ساعات من التحضير.",
    icon: FaFileAlt,
    gradient: "from-emerald-500 to-teal-400",
    accent: "#34d399",
    stat: "إعادة استخدام",
  },
  {
    id: 3,
    name: "نظام الاختبارات",
    description:
      "امتحانات بتوقيت تلقائي وتصحيح فوري — تجربة احترافية للطالب ونتائج فورية لك.",
    icon: FaClipboardList,
    gradient: "from-violet-500 to-purple-500",
    accent: "#a78bfa",
    stat: "تصحيح آلي",
  },
  {
    id: 4,
    name: "إدارة الدورات",
    description:
      "ارفع الدروس المرئية والمكتوبة ونظّمها في مسارات تعليمية جذابة ومنظمة.",
    icon: FaBookOpen,
    gradient: "from-amber-500 to-orange-400",
    accent: "#fbbf24",
    stat: "محتوى منظم",
  },
  {
    id: 5,
    name: "تنبيهات فورية",
    description:
      "أبلغ طلابك بلحظة عن الدروس والامتحانات والنتائج — تواصل مستمر بلا مجهود.",
    icon: FaBell,
    gradient: "from-rose-500 to-pink-500",
    accent: "#fb7185",
    stat: "إشعار لحظي",
  },
  {
    id: 6,
    name: "تطبيق موبايل",
    description:
      "تطبيق مخصص لطلابك يتابعون منه المحتوى والامتحانات من أي مكان وفي أي وقت.",
    icon: FaMobileAlt,
    gradient: "from-cyan-500 to-sky-400",
    accent: "#38bdf8",
    stat: "تعلم متنقل",
  },
  {
    id: 7,
    name: "تقارير متقدمة",
    description:
      "تحليلات تفصيلية لأداء الطلاب ونمو منصتك — قرارات مبنية على أرقام حقيقية.",
    icon: FaChartBar,
    gradient: "from-indigo-500 to-blue-500",
    accent: "#818cf8",
    stat: "رؤية تحليلية",
  },
  {
    id: 8,
    name: "المدفوعات",
    description:
      "تحصيل الرسوم عبر بوابات محلية ودولية بأمان وسلاسة — أرباحك تصلك بسهولة.",
    icon: FaCreditCard,
    gradient: "from-slate-500 to-slate-700",
    accent: "#94a3b8",
    stat: "دفع آمن",
  },
];

const AUTO_PLAY_MS = 4500;

function FeatureSpotlight({ feature, index }) {
  const Icon = feature.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={feature.id}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-8 sm:min-h-[380px] sm:p-10"
      >
        {/* خلفية ديناميكية */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-[0.12]`}
        />
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: `${feature.accent}33` }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: `${feature.accent}22` }}
        />

        {/* رقم ضخم خلفي */}
        <span
          className="pointer-events-none absolute left-6 top-4 select-none text-[8rem] font-black leading-none opacity-[0.04] sm:text-[10rem]"
          style={{ color: feature.accent }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative z-10">
          <div className="mb-6 flex items-start justify-between gap-4">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-2xl`}
              style={{ boxShadow: `0 20px 40px ${feature.accent}40` }}
            >
              <Icon className="text-2xl" />
            </motion.div>
            <span
              className="rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-sm"
              style={{
                borderColor: `${feature.accent}44`,
                color: feature.accent,
                backgroundColor: `${feature.accent}15`,
              }}
            >
              {feature.stat}
            </span>
          </div>

          <h3 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">
            {feature.name}
          </h3>
          <p className="max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
            {feature.description}
          </p>
        </div>

        {/* شريط تقدم زخرفي */}
        <div className="relative z-10 mt-8">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-l ${feature.gradient}`}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: AUTO_PLAY_MS / 1000, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

const SectionTwo = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goNext = useCallback(() => {
    setActive((i) => (i + 1) % features.length);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(goNext, AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, goNext, active]);

  return (
    <section
      id="teacher-features"
      dir="rtl"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
      style={{ ...landingFont, background: BRAND.navy }}
    >
      <MeshGlow />
      <DotGrid dark />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-cyan-400/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* الهيدر */}
        <motion.div
          className="mb-12 text-center sm:mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            منظومة تشغيل متكاملة
          </span>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            أدواتك في
            <span className="mt-1 block bg-gradient-to-l from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              مسرح واحد تفاعلي
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400 sm:text-lg">
            اختر أي أداة واستكشفها — 8 قدرات تعمل معاً لبناء منصتك التعليمية.
          </p>
        </motion.div>

        <div
          className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* شريط الأدوات — عمودي على الديسكتوب */}
          <div className="flex flex-col gap-2">
            <p className="mb-2 hidden text-xs font-semibold uppercase tracking-widest text-slate-500 lg:block">
              اختر الأداة
            </p>

            {/* موبايل: scroll أفقي */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {features.map((item, i) => {
                const Icon = item.icon;
                const isActive = active === i;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`flex shrink-0 flex-col items-center gap-2 rounded-2xl border px-4 py-3 transition-all ${
                      isActive
                        ? "border-cyan-400/40 bg-white/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white`}
                    >
                      <Icon className="text-sm" />
                    </div>
                    <span className="whitespace-nowrap text-[11px] font-semibold text-slate-300">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ديسكتوب: قائمة تفاعلية */}
            <div className="hidden space-y-1.5 lg:block">
              {features.map((item, i) => {
                const Icon = item.icon;
                const isActive = active === i;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(i)}
                    whileHover={{ x: -4 }}
                    className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 text-right transition-all duration-300 ${
                      isActive
                        ? "border-cyan-400/30 bg-white/10 shadow-lg shadow-cyan-500/10"
                        : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    {isActive ? (
                      <motion.div
                        layoutId="activeFeatureBar"
                        className={`absolute right-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b ${item.gradient}`}
                      />
                    ) : null}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                        isActive
                          ? `bg-gradient-to-br ${item.gradient} text-white shadow-md`
                          : "bg-white/10 text-slate-400 group-hover:bg-white/15"
                      }`}
                    >
                      <Icon className="text-sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-bold ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      >
                        {item.name}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-slate-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* لوحة العرض الكبيرة */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-3 rounded-[2rem] opacity-30 blur-2xl transition-colors duration-500"
              style={{ backgroundColor: `${features[active].accent}44` }}
            />
            <FeatureSpotlight feature={features[active]} index={active} />
          </div>
        </div>

        {/* نقاط التنقل */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {features.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={item.name}
              className={`h-2 rounded-full transition-all duration-300 ${
                active === i ? "w-8 bg-cyan-400" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionTwo;
