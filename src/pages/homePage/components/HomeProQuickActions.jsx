import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaClipboardList,
  FaFire,
  FaQrcode,
  FaRobot,
} from "react-icons/fa";
import { MdSchedule } from "react-icons/md";
import { HP_BLUE, HP_ORANGE, hpContainer } from "../homeTheme";

const ACTIONS = [
  {
    to: "/my-courses",
    label: "كورساتي",
    desc: "المحتوى المشترك",
    icon: FaBookOpen,
  },
  {
    to: "/student-daily-quizzes",
    label: "المسابقة",
    desc: "تحدي يومي وترتيب",
    icon: FaFire,
  },
  {
    to: "/lectures_taple",
    label: "الجدول",
    desc: "مواعيد المحاضرات",
    icon: MdSchedule,
  },
  {
    to: "/exam_grades",
    label: "امتحاناتي",
    desc: "الدرجات والتقارير",
    icon: FaClipboardList,
  },
  {
    to: "/scientific-chat",
    label: "المساعد",
    desc: "اسأل من مواد الكورس",
    icon: FaRobot,
  },
];

export default function HomeProQuickActions({ onActivateWithQr }) {
  return (
    <section className="py-5 sm:py-6" dir="rtl">
      <div className={hpContainer}>
        <div className="mb-3.5">
          <h2 className="font-heading text-lg font-bold text-slate-800 dark:text-white sm:text-xl">
            ابدأ من هنا
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">اختصارات لأهم أدواتك</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-6">
          {ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_20px_-10px_rgba(26,32,44,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_28px_-12px_rgba(49,130,206,0.28)] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800"
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white transition group-hover:scale-105"
                  style={{ background: HP_BLUE }}
                >
                  <Icon className="text-[15px]" />
                </div>
                <p className="font-heading text-sm font-bold text-slate-800 dark:text-white">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                  {item.desc}
                </p>
              </Link>
            );
          })}

          {onActivateWithQr ? (
            <button
              type="button"
              onClick={onActivateWithQr}
              className="group col-span-2 cursor-pointer rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-right transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30 md:col-span-1"
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white transition group-hover:scale-105"
                style={{ background: HP_ORANGE }}
              >
                <FaQrcode className="text-[15px]" />
              </div>
              <p className="font-heading text-sm font-bold text-slate-800 dark:text-white">
                تفعيل كورس
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                بالكود أو مسح QR
              </p>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
