import { FaArrowLeft, FaQrcode, FaUser } from "react-icons/fa";
import {
  hpBtnOutline,
  hpBtnPrimary,
  hpContainer,
  hpHeading,
} from "../homeTheme";

export default function HomeProHero({
  studentName,
  studentId,
  teacherName,
  teacherAvatar,
  onStartLearning,
  onContinue,
  onActivateWithQr,
}) {
  const displayId = studentId != null && studentId !== "" ? String(studentId) : null;

  return (
    <section
      className="border-b border-blue-100 bg-gradient-to-bl from-blue-50 via-blue-50/80 to-white dark:border-blue-900/40 dark:from-blue-950/50 dark:via-slate-900 dark:to-slate-900"
      dir="rtl"
    >
      <div className={`${hpContainer} py-6 md:py-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          {/* ترحيب + إجراءات */}
          <div className="min-w-0 flex-1">
            {teacherName ? (
              <p className="mb-2 font-sans text-sm font-medium text-blue-600/80 dark:text-blue-300/80">
                منصة مستر {teacherName}
              </p>
            ) : null}

            <h1 className={`${hpHeading} leading-tight text-slate-900 dark:text-white`}>
              مرحبًا،{" "}
              <span className="text-[#3182CE]">{studentName || "عزيزي الطالب"}</span>
            </h1>

            {teacherName && (
              <div className="mt-3 flex items-center gap-2.5">
                {teacherAvatar ? (
                  <img
                    src={teacherAvatar}
                    alt={teacherName}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-blue-500 shadow-sm dark:bg-slate-800">
                    <FaUser className="text-xs" />
                  </span>
                )}
                <span className="font-sans text-sm text-slate-600 dark:text-slate-300">
                  مستر {teacherName}
                </span>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                className={`${hpBtnPrimary} w-full sm:w-auto`}
                onClick={onStartLearning}
              >
                ابدأ التعلم
                <FaArrowLeft className="text-[10px]" />
              </button>
              <button
                type="button"
                className={`${hpBtnOutline} w-full sm:w-auto`}
                onClick={onContinue}
              >
                أكمل من حيث توقفت
              </button>
              {onActivateWithQr ? (
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/70 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-white hover:text-[#DD6B20] dark:bg-slate-800/60 dark:text-blue-200 dark:hover:bg-slate-800 sm:w-auto"
                  onClick={onActivateWithQr}
                >
                  <FaQrcode className="text-base" />
                  تفعيل بالـ QR
                </button>
              ) : null}
            </div>
          </div>

          {/* كود الطالب */}
          <div className="w-full shrink-0 lg:w-auto lg:border-r lg:border-blue-200/60 lg:pr-8 dark:lg:border-blue-800/50">
            <div className="rounded-xl border border-white/80 bg-white/90 px-6 py-4 text-center shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sm:min-w-[200px]">
              <p className="font-sans text-xs font-medium text-slate-500 dark:text-slate-400">
                كود الطالب
              </p>
              {displayId ? (
                <p className="mt-1 font-heading text-3xl font-bold tabular-nums tracking-wide text-[#3182CE] dark:text-blue-400">
                  {displayId}
                </p>
              ) : (
                <p className="mt-2 font-sans text-xs text-slate-400">غير متوفر</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
