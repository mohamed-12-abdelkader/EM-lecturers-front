import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useColorModeValue } from "@chakra-ui/react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSeedling,
  FaChartLine,
  FaStar,
  FaCrown,
  FaArrowLeft,
  FaBolt,
  FaUser,
  FaBuilding,
  FaChalkboardTeacher,
  FaUserGraduate,
} from "react-icons/fa";
import { landingFont } from "./landingTheme.js";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";

const featureCatalog = [
  { id: "support", label: "دعم فني" },
  { id: "courses", label: "إدارة الكورسات" },
  { id: "bank", label: "بنك أسئلة" },
  { id: "live", label: "لايف في الشهر" },
  { id: "aiExams", label: "إنشاء الامتحانات بالـ AI" },
  { id: "aiAcademic", label: "دعم علمي بالـ AI" },
  { id: "aiAnalytics", label: "محلل مستوى الطلاب بالـ AI" },
  { id: "aiSocial", label: "مساعد السوشيال ميديا بالـ AI" },
];

const basePlans = [
  {
    id: "bronze",
    name: "الانطلاقة",
    tagline: "ابدأ رحلتك بثقة",
    icon: FaSeedling,
    accent: BLUE,
    liveSessions: 6,
    availableFeatures: ["support", "courses", "bank", "live"],
    individual: { price: "1,000", students: "100 طالب" },
    center: {
      price: "2,000",
      students: "150 طالب",
      teachers: "10 معلمين",
    },
  },
  {
    id: "silver",
    name: "التوسّع",
    tagline: "انمو بسرعة وبذكاء",
    icon: FaChartLine,
    accent: ORANGE,
    liveSessions: 10,
    availableFeatures: ["support", "courses", "bank", "live"],
    individual: { price: "2,000", students: "200 طالب" },
    center: {
      price: "4,000",
      students: "300 طالب",
      teachers: "15 معلم",
    },
  },
  {
    id: "gold",
    name: "الاحتراف",
    tagline: "الخيار الأقوى للمدرسين",
    icon: FaStar,
    accent: BLUE,
    featured: true,
    liveSessions: 16,
    availableFeatures: [
      "support",
      "courses",
      "bank",
      "live",
      "aiExams",
      "aiAcademic",
    ],
    individual: { price: "2,500", students: "300 طالب" },
    center: {
      price: "5,000",
      students: "500 طالب",
      teachers: "50 معلم",
    },
  },
  {
    id: "diamond",
    name: "التميّز",
    tagline: "للعلامات الرائدة",
    icon: FaCrown,
    accent: ORANGE,
    liveSessions: "unlimited",
    availableFeatures: [
      "support",
      "courses",
      "bank",
      "live",
      "aiExams",
      "aiAcademic",
      "aiAnalytics",
      "aiSocial",
    ],
    individual: { price: "3,000", students: "غير محدود" },
    center: {
      price: "6,000",
      students: "عدد غير محدود",
      teachers: "عدد غير محدود",
    },
  },
];

const PLAN_TYPES = [
  { id: "individual", label: "باقات أفراد", Icon: FaUser },
  { id: "center", label: "باقات السناتر", Icon: FaBuilding },
];

