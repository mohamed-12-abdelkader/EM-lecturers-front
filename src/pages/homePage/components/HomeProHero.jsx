import { FaArrowLeft, FaQrcode, FaUser, FaIdCard, FaBookOpen } from "react-icons/fa";
import { MdSchedule } from "react-icons/md";
import { motion, useReducedMotion } from "framer-motion";
import InstallPWAButton from "../../../components/pwa/InstallPWAButton";

const EASE = [0.22, 1, 0.36, 1];

export default function HomeProHero({
  studentName,
  studentId,
  teacherName,
  teacherAvatar,
  enrolledCount = 0,
  onStartLearning,
  onContinue,
  onActivateWithQr,
}) {
  const reduceMotion = useReducedMotion();
  const displayId = studentId != null && studentId !== "" ? String(studentId) : null;
  const firstName = (studentName || "عزيزي الطالب").split(" ")[0];
  const fullName = studentName || "عزيزي الطالب";

  return (
    <section className="relative z-0 px-4 pt-4 md:px-6 md:pt-6 lg:px-8" dir="rtl">
      <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900">
        {/* Top brand bar */}
        <div className="h-1.5 w-full bg-gradient-to-l from-blue-500 via-blue-500 to-orange-500" />

        {/* Soft atmosphere — not a flat fill */}
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 100% 0%, rgba(49,130,206,0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(221,107,32,0.09), transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
          }}
        />

        <div className="relative grid gap-6 p-5 sm:p-6 md:gap-8 md:p-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">
          {/* ── Left: welcome ── */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="min-w-0"
          >
            {teacherName ? (
              <div className="mb-4 inline-flex max-w-full items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/90 py-1 pe-3.5 ps-1 dark:border-slate-600 dark:bg-slate-800/80">
                {teacherAvatar ? (
                  <img
                    src={teacherAvatar}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                    <FaUser className="text-[11px]" />
                  </span>
                )}
                <span className="truncate text-xs font-bold text-slate-700 dark:text-slate-200 md:text-sm">
                  منصة مستر {teacherName}
                </span>
              </div>
            ) : (
              <span className="mb-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                مساحة الطالب
              </span>
            )}

            <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 md:text-sm">
              مرحباً بعودتك
            </p>

            <h1 className="mt-1.5 font-heading text-3xl font-black leading-[1.2] tracking-tight text-slate-900 dark:text-white md:text-4xl lg:text-[2.6rem]">
              أهلاً،{" "}
              <span className="bg-gradient-to-l from-orange-500 to-orange-400 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400 md:text-[15px] md:leading-8">
              جاهز تكمل رحلتك التعليمية؟ كورساتك ومحاضراتك في مكان واحد بتجربة أوضح وأسرع.
            </p>

            {Number(enrolledCount) > 0 ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <FaBookOpen className="text-[11px]" />
                مشترك في {enrolledCount} كورس
              </div>
            ) : null}

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <motion.button
                type="button"
                onClick={onStartLearning}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 sm:w-auto"
              >
                ابدأ التعلم
                <FaArrowLeft className="text-[10px]" />
              </motion.button>

              <motion.button
                type="button"
                onClick={onContinue}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70 sm:w-auto"
              >
                <MdSchedule className="text-base" />
                أكمل من حيث توقفت
              </motion.button>

              {onActivateWithQr ? (
                <motion.button
                  type="button"
                  onClick={onActivateWithQr}
                  whileHover={reduceMotion ? undefined : { y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:w-auto"
                >
                  <FaQrcode className="text-sm text-orange-500" />
                  تفعيل QR
                </motion.button>
              ) : null}

              <InstallPWAButton
                label="تثبيت التطبيق"
                variant="solid"
                className="!shadow-md !shadow-blue-500/20"
              />
            </div>
          </motion.div>

          {/* ── Right: student ID card ── */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.06, ease: EASE }}
            className="w-full justify-self-stretch lg:max-w-sm lg:justify-self-end"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 p-[1px] shadow-[0_18px_40px_-16px_rgba(49,130,206,0.55)]">
              <div className="relative overflow-hidden rounded-[15px] bg-gradient-to-br from-blue-600 via-blue-500 to-[#1a5fad] p-5 text-white sm:p-6">
                {/* Decorative shapes */}
                <div
                  className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-orange-400/25 blur-2xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  aria-hidden
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "14px 14px",
                  }}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
                      <FaIdCard className="text-base" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100">
                        Student ID
                      </p>
                      <p className="text-xs font-bold text-white/95">بطاقة الطالب</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black text-white shadow-sm shadow-orange-600/30">
                    ACTIVE
                  </span>
                </div>

                <div className="relative mt-6">
                  <p className="text-[11px] font-semibold text-blue-100">كود الحضور / التفعيل</p>
                  {displayId ? (
                    <p className="mt-1 font-heading text-5xl font-black tabular-nums tracking-wide text-white sm:text-[3.25rem]">
                      {displayId}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-blue-100/80">غير متوفر حالياً</p>
                  )}
                </div>

                <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-white/20 pt-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-blue-100">الاسم</p>
                    <p className="truncate text-sm font-bold text-white">{fullName}</p>
                  </div>
                  {teacherName ? (
                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-semibold text-blue-100">المنصة</p>
                      <p className="truncate text-sm font-bold text-orange-200">
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
