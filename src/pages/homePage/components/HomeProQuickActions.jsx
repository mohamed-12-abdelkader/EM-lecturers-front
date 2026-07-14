import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaClipboardList,
  FaQrcode,
  FaRobot,
  FaArrowLeft,
} from "react-icons/fa";
import { MdSchedule } from "react-icons/md";

const ACTIONS = [
  {
    to: "/my-courses",
    label: "كورساتي",
    desc: "المحتوى المشترك",
    icon: FaBookOpen,
    tone: "bg-blue-500",
  },
  {
    to: "/lectures_taple",
    label: "جدول المحاضرات",
    desc: "تابع تقدّمك",
    icon: MdSchedule,
    tone: "bg-orange-500",
  },
  {
    to: "/exam_grades",
    label: "امتحاناتي",
    desc: "الدرجات والتقارير",
    icon: FaClipboardList,
    tone: "bg-emerald-500",
  },
  {
    to: "/scientific-chat",
    label: "المساعد العلمي",
    desc: "اسأل من مواد الكورس",
    icon: FaRobot,
    tone: "bg-sky-500",
  },
];

export default function HomeProQuickActions({ onActivateWithQr }) {
  return (
    <section dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-black text-slate-900 dark:text-white md:text-xl">
              اختصارات سريعة
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">الوصول لأهم صفحاتك بضغطة واحدة</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800"
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${item.tone}`}
                >
                  <Icon className="text-sm" />
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500 opacity-0 transition group-hover:opacity-100">
                  فتح
                  <FaArrowLeft className="text-[9px]" />
                </span>
              </Link>
            );
          })}

          {onActivateWithQr ? (
            <button
              type="button"
              onClick={onActivateWithQr}
              className="group rounded-2xl border border-dashed border-orange-300 bg-orange-50/70 p-4 text-right transition duration-200 hover:-translate-y-1 hover:border-orange-400 hover:bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                <FaQrcode className="text-sm" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white">تفعيل كورس</p>
              <p className="mt-0.5 text-xs text-slate-500">بالكود أو QR</p>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
