import { FaArrowLeft, FaQrcode, FaUser, FaPlay } from "react-icons/fa";
import { MdSchedule } from "react-icons/md";
import InstallPWAButton from "../../../components/pwa/InstallPWAButton";

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
  const firstName = (studentName || "عزيزي الطالب").split(" ")[0];

  return (
    <section className="relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-bl from-[#1D4ED8] via-[#2563EB] to-[#0EA5E9]" />
      <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-orange-400/25 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="min-w-0 flex-1">
            {teacherName ? (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                {teacherAvatar ? (
                  <img
                    src={teacherAvatar}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover ring-2 ring-white/40"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
                    <FaUser className="text-[10px]" />
                  </span>
                )}
                <span className="text-xs font-bold text-white/95">منصة مستر {teacherName}</span>
              </div>
            ) : null}

            <p className="mb-2 text-sm font-semibold text-blue-100">مرحباً بعودتك</p>
            <h1 className="font-heading text-3xl font-black leading-tight tracking-tight text-white md:text-4xl lg:text-[2.75rem]">
              أهلاً، <span className="text-orange-200">{firstName}</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-blue-50/90 md:text-base">
              تابع كورساتك، أكمل محاضراتك، وفعّل المحتوى الجديد من مكان واحد بتجربة أوضح وأسرع.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={onStartLearning}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 sm:w-auto"
              >
                ابدأ التعلم
                <FaArrowLeft className="text-[10px]" />
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
              >
                <MdSchedule className="text-base" />
                أكمل من حيث توقفت
              </button>
              {onActivateWithQr ? (
                <button
                  type="button"
                  onClick={onActivateWithQr}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:w-auto"
                >
                  <FaQrcode className="text-base" />
                  تفعيل بالـ QR
                </button>
              ) : null}
              {/* PWA: يظهر فقط إذا كان التثبيت متاحاً وغير مثبت */}
              <InstallPWAButton label="تثبيت التطبيق" variant="hero" />
            </div>
          </div>

          <div className="w-full shrink-0 lg:w-[260px]">
            <div className="rounded-2xl border border-white/30 bg-white/15 p-5 text-center shadow-xl backdrop-blur-md">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white">
                <FaPlay className="text-sm" />
              </div>
              <p className="text-xs font-semibold text-blue-100">كود الطالب</p>
              {displayId ? (
                <p className="mt-1 font-heading text-4xl font-black tabular-nums tracking-wide text-white">
                  {displayId}
                </p>
              ) : (
                <p className="mt-2 text-xs text-blue-100/80">غير متوفر حالياً</p>
              )}
              <p className="mt-2 text-[11px] leading-5 text-blue-50/75">
                استخدمه عند التفعيل أو الدعم الفني
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
