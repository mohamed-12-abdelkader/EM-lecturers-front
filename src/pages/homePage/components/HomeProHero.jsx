import {
  FaQrcode,
  FaUser,
  FaIdCard,
  FaBookOpen,
} from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";
import InstallPWAButton from "../../../components/pwa/InstallPWAButton";

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

  return (
    <section className="relative z-0 px-4 pt-3 md:px-6 md:pt-5 lg:px-8" dir="rtl">
      <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-900">
        {/* Atmosphere — edge-to-edge within the frame */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 85% -10%, rgba(49,130,206,0.22), transparent 52%), radial-gradient(ellipse 70% 60% at -5% 110%, rgba(221,107,32,0.14), transparent 48%), linear-gradient(165deg, #ffffff 0%, #f8fafc 55%, #eff6ff 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:hidden"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(49,130,206,0.18) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden dark:block"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 90% 0%, rgba(49,130,206,0.2), transparent 50%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(221,107,32,0.12), transparent 45%), linear-gradient(180deg, #0f172a 0%, #0f172a 100%)",
          }}
        />

        {/* Brand accent line */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[3px] origin-right bg-gradient-to-l from-blue-500 via-blue-500 to-orange-500"
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        />

        <div className="relative grid items-center gap-8 p-5 sm:p-7 md:gap-10 md:p-9 lg:grid-cols-[1.2fr_0.9fr] lg:gap-12 lg:p-10">
          {/* Copy + CTAs */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="min-w-0"
          >
            {/* Brand — hero-level signal */}
            <div className="mb-5 flex items-center gap-3">
              {teacherAvatar ? (
                <img
                  src={teacherAvatar}
                  alt=""
                  className="h-12 w-12 rounded-2xl object-cover shadow-md shadow-blue-500/20 ring-2 ring-white dark:ring-slate-700"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25">
                  <FaUser className="text-sm" />
                </span>
              )}
              <div className="min-w-0">
                <p className="font-heading text-lg font-black tracking-tight text-slate-900 dark:text-white md:text-xl">
                  {brandLabel}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  مرحباً بعودتك إلى منصتك
                </p>
              </div>
            </div>

            <h1 className="font-heading text-[2rem] font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-[2.75rem]">
              أهلاً،{" "}
              <span className="bg-gradient-to-l from-orange-500 to-amber-500 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>

            <p className="mt-3 max-w-lg text-[15px] leading-8 text-slate-600 dark:text-slate-300">
              كورساتك ومحاضراتك جاهزة — كمّل من حيث توقفت أو ابدأ درس جديد الآن.
            </p>

            {/* Primary actions */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {onActivateWithQr ? (
                <motion.button
                  type="button"
                  onClick={onActivateWithQr}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(221,107,32,0.55)] transition hover:bg-orange-600 sm:w-auto"
                >
                  <FaQrcode className="text-base" />
                  تفعيل الكورس بالـ QR
                </motion.button>
              ) : null}

              <InstallPWAButton
                label="تثبيت التطبيق"
                variant="solid"
                className="!rounded-2xl !px-6 !py-3.5 !text-sm"
              />
            </div>

            {/* Secondary utilities */}
            {Number(enrolledCount) > 0 ? (
              <div className="mt-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <FaBookOpen className="text-blue-500" />
                  {enrolledCount} كورس نشط
                </span>
              </div>
            ) : null}
          </motion.div>

          {/* Student ID — visual anchor */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            className="relative w-full lg:max-w-[380px] lg:justify-self-end"
          >
            {/* Soft glow behind card */}
            <div
              className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-blue-500/20 blur-2xl dark:bg-blue-500/10"
              aria-hidden
            />

            <div className="relative overflow-hidden rounded-[1.35rem] shadow-[0_24px_48px_-20px_rgba(37,99,235,0.55)]">
              <div className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-[#2563eb] via-[#3182CE] to-[#1e4f8c] p-5 text-white sm:p-6">
                <motion.div
                  className="pointer-events-none absolute -left-8 top-0 h-40 w-40 rounded-full bg-orange-400/30 blur-3xl"
                  aria-hidden
                  animate={
                    reduceMotion
                      ? undefined
                      : { opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }
                  }
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div
                  className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-sky-300/25 blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  aria-hidden
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "16px 16px",
                  }}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                      <FaIdCard className="text-lg" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.16em] text-blue-100/90">
                        STUDENT ID
                      </p>
                      <p className="text-sm font-bold text-white">بطاقة الطالب</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black tracking-wide text-white shadow-lg shadow-orange-600/40">
                    ACTIVE
                  </span>
                </div>

                <div className="relative mt-7">
                  <p className="text-[11px] font-semibold text-blue-100/90">
                    كود الحضور والتفعيل
                  </p>
                  {displayId ? (
                    <p className="mt-1.5 font-heading text-5xl font-black tabular-nums tracking-[0.06em] text-white sm:text-[3.4rem]">
                      {displayId}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-blue-100/75">غير متوفر حالياً</p>
                  )}
                </div>

                <div className="relative mt-6 flex items-end justify-between gap-3 border-t border-white/15 pt-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-blue-100/80">الاسم</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-white">
                      {fullName}
                    </p>
                  </div>
                  {teacherName ? (
                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-semibold text-blue-100/80">
                        المنصة
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold text-orange-200">
                        مستر {teacherName}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
