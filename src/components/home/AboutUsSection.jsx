import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useColorModeValue } from "@chakra-ui/react";
import {
  FaGlobe,
  FaPalette,
  FaShareAlt,
  FaBullhorn,
  FaArrowLeft,
} from "react-icons/fa";
import { landingFont } from "./landingTheme.js";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";

const pillars = [
  {
    icon: FaGlobe,
    title: "منصة باسمك",
    text: "منصتك بروابطك وهويتك — الطلاب يتعاملوا مع علامتك أنت.",
    accent: BLUE,
  },
  {
    icon: FaPalette,
    title: "هوية بصرية",
    text: "شكل احترافي متناسق يبني ثقة من أول نظرة.",
    accent: ORANGE,
  },
  {
    icon: FaShareAlt,
    title: "سوشيال ميديا",
    text: "حضور رقمي أقوى يحوّل المتابعة لطلاب فعليين.",
    accent: ORANGE,
  },
  {
    icon: FaBullhorn,
    title: "نمو البراند",
    text: "نمو مستمر لسمعتك وثقة طلابك مع التوسع.",
    accent: BLUE,
  },
];

const AboutUsSection = () => {
  const pageBg = useColorModeValue("#FFFFFF", "#0a1628");
  const titleColor = useColorModeValue("#0f172a", "#ffffff");
  const muted = useColorModeValue("#64748b", "#94a3b8");
  const cardBg = useColorModeValue("#F8FAFC", "rgba(255,255,255,0.04)");
  const cardBorder = useColorModeValue("rgba(15,23,42,0.07)", "rgba(255,255,255,0.08)");
  const bandBg = useColorModeValue("#0f172a", "#06101f");

  return (
    <section
      id="about-service"
      dir="rtl"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{ ...landingFont, background: pageBg }}
    >
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* عنوان واضح ومضغوط */}
        <motion.div
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-12"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <p
            className="mb-3 text-[12px] font-bold sm:text-[13px]"
            style={{ color: ORANGE }}
          >
            عن الخدمة
          </p>
          <h2
            className="text-[1.65rem] font-extrabold leading-snug sm:text-3xl lg:text-[2.2rem]"
            style={{ color: titleColor }}
          >
            بنبني معاك{" "}
            <span style={{ color: BLUE }}>براند تعليمي</span>
            {" "}مش مجرد منصة
          </h2>
          <p
            className="mx-auto mt-3 max-w-md text-[14px] leading-7 sm:text-[15px]"
            style={{ color: muted }}
          >
            أربعة أركان تخلي اسمك علامة واضحة قدام الطلاب وأولياء الأمور.
          </p>
        </motion.div>

        {/* شبكة ٤ كروت نظيفة */}
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {pillars.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border p-5 sm:p-6"
                style={{
                  background: cardBg,
                  borderColor: cardBorder,
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{
                    background: item.accent,
                    boxShadow: `0 10px 24px -10px ${item.accent}99`,
                  }}
                >
                  <Icon className="text-base" />
                </div>
                <h3
                  className="mb-2 text-[16px] font-extrabold sm:text-[17px]"
                  style={{ color: titleColor }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[13px] leading-7 sm:text-[14px]"
                  style={{ color: muted }}
                >
                  {item.text}
                </p>
                <div
                  className="mt-5 h-[2px] w-10 rounded-full"
                  style={{ background: item.accent }}
                />
              </motion.article>
            );
          })}
        </div>

        {/* شريط CTA قوي وبسيط */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-8 overflow-hidden rounded-2xl sm:mt-10"
          style={{ background: bandBg }}
        >
          <div className="relative flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-7 lg:px-9">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              aria-hidden
              style={{
                background: `radial-gradient(ellipse at 100% 50%, ${BLUE}55, transparent 55%), radial-gradient(ellipse at 0% 50%, ${ORANGE}40, transparent 50%)`,
              }}
            />
            <div className="relative z-10 max-w-lg">
              <p className="text-[15px] font-extrabold text-white sm:text-lg">
                جاهز تخلي منصتك باسمك؟
              </p>
              <p className="mt-1 text-[13px] leading-6 text-white/65 sm:text-[14px]">
                ابدأ مجانًا وابنِ براندك التعليمي من أول يوم.
              </p>
            </div>
            <Link to="/signup" className="relative z-10 shrink-0">
              <motion.span
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
                style={{
                  background: ORANGE,
                  boxShadow: `0 12px 28px -10px ${ORANGE}aa`,
                }}
              >
                ابدأ الآن
                <FaArrowLeft className="text-[11px]" />
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutUsSection;
