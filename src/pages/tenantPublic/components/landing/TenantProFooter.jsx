import { FaFacebook, FaInstagram, FaTelegram, FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { Reveal, StaggerGrid, StaggerItem } from "../../tenantLandingMotion";
import { tlContainer } from "../../tenantLandingTheme";

function SocialLink({ href, label, children }) {
  if (!href) return null;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-blue-500 transition-colors duration-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-700 dark:hover:bg-orange-950/30"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.a>
  );
}

export default function TenantProFooter({
  brandName,
  tenantAvatar,
  bioSnippet,
  loginHref,
  signupHref,
  joinHref,
  contact,
}) {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950" dir="rtl">
      <div className={tlContainer}>
        <StaggerGrid className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              {tenantAvatar ? (
                <img src={tenantAvatar} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                  {brandName.slice(0, 1)}
                </span>
              )}
              <p className="font-heading text-lg font-bold text-slate-900 dark:text-white">{brandName}</p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">{bioSnippet}</p>
          </StaggerItem>

          <StaggerItem>
            <p className="text-sm font-bold text-slate-900 dark:text-white">روابط سريعة</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ["#home", "الرئيسية"],
                ["#services", "لماذا نحن"],
                ["#videos", "محاضرات مجانية"],
                ["#courses", "الكورسات"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="cursor-pointer transition-colors duration-200 hover:text-blue-500">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </StaggerItem>

          <StaggerItem>
            <p className="text-sm font-bold text-slate-900 dark:text-white">الدعم</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a href={loginHref} className="cursor-pointer transition-colors duration-200 hover:text-blue-500">
                  تسجيل الدخول
                </a>
              </li>
              <li>
                <a href={signupHref} className="cursor-pointer transition-colors duration-200 hover:text-orange-500">
                  إنشاء حساب
                </a>
              </li>
              <li>
                <a href={joinHref} className="cursor-pointer transition-colors duration-200 hover:text-blue-500">
                  تواصل معنا
                </a>
              </li>
            </ul>
          </StaggerItem>

          <StaggerItem>
            <p className="text-sm font-bold text-slate-900 dark:text-white">تابعنا</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <SocialLink href={contact.facebook} label="Facebook">
                <FaFacebook />
              </SocialLink>
              <SocialLink href={contact.instagram} label="Instagram">
                <FaInstagram />
              </SocialLink>
              <SocialLink href={contact.telegram} label="Telegram">
                <FaTelegram />
              </SocialLink>
              <SocialLink href={contact.whatsapp} label="WhatsApp">
                <FaWhatsapp />
              </SocialLink>
            </div>
          </StaggerItem>
        </StaggerGrid>

        <Reveal variant="fadeIn" delay={0.1}>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 sm:flex-row">
            <div className="text-center sm:text-start">
              <p>© {new Date().getFullYear()} EM Lectures. جميع الحقوق محفوظة.</p>
              <p className="mt-1">هذه المنصة تابعة لشركة EM Lectures.</p>
            </div>
            <div className="flex gap-5">
              <a href="#" className="cursor-pointer transition-colors duration-200 hover:text-blue-500">
                سياسة الخصوصية
              </a>
              <a href="#" className="cursor-pointer transition-colors duration-200 hover:text-blue-500">
                الشروط والأحكام
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
