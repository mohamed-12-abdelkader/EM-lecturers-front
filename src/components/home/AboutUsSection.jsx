import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaPalette,
  FaGlobe,
  FaShareAlt,
  FaBullhorn,
  FaArrowLeft,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaTiktok,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { BRAND, landingFont } from "./landingTheme.js";
import { DotGrid, MeshGlow } from "./landingDecor.jsx";

const pillars = [
  {
    id: "platform",
    num: "01",
    icon: FaGlobe,
    title: "منصة باسمك",
    headline: "مساحتك الرقمية الخاصة",
    description:
      "رابط فرعي ومنصة كاملة تحمل اسمك وشعارك — طلابك يتعاملون مع علامتك أنت، لا مع منصة عامة.",
    gradient: "from-blue-500 to-cyan-400",
    glow: "shadow-blue-500/30",
    preview: {
      url: "ahmed.next-edu.online",
      name: "أ. أحمد — أكاديميتي",
      initials: "أ.أ",
      stat: { students: "320", courses: "18" },
    },
  },
  {
    id: "identity",
    num: "02",
    icon: FaPalette,
    title: "هوية بصرية",
    headline: "شكل يعكس شخصيتك",
    description:
      "شعار، ألوان، وطابع بصري متناسق يميّزك ويخلق انطباعاً احترافياً من أول نظرة.",
    gradient: "from-violet-500 to-purple-500",
    glow: "shadow-violet-500/30",
    preview: {
      colors: ["#0066ff", "#0f2d5c", "#22d3ee", "#f59e0b"],
      tagline: "هوية بصرية متكاملة",
    },
  },
  {
    id: "social",
    num: "03",
    icon: FaShareAlt,
    title: "سوشيال ميديا",
    headline: "حضور رقمي أقوى",
    description:
      "محتوى، استراتيجيات، وأدوات لزيادة التفاعل وتحويل المتابعين إلى طلاب حقيقيين.",
    gradient: "from-emerald-500 to-teal-400",
    glow: "shadow-emerald-500/30",
    preview: {
      social: [
        { icon: FaInstagram, label: "18K", name: "إنستغرام" },
        { icon: FaFacebook, label: "9K", name: "فيسبوك" },
        { icon: FaYoutube, label: "32K", name: "يوتيوب" },
        { icon: FaTiktok, label: "45K", name: "تيك توك" },
      ],
    },
  },
  {
    id: "growth",
    num: "04",
    icon: FaBullhorn,
    title: "نمو البراند",
    headline: "من مدرس إلى علامة",
    description:
      "نرافقك من الانطلاقة حتى التوسع — سمعة قوية وثقة طلابية تدعم نموك المستمر.",
    gradient: "from-orange-500 to-amber-400",
    glow: "shadow-orange-500/30",
    preview: {
      metrics: [
        { label: "نمو الطلاب", val: "+240%" },
        { label: "معدل الرضا", val: "96%" },
        { label: "تفاعل السوشيال", val: "+180%" },
      ],
    },
  },
];

const compareItems = [
  { generic: "منصة عامة بلا هوية", branded: "منصة باسمك وشعارك" },
  { generic: "رابط مشترك مع الآخرين", branded: "رابط فرعي خاص بك" },
  { generic: "بدون دعم للبراند", branded: "بناء هوية بصرية كاملة" },
  { generic: "حضور رقمي ضعيف", branded: "استراتيجية سوشيال ميديا" },
];

