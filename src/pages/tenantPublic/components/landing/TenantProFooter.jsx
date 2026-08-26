import { FaFacebook, FaInstagram, FaTelegram, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { motion } from "framer-motion";
import { Reveal, StaggerGrid, StaggerItem } from "../../tenantLandingMotion";
import { TL_CYAN, tlContainer } from "../../tenantLandingTheme";
import TenantAppLink from "../TenantAppLink";

function SocialLink({ href, label, children }) {
  if (!href) return null;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] text-[#00A0E3] shadow-sm transition-colors duration-200 hover:border-[#D4E157]/40 hover:bg-[#D4E157]/10 hover:text-[#D4E157]"
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
  showSignup = true,
  joinHref,
  contact = {},
  quickLinks = [
    ["#home", "الرئيسية"],
    ["#services", "لماذا نحن"],
    ["#videos", "محاضرات مجانية"],
    ["#courses", "الكورسات"],
  ],
}) {
  const hasSocial =
    contact.facebook ||
    contact.instagram ||
    contact.youtube ||
    contact.tiktok ||
    contact.telegram ||
    contact.whatsapp;

  return (
    <footer
      id="contact"
      className="border-t border-[color:var(--tl-border)] bg-[var(--tl-section)] py-10 md:py-12"
      dir="rtl"
    >
      <div className={tlContainer}>
        <StaggerGrid className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              {tenantAvatar ? (
                <img
                  src={tenantAvatar}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-[color:var(--tl-border)]"
                />
              ) : (
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: TL_CYAN }}
                >
                  {brandName.slice(0, 1)}
                </span>
              )}
              <p className="font-heading text-lg font-bold text-[var(--tl-fg)]">{brandName}</p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--tl-muted)]">{bioSnippet}</p>
          </StaggerItem>

          <StaggerItem>
            <p className="text-sm font-bold text-[var(--tl-fg)]">روابط سريعة</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--tl-muted)]">
              {quickLinks.map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="cursor-pointer transition-colors duration-200 hover:text-[#00A0E3]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </StaggerItem>

          <StaggerItem>
            <p className="text-sm font-bold text-[var(--tl-fg)]">الدعم</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--tl-muted)]">
              <li>
                <TenantAppLink href={loginHref} className="cursor-pointer transition-colors duration-200 hover:text-[#00A0E3]">
                  تسجيل الدخول
                </TenantAppLink>
              </li>
              {showSignup && signupHref ? (
                <li>
                  <TenantAppLink href={signupHref} className="cursor-pointer transition-colors duration-200 hover:text-[#D4E157]">
                    إنشاء حساب
                  </TenantAppLink>
                </li>
              ) : null}
              <li>
                <a href={joinHref} className="cursor-pointer transition-colors duration-200 hover:text-[#00A0E3]">
                  تواصل معنا
                </a>
              </li>
            </ul>
          </StaggerItem>

          <StaggerItem>
            <p className="text-sm font-bold text-[var(--tl-fg)]">تواصل معنا</p>
            {hasSocial ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <SocialLink href={contact.facebook} label="Facebook">
                  <FaFacebook />
                </SocialLink>
                <SocialLink href={contact.instagram} label="Instagram">
                  <FaInstagram />
                </SocialLink>
                <SocialLink href={contact.youtube} label="YouTube">
                  <FaYoutube />
                </SocialLink>
                <SocialLink href={contact.tiktok} label="TikTok">
                  <FaTiktok />
                </SocialLink>
                <SocialLink href={contact.telegram} label="Telegram">
                  <FaTelegram />
                </SocialLink>
                <SocialLink href={contact.whatsapp} label="WhatsApp">
                  <FaWhatsapp />
                </SocialLink>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--tl-muted)]">لا توجد روابط تواصل حالياً.</p>
            )}
          </StaggerItem>
        </StaggerGrid>

        <Reveal variant="fadeIn" delay={0.1}>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[color:var(--tl-border)] pt-6 text-xs text-[var(--tl-muted)] sm:flex-row">
            <div className="text-center sm:text-start">
              <p>© {new Date().getFullYear()} EM Lectures. جميع الحقوق محفوظة.</p>
              <p className="mt-1">هذه المنصة تابعة لشركة EM Lectures.</p>
            </div>
            <div className="flex gap-5">
              <a href="#" className="cursor-pointer transition-colors duration-200 hover:text-[#00A0E3]">
                سياسة الخصوصية
              </a>
              <a href="#" className="cursor-pointer transition-colors duration-200 hover:text-[#00A0E3]">
                الشروط والأحكام
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