function PlanFeatures({ plan, isLight, muted, titleColor }) {
  const getLiveLabel = () => {
    if (plan.liveSessions === "unlimited") return "لايف غير محدود";
    if (plan.liveSessions) return `${plan.liveSessions} لايف في الشهر`;
    return "لايف في الشهر";
  };

  return (
    <ul className="space-y-1">
      {featureCatalog.map((feature) => {
        const isAvailable = plan.availableFeatures.includes(feature.id);
        const label = feature.id === "live" ? getLiveLabel() : feature.label;

        return (
          <li
            key={feature.id}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm"
            style={{
              color: isAvailable
                ? titleColor
                : isLight
                  ? "#94a3b8"
                  : "#475569",
              opacity: isAvailable ? 1 : 0.7,
            }}
          >
            <span>{label}</span>
            {isAvailable ? (
              <FaCheckCircle
                className="shrink-0"
                style={{ color: plan.accent }}
              />
            ) : (
              <FaTimesCircle
                className="shrink-0"
                style={{ color: muted, opacity: 0.45 }}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

const SectionThree = () => {
  const [planType, setPlanType] = useState("individual");

  const isLight = useColorModeValue(true, false);
  const pageBg = useColorModeValue("#F8FAFC", "#0a1628");
  const titleColor = useColorModeValue("#0f172a", "#ffffff");
  const muted = useColorModeValue("#64748b", "#94a3b8");
  const cardBg = useColorModeValue("#ffffff", "rgba(12, 24, 44, 0.9)");
  const cardBorder = useColorModeValue(
    "rgba(15,23,42,0.08)",
    "rgba(255,255,255,0.1)",
  );
  const softBg = useColorModeValue("rgba(15,23,42,0.03)", "rgba(255,255,255,0.04)");
  const badgeBg = useColorModeValue("rgba(49,130,206,0.08)", "rgba(49,130,206,0.14)");
  const chipBg = useColorModeValue("rgba(15,23,42,0.04)", "rgba(255,255,255,0.06)");
  const toggleBg = useColorModeValue("#ffffff", "rgba(12, 24, 44, 0.95)");
  const toggleIdle = useColorModeValue("#64748b", "#94a3b8");

  const isCenter = planType === "center";

  return (
    <section
      id="pricing"
      dir="rtl"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{ ...landingFont, background: pageBg }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: isLight
            ? `radial-gradient(ellipse 60% 40% at 50% 0%, ${BLUE}12, transparent 60%)`
            : `radial-gradient(ellipse 60% 40% at 50% 0%, ${BLUE}22, transparent 60%)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-8 text-center sm:mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span
            className="mb-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-bold sm:text-[13px]"
            style={{
              borderColor: `${BLUE}44`,
              background: badgeBg,
              color: BLUE,
            }}
          >
            <FaBolt style={{ color: ORANGE }} />
            خطط مرنة لكل مرحلة
          </span>
          <h2
            className="mb-3 text-2xl font-extrabold sm:text-3xl lg:text-[2.35rem]"
            style={{ color: titleColor }}
          >
            اختر باقة{" "}
            <span style={{ color: ORANGE }}>تناسب طموحك</span>
          </h2>
          <p
            className="mx-auto max-w-xl text-[14px] leading-7 sm:text-[15px]"
            style={{ color: muted }}
          >
            باقات للأفراد وباقات للسناتر — نفس الأسماء والخدمات، بأسعار تناسب
            حجم شغلك.
          </p>
        </motion.div>

        {/* تبديل النوع */}
        <div className="mb-8 flex justify-center sm:mb-10">
          <div
            className="inline-flex rounded-2xl border p-1"
            style={{ borderColor: cardBorder, background: toggleBg }}
            role="tablist"
            aria-label="نوع الباقة"
          >
            {PLAN_TYPES.map(({ id, label, Icon }) => {
              const active = planType === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPlanType(id)}
                  className="relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors sm:px-5 sm:text-sm"
                  style={{ color: active ? "#fff" : toggleIdle }}
                >
                  {active ? (
                    <motion.span
                      layoutId="pricingTypePill"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background:
                          id === "center"
                            ? ORANGE
                            : BLUE,
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <Icon className="relative z-[1] text-[12px]" />
                  <span className="relative z-[1]">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={planType}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5"
          >
            {basePlans.map((plan, idx) => {
              const Icon = plan.icon;
              const isFeatured = plan.featured;
              const pricing = isCenter ? plan.center : plan.individual;

              return (
                <motion.article
                  key={`${planType}-${plan.id}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className={`relative flex flex-col overflow-hidden rounded-2xl border ${
                    isFeatured ? "z-10 xl:-mt-2 xl:mb-2" : ""
                  }`}
                  style={{
                    borderColor: isFeatured ? `${plan.accent}66` : cardBorder,
                    background: cardBg,
                    boxShadow: isFeatured
                      ? isLight
                        ? `0 20px 48px -24px ${plan.accent}66`
                        : `0 22px 48px -20px ${plan.accent}44`
                      : isLight
                        ? "0 12px 32px -24px rgba(15,23,42,0.2)"
                        : "none",
                  }}
                >
                  {isFeatured ? (
                    <div
                      className="py-2 text-center text-[11px] font-bold text-white"
                      style={{
                        background: `linear-gradient(90deg, ${BLUE}, ${ORANGE})`,
                      }}
                    >
                      الأكثر طلباً
                    </div>
                  ) : (
                    <div className="h-1" style={{ background: plan.accent }} />
                  )}

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                        style={{
                          background: plan.accent,
                          boxShadow: `0 10px 22px -10px ${plan.accent}99`,
                        }}
                      >
                        <Icon className="text-lg" />
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: chipBg, color: muted }}
                      >
                        {isCenter ? "سنتر" : "فرد"}
                      </span>
                    </div>

                    <h3
                      className="text-lg font-extrabold sm:text-xl"
                      style={{ color: titleColor }}
                    >
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: muted }}>
                      {plan.tagline}
                    </p>

                    <div
                      className="my-4 flex flex-wrap gap-2"
                      style={{ color: muted }}
                    >
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
                        style={{ background: softBg, color: titleColor }}
                      >
                        <FaUserGraduate
                          className="text-[10px]"
                          style={{ color: plan.accent }}
                        />
                        {pricing.students}
                      </span>
                      {isCenter ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
                          style={{ background: softBg, color: titleColor }}
                        >
                          <FaChalkboardTeacher
                            className="text-[10px]"
                            style={{ color: plan.accent }}
                          />
                          {pricing.teachers}
                        </span>
                      ) : null}
                    </div>

                    <div
                      className="mb-5 border-t pt-5"
                      style={{ borderColor: cardBorder }}
                    >
                      <div className="flex items-end gap-1">
                        <span
                          className="text-3xl font-extrabold sm:text-4xl"
                          style={{ color: titleColor }}
                        >
                          {pricing.price}
                        </span>
                        <span className="mb-1 text-sm" style={{ color: muted }}>
                          جنيه/شهر
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex-1 rounded-xl border p-3"
                      style={{
                        borderColor: cardBorder,
                        background: softBg,
                      }}
                    >
                      <p
                        className="mb-2 text-[11px] font-bold"
                        style={{ color: muted }}
                      >
                        يشمل اشتراكك
                      </p>
                      <PlanFeatures
                        plan={plan}
                        isLight={isLight}
                        muted={muted}
                        titleColor={titleColor}
                      />
                    </div>

                    <Link to="/signup" className="mt-5 block">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
                        style={{
                          background: isFeatured
                            ? `linear-gradient(90deg, ${BLUE}, ${ORANGE})`
                            : plan.accent,
                          boxShadow: `0 12px 28px -12px ${plan.accent}88`,
                        }}
                      >
                        {isFeatured ? "ابدأ بالاحتراف" : "اختر الباقة"}
                        <FaArrowLeft className="text-xs" />
                      </motion.button>
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center text-sm"
          style={{ color: muted }}
        >
          ترقية في أي وقت · بدون فقدان بيانات · دعم فني مستمر
        </motion.p>
      </div>
    </section>
  );
};

export default SectionThree;