function BrandPreview({ active }) {
  const pillar = pillars.find((p) => p.id === active) || pillars[0];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pillar.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35 }}
        className="relative z-10"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/80">
              معاينة حية
            </p>
            <p className="mt-1 text-lg font-bold text-white">{pillar.headline}</p>
          </div>
          <span
            className={`rounded-full bg-gradient-to-l px-3 py-1 text-xs font-bold text-white ${pillar.gradient}`}
          >
            {pillar.num}
          </span>
        </div>

        {pillar.id === "platform" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-lg font-black text-white">
                {pillar.preview.initials}
              </div>
              <div>
                <p className="font-bold text-white">{pillar.preview.name}</p>
                <p className="text-sm text-cyan-400">{pillar.preview.url}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-2xl font-extrabold text-white">{pillar.preview.stat.students}</p>
                <p className="text-xs text-slate-400">طالب</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-2xl font-extrabold text-white">{pillar.preview.stat.courses}</p>
                <p className="text-xs text-slate-400">دورة</p>
              </div>
            </div>
          </div>
        )}

        {pillar.id === "identity" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">{pillar.preview.tagline}</p>
            <div className="grid grid-cols-4 gap-2">
              {pillar.preview.colors.map((c) => (
                <motion.div
                  key={c}
                  whileHover={{ scale: 1.08 }}
                  className="aspect-square rounded-xl border border-white/10 shadow-lg"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center">
              <p className="text-sm font-bold text-white">شعارك + ألوانك + خطك</p>
              <p className="mt-1 text-xs text-slate-500">هوية متناسقة في كل نقطة تواصل</p>
            </div>
          </div>
        )}

        {pillar.id === "social" && (
          <div className="grid grid-cols-2 gap-3">
            {pillar.preview.social.map(({ icon: Icon, label, name }) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="text-lg text-white" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white">{label}</p>
                  <p className="text-[10px] text-slate-400">{name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {pillar.id === "growth" && (
          <div className="space-y-3">
            {pillar.preview.metrics.map(({ label, val }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-xl font-extrabold text-emerald-400">{val}</span>
              </div>
            ))}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "88%" }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-cyan-400"
              />
            </div>
            <p className="text-center text-xs text-slate-500">نمو البراند خلال 6 أشهر</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

const AboutUsSection = () => {
  const [active, setActive] = useState("platform");

  return (
    <section
      id="about-service"
      dir="rtl"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
      style={{ ...landingFont, background: BRAND.navy }}
    >
      <MeshGlow />
      <DotGrid dark />

      {/* خط فاصل علوي متوهج */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-cyan-400/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* الهيدر */}
        <motion.div
          className="mb-14 text-center sm:mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-300">
            <FaPalette />
            أكثر من منصة — شراكة في بناء براندك
          </span>
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold leading-[1.4] text-white sm:text-4xl lg:text-5xl">
            حوّل اسمك إلى
            <span className="mt-2 block bg-gradient-to-l from-violet-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              علامة تعليمية رائدة
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            نمنحك المنصة، الهوية البصرية، ودعم السوشيال ميديا — ثلاثة أركان
            لبناء براند قوي يميّزك ويجذب الطلاب إليك.
          </p>
        </motion.div>

        {/* المحتوى الرئيسي */}
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          {/* الخطوات التفاعلية */}
          <div className="space-y-3">
            {pillars.map((pillar, i) => {
              const isActive = active === pillar.id;
              return (
                <motion.button
                  key={pillar.id}
                  type="button"
                  onClick={() => setActive(pillar.id)}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  className={`group w-full rounded-2xl border p-5 text-right transition-all duration-300 ${
                    isActive
                      ? `border-cyan-400/40 bg-white/10 shadow-lg ${pillar.glow}`
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${pillar.gradient} text-white shadow-md transition-transform group-hover:scale-105`}
                    >
                      <pillar.icon className="text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest text-slate-500">
                          {pillar.num}
                        </span>
                        <h3 className="font-bold text-white">{pillar.title}</h3>
                        {isActive ? (
                          <span className="mr-auto h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                        ) : null}
                      </div>
                      <p className="text-sm leading-relaxed text-slate-400">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}

            <Link to="/signup" className="mt-6 block">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(34,211,238,0.25)" }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-cyan-500 to-blue-600 py-4 text-sm font-bold text-white shadow-lg sm:text-base"
              >
                ابدأ ببناء براندك الآن
                <FaArrowLeft className="text-xs" />
              </motion.button>
            </Link>
          </div>

          {/* معاينة تفاعلية */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative lg:sticky lg:top-24"
          >
            <div
              className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-40 blur-2xl"
              style={{ background: `linear-gradient(135deg, ${BRAND.cyan}, ${BRAND.violet})` }}
            />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md sm:p-8">
              <BrandPreview active={active} />
            </div>
          </motion.div>
        </div>

        {/* مقارنة: عام vs براندك */}
        <motion.div
          className="mt-16 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm sm:mt-20"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="grid md:grid-cols-2">
            <div className="border-b border-white/10 bg-red-500/5 p-6 sm:p-8 md:border-b-0 md:border-l">
              <p className="mb-5 flex items-center gap-2 text-sm font-bold text-red-400">
                <FaTimes />
                المنصات العامة
              </p>
              <ul className="space-y-3">
                {compareItems.map((item) => (
                  <li
                    key={item.generic}
                    className="flex items-center gap-3 text-sm text-slate-500"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                      <FaTimes className="text-[10px] text-red-400" />
                    </span>
                    {item.generic}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-500/5 p-6 sm:p-8">
              <p className="mb-5 flex items-center gap-2 text-sm font-bold text-emerald-400">
                <FaCheck />
                مع EM Lectures
              </p>
              <ul className="space-y-3">
                {compareItems.map((item) => (
                  <li
                    key={item.branded}
                    className="flex items-center gap-3 text-sm text-slate-300"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <FaCheck className="text-[10px] text-emerald-400" />
                    </span>
                    {item.branded}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutUsSection;
