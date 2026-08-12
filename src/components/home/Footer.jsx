import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useColorModeValue } from "@chakra-ui/react";
import { FaFacebook, FaYoutube, FaTiktok, FaArrowLeft } from "react-icons/fa";
import { landingFont } from "./landingTheme.js";
import logoImg from "../../img/next logo.png";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";

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
  },
  {
    href: "https://youtube.com/@mostafaghost9046?si=JNjXytRrD92TuzR_",
    icon: FaYoutube,
    label: "يوتيوب",
  },
  {
    href: "https://www.tiktok.com/@e_m_online",
    icon: FaTiktok,
    label: "تيك توك",
  },
];

const Footer = () => {
  const pageBg = useColorModeValue("#FFFFFF", "#0a1628");
  const titleColor = useColorModeValue("#0f172a", "#ffffff");
  const muted = useColorModeValue("#64748b", "#94a3b8");
  const softMuted = useColorModeValue("#94a3b8", "#64748b");
  const border = useColorModeValue("rgba(15,23,42,0.08)", "rgba(255,255,255,0.1)");
  const logoBg = useColorModeValue("rgba(15,23,42,0.04)", "rgba(255,255,255,0.05)");
  const socialBg = useColorModeValue("rgba(15,23,42,0.04)", "rgba(255,255,255,0.05)");
  const socialHover = useColorModeValue(`${BLUE}14`, `${BLUE}22`);
  const isLight = useColorModeValue(true, false);

  return (
    <footer
      id="contact"
      dir="rtl"
      className="relative overflow-hidden scroll-mt-28 border-t"
      style={{ ...landingFont, background: pageBg, borderColor: border }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(to left, transparent, ${BLUE}55, ${ORANGE}44, transparent)`,
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full blur-[100px]"
        style={{ background: `${BLUE}${isLight ? "12" : "18"}` }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="mb-5 flex items-center gap-3">
              <img
                src={logoImg}
                alt="EM Lectures"
                className="h-12 w-12 rounded-xl border object-contain p-1"
                style={{ borderColor: border, background: logoBg }}
              />
              <div>
                <p
                  className="text-xl font-extrabold"
                  style={{ color: titleColor }}
                >
                  EM{" "}
                  <span style={{ color: BLUE }}>Lectures</span>
                </p>
                <p className="text-xs" style={{ color: softMuted }}>
                  منصتك التعليمية باسمك
                </p>
              </div>
            </div>
            <p
              className="mb-6 max-w-sm text-sm leading-relaxed"
              style={{ color: muted }}
            >
              نبني معك براندك التعليمي من الصفر — منصة باسمك، هوية بصرية،
              ودعم سوشيال ميديا لتحوّل اسمك إلى علامة رائدة في التعليم.
            </p>
            <Link to="/create-platform">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                style={{
                  background: BLUE,
                  boxShadow: `0 12px 28px -12px ${BLUE}88`,
                }}
              >
                ابدأ مجاناً
                <FaArrowLeft className="text-xs" />
              </motion.span>
            </Link>
          </div>

          <div className="lg:col-span-3">
            <p
              className="mb-4 text-sm font-bold"
              style={{ color: titleColor }}
            >
              روابط سريعة
            </p>
            <ul className="space-y-2.5">
              {quickLinks.map((item) => {
                const className =
                  "text-sm transition-colors hover:opacity-100";
                const style = { color: muted };
                return (
                  <li key={item.label}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        className={className}
                        style={style}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = BLUE;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = muted;
                        }}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className={className}
                        style={style}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = BLUE;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = muted;
                        }}
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p
              className="mb-4 text-sm font-bold"
              style={{ color: titleColor }}
            >
              تابعنا
            </p>
            <p className="mb-5 text-sm" style={{ color: muted }}>
              محتوى تعليمي، نصائح للمدرسين، وآخر التحديثات على منصتنا.
            </p>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    borderColor: border,
                    background: socialBg,
                    color: muted,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = socialHover;
                    e.currentTarget.style.borderColor = `${BLUE}55`;
                    e.currentTarget.style.color = BLUE;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = socialBg;
                    e.currentTarget.style.borderColor = border;
                    e.currentTarget.style.color = muted;
                  }}
                >
                  <Icon className="text-lg" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row"
          style={{ borderColor: border }}
        >
          <p className="text-xs" style={{ color: softMuted }}>
            © {new Date().getFullYear()} EM Lectures — Next Edu School. جميع
            الحقوق محفوظة.
          </p>
          <p className="text-xs" style={{ color: softMuted }}>
            صُممت للمدرسين العرب الذين يبنون براندًا لا منصة عامة
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
