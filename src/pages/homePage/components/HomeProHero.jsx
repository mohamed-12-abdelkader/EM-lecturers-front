import { FaQrcode, FaIdCard, FaBookOpen, FaChevronLeft } from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";
import { useColorModeValue } from "@chakra-ui/react";
import InstallPWAButton from "../../../components/pwa/InstallPWAButton";
import {
  HP_BLUE,
  HP_ORANGE,
  hpContainer,
  hpBtnPrimary,
  hpBtnOutline,
} from "../homeTheme";

const EASE = [0.22, 1, 0.36, 1];

export default function HomeProHero({
  studentName,
  studentId,
  teacherName,
  teacherAvatar,
  enrolledCount = 0,
  onActivateWithQr,
}) {
  const reduceMotion = useReducedMotion();
  const displayId =
    studentId != null && studentId !== "" ? String(studentId) : null;
  const firstName = (studentName || "عزيزي الطالب").split(" ")[0];
  const fullName = studentName || "عزيزي الطالب";
  const brandLabel = teacherName ? `مستر ${teacherName}` : "مساحة التعلم";

  const shellBg = useColorModeValue("#FFFFFF", "#1A202C");
  const shellBorder = useColorModeValue(
    "rgba(226, 232, 240, 0.95)",
    "rgba(255, 255, 255, 0.08)",
  );
  const shellShadow = useColorModeValue(
    "0 16px 48px -24px rgba(49, 130, 206, 0.28)",
    "0 16px 48px -20px rgba(0, 0, 0, 0.55)",
  );
  const washBg = useColorModeValue(
    `radial-gradient(ellipse 70% 80% at 100% 0%, rgba(49,130,206,0.14) 0%, transparent 55%),
     radial-gradient(ellipse 50% 60% at 0% 100%, rgba(221,107,32,0.08) 0%, transparent 50%),
     linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 55%, #FFFFFF 100%)`,
    `radial-gradient(ellipse 70% 80% at 100% 0%, rgba(49,130,206,0.22) 0%, transparent 55%),
     radial-gradient(ellipse 50% 60% at 0% 100%, rgba(221,107,32,0.12) 0%, transparent 50%),
     linear-gradient(180deg, #1A202C 0%, #171923 60%, #171923 100%)`,
  );
  const mutedText = useColorModeValue("#718096", "#A0AEC0");
  const titleText = useColorModeValue("#1A202C", "#F7FAFC");
  const brandNameColor = useColorModeValue("#2D3748", "#F7FAFC");
  const nameAccent = useColorModeValue(HP_BLUE, "#63B3ED");
  const badgeBg = useColorModeValue("#EBF8FF", "rgba(49, 130, 206, 0.2)");
  const badgeText = useColorModeValue("#2B6CB0", "#90CDF4");
  const avatarRing = useColorModeValue("#BEE3F8", "rgba(99, 179, 237, 0.35)");
  const idCardBg = useColorModeValue("#FFFFFF", "#2D3748");
  const idCardBorder = useColorModeValue("#E2E8F0", "rgba(255,255,255,0.1)");
  const idHeaderBg = useColorModeValue(HP_BLUE, "#2B6CB0");
  const idNumberColor = useColorModeValue(HP_BLUE, "#63B3ED");
  const idDivider = useColorModeValue("#EDF2F7", "rgba(255,255,255,0.08)");
  const idNameColor = useColorModeValue("#2D3748", "#E2E8F0");
  const idLabelColor = useColorModeValue("#A0AEC0", "#718096");
  const outlineHover = useColorModeValue(
    "hover:bg-blue-50",
    "hover:bg-white/5",
  );

  return (
    <section className="relative w-full overflow-x-clip pt-3 sm:pt-5" dir="rtl">
      <div className={hpContainer}>
        <div
          className="relative overflow-hidden rounded-[1.75rem]"
          style={{
            background: shellBg,
            border: `1px solid ${shellBorder}`,
            boxShadow: shellShadow,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{ background: washBg }}
          />

          <div className="relative grid gap-6 p-5 sm:gap-8 sm:p-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-8">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="min-w-0"
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {teacherAvatar ? (
                    <img
                      src={teacherAvatar}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-2xl object-cover sm:h-12 sm:w-12"
                      style={{ boxShadow: `0 0 0 2px ${avatarRing}` }}
                    />
                  ) : (
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white sm:h-12 sm:w-12"
                      style={{ background: HP_BLUE }}
                    >
                      {(brandLabel || "م").slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-semibold"
                      style={{ color: mutedText }}
                    >
                      منصتك التعليمية
                    </p>
                    <p
                      className="truncate font-heading text-base font-bold sm:text-lg"
                      style={{ color: brandNameColor }}
                    >
                      {brandLabel}
                    </p>
                  </div>
                </div>
                {Number(enrolledCount) > 0 ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{ background: badgeBg, color: badgeText }}
                  >
                    <FaBookOpen className="text-[10px]" />
                    {enrolledCount} كورس نشط
                  </span>
                ) : null}
              </div>

              <h1
                className="font-heading text-[clamp(1.65rem,4.5vw,2.5rem)] font-bold leading-[1.25] tracking-tight"
                style={{ color: titleText }}
              >
                أهلاً بك،{" "}
                <span style={{ color: nameAccent }}>{firstName}</span>
              </h1>
              <p
                className="mt-2.5 max-w-lg text-sm leading-7 sm:text-[15px] sm:leading-8"
                style={{ color: mutedText }}
              >
                تابع كورساتك، فعّل محتوى جديد، أو راجع جدولك — كل شيء في مكان واحد.
              </p>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                {onActivateWithQr ? (
                  <motion.button
                    type="button"
                    onClick={onActivateWithQr}
                    whileHover={reduceMotion ? undefined : { y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={`${hpBtnPrimary} min-h-11 w-full sm:w-auto`}
                  >
                    <FaQrcode className="text-sm" />
                    تفعيل كورس
                  </motion.button>
                ) : null}
                <a
                  href="#platform-courses"
                  className={`${hpBtnOutline} ${outlineHover} min-h-11 w-full dark:hover:bg-white/5 sm:w-auto`}
                >
                  تصفّح الكورسات
                  <FaChevronLeft className="text-[10px]" />
                </a>
                <div className="w-full sm:w-auto">
                  <InstallPWAButton
                    label="تنزيل المنصة"
                    variant="solid"
                    className="!min-h-11 !w-full !rounded-xl !px-5 !py-2.5 !text-sm !font-bold !shadow-md !shadow-blue-500/25 sm:!w-auto"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
              className="w-full lg:max-w-sm lg:justify-self-end"
            >
              <div
                className="overflow-hidden rounded-2xl shadow-sm"
                style={{
                  background: idCardBg,
                  border: `1px solid ${idCardBorder}`,
                }}
              >
                <div
                  className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                  style={{ background: idHeaderBg }}
                >
                  <div className="flex items-center gap-2.5 text-white">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                      <FaIdCard />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold tracking-wide text-white/75">
                        بطاقة الطالب
                      </p>
                      <p className="text-sm font-bold">كود الحضور والتفعيل</p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                    style={{ background: HP_ORANGE }}
                  >
                    نشط
                  </span>
                </div>

                <div className="px-4 py-4 sm:px-5 sm:py-5">
                  {displayId ? (
                    <p
                      className="font-heading font-bold tabular-nums tracking-wide"
                      style={{
                        fontSize: "clamp(1.6rem, 5.5vw, 2.25rem)",
                        lineHeight: 1.2,
                        wordBreak: "break-all",
                        color: idNumberColor,
                      }}
                    >
                      {displayId}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: idLabelColor }}>
                      غير متوفر حالياً
                    </p>
                  )}
                  <div
                    className="mt-4 flex items-center justify-between gap-3 pt-3"
                    style={{ borderTop: `1px solid ${idDivider}` }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-[10px] font-medium"
                        style={{ color: idLabelColor }}
                      >
                        الاسم
                      </p>
                      <p
                        className="truncate text-sm font-bold"
                        style={{ color: idNameColor }}
                      >
                        {fullName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
