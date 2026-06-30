import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaFacebook, FaYoutube, FaTiktok, FaArrowLeft } from "react-icons/fa";
import { BRAND, landingFont } from "./landingTheme.js";
import { DotGrid } from "./landingDecor.jsx";
import logoImg from "../../img/next logo.png";

const quickLinks = [
  { label: "المزايا", href: "#teacher-features" },
  { label: "بناء البراند", href: "#about-service" },
  { label: "الباقات", href: "#pricing" },
  { label: "إنشاء حساب", to: "/signup" },
  { label: "تسجيل الدخول", to: "/login" },
];

const socialLinks = [
  {
    href: "https://www.facebook.com/profile.php?id=61556280021487&mibextid=kFxxJD",
    icon: FaFacebook,
    label: "فيسبوك",
    color: "hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/10",
  },
  {
    href: "https://youtube.com/@mostafaghost9046?si=JNjXytRrD92TuzR_",
    icon: FaYoutube,
    label: "يوتيوب",
    color: "hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10",
  },
  {
    href: "https://www.tiktok.com/@e_m_online",
    icon: FaTiktok,
    label: "تيك توك",
    color: "hover:text-pink-400 hover:border-pink-400/30 hover:bg-pink-400/10",
  },
];

const Footer = () => (
  <footer
    dir="rtl"
    className="relative overflow-hidden border-t border-white/10"
    style={{ ...landingFont, background: BRAND.navy }}
  >
    <DotGrid dark />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-cyan-400/50 to-transparent" />
    <div className="pointer-events-none absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]" />

    <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        {/* البراند */}
        <div className="lg:col-span-5">
          <div className="mb-5 flex items-center gap-3">
            <img
              src={logoImg}
              alt="EM Lectures"
              className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 object-contain p-1"
            />
            <div>
              <p className="text-xl font-extrabold text-white">
                EM{" "}
                <span className="bg-gradient-to-l from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Lectures
                </span>
              </p>
              <p className="text-xs text-slate-500">منصتك التعليمية باسمك</p>
            </div>
          </div>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-400">
            نبني معك براندك التعليمي من الصفر — منصة باسمك، هوية بصرية،
            ودعم سوشيال ميديا لتحوّل اسمك إلى علامة رائدة في التعليم.
          </p>
          <Link to="/signup">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20"
            >
              ابدأ مجاناً
              <FaArrowLeft className="text-xs" />
            </motion.span>
          </Link>
        </div>

        {/* روابط سريعة */}
        <div className="lg:col-span-3">
          <p className="mb-4 text-sm font-bold text-white">روابط سريعة</p>
          <ul className="space-y-2.5">
            {quickLinks.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="text-sm text-slate-400 transition-colors hover:text-cyan-300"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="text-sm text-slate-400 transition-colors hover:text-cyan-300"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* تواصل */}
        <div className="lg:col-span-4">
          <p className="mb-4 text-sm font-bold text-white">تابعنا</p>
          <p className="mb-5 text-sm text-slate-400">
            محتوى تعليمي، نصائح للمدرسين، وآخر التحديثات على منصتنا.
          </p>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map(({ href, icon: Icon, label, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:-translate-y-0.5 ${color}`}
              >
                <Icon className="text-lg" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* الشريط السفلي */}
      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} EM Lectures — Next Edu School. جميع الحقوق محفوظة.
        </p>
        <p className="text-xs text-slate-600">
          صُممت للمدرسين العرب الذين يبنون براندًا لا منصة عامة
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
