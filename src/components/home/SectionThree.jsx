import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSeedling,
  FaChartLine,
  FaStar,
  FaCrown,
  FaArrowLeft,
  FaBolt,
} from "react-icons/fa";
import { BRAND, landingFont } from "./landingTheme.js";
import { DotGrid, MeshGlow } from "./landingDecor.jsx";

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

const plans = [
  {
    id: "bronze",
    name: "الانطلاقة",
    tagline: "ابدأ رحلتك بثقة",
    price: "1,500",
    students: "80 طالب",
    icon: FaSeedling,
    gradient: "from-emerald-400 to-teal-500",
    border: "border-emerald-500/30",
    btnClass: "from-emerald-500 to-teal-600",
    liveSessions: 6,
    availableFeatures: ["support", "courses", "bank", "live"],
  },
  {
    id: "silver",
    name: "التوسّع",
    tagline: "انمو بسرعة وبذكاء",
    price: "2,000",
    students: "150 طالب",
    icon: FaChartLine,
    gradient: "from-slate-400 to-slate-600",
    border: "border-slate-500/30",
    btnClass: "from-slate-600 to-slate-700",
    liveSessions: 10,
    availableFeatures: ["support", "courses", "bank", "live"],
  },
  {
    id: "gold",
    name: "الاحتراف",
    tagline: "الخيار الأقوى للمدرسين",
    price: "3,000",
    students: "300 طالب",
    icon: FaStar,
    gradient: "from-cyan-400 to-blue-600",
    border: "border-cyan-400/50",
    btnClass: "from-cyan-500 to-blue-600",
    featured: true,
    liveSessions: 16,
    availableFeatures: [
      "support", "courses", "bank", "live", "aiExams", "aiAcademic",
    ],
  },
  {
    id: "diamond",
    name: "التميّز",
    tagline: "للعلامات الرائدة",
    price: "4,000",
    students: "غير محدود",
    icon: FaCrown,
    gradient: "from-violet-400 to-indigo-600",
    border: "border-violet-500/30",
    btnClass: "from-violet-500 to-indigo-600",
    liveSessions: "unlimited",
    availableFeatures: [
      "support", "courses", "bank", "live",
      "aiExams", "aiAcademic", "aiAnalytics", "aiSocial",
    ],
  },
];

function PlanFeatures({ plan }) {
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
            className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm ${
              isAvailable ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <span>{label}</span>
            {isAvailable ? (
              <FaCheckCircle className="shrink-0 text-emerald-400" />
            ) : (
              <FaTimesCircle className="shrink-0 text-slate-600" />
            )}
          </li>
        );
      })}
    </ul>
  );
}

const SectionThree = () => (
  <section
    id="pricing"
    dir="rtl"
    className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
    style={{ ...landingFont, background: BRAND.navy }}
  >
    <MeshGlow />
    <DotGrid dark />

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        className="mb-14 text-center sm:mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300">
          <FaBolt className="text-cyan-400" />
          خطط مرنة لكل مرحلة
        </span>
        <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
          اختر باقة
          <span className="bg-gradient-to-l from-cyan-300 to-blue-400 bg-clip-text text-transparent">
            {" "}تناسب طموحك
          </span>
        </h2>
        <p className="mx-auto max-w-xl text-base text-slate-400 sm:text-lg">
          من الانطلاقة الأولى حتى التميّز الكامل — كل باقة تشمل منصة باسمك وبراندك.
        </p>
      </motion.div>

      <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, idx) => {
          const Icon = plan.icon;
          const isFeatured = plan.featured;

          return (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: idx * 0.07 }}
              className={`relative flex flex-col overflow-hidden rounded-2xl border ${plan.border} ${
                isFeatured
                  ? "z-10 scale-[1.03] shadow-[0_0_60px_rgba(34,211,238,0.15)] xl:-mt-3 xl:mb-3"
                  : "bg-white/[0.03] backdrop-blur-sm"
              }`}
              style={
                isFeatured
                  ? { background: "linear-gradient(160deg, rgba(34,211,238,0.08), rgba(0,86,179,0.12))" }
                  : undefined
              }
            >
              {isFeatured ? (
                <div className="bg-gradient-to-l from-cyan-500 to-blue-600 py-2 text-center text-xs font-bold text-white">
                  ⭐ الأكثر طلباً
                </div>
              ) : (
                <div className={`h-1 bg-gradient-to-l ${plan.gradient}`} />
              )}

              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient} text-white shadow-lg`}
                  >
                    <Icon className="text-xl" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                    {plan.students}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{plan.tagline}</p>

                <div className="my-5 border-t border-white/10 pt-5">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="mb-1 text-sm text-slate-400">جنيه/شهر</span>
                  </div>
                </div>

                <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-2 text-xs font-bold text-slate-500">يشمل اشتراكك</p>
                  <PlanFeatures plan={plan} />
                </div>

                <Link to="/signup" className="mt-5 block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l ${plan.btnClass} px-4 py-3 text-sm font-bold text-white shadow-lg transition-shadow hover:shadow-xl`}
                  >
                    {isFeatured ? "ابدأ بالاحتراف" : "اختر الباقة"}
                    <FaArrowLeft className="text-xs" />
                  </motion.button>
                </Link>
              </div>
            </motion.article>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-12 text-center text-sm text-slate-500"
      >
        ترقية في أي وقت · بدون فقدان بيانات · دعم فني مستمر
      </motion.p>
    </div>
  </section>
);

export default SectionThree;
