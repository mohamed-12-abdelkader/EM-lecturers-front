import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaChevronLeft,
  FaClipboardList,
  FaFire,
  FaKey,
  FaTrophy,
} from "react-icons/fa";
import { MdSchedule } from "react-icons/md";
import { hpContainer } from "../homeTheme";
import HomeProActivateCourse from "./HomeProActivateCourse";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";

const ACTIONS = [
  {
    key: "activate",
    label: "تفعيل كورس",
    desc: "كود الاشتراك أو QR",
    icon: FaKey,
    featured: true,
  },
  {
    to: "/exam_grades",
    label: "امتحاناتي",
    desc: "النتائج والدرجات",
    icon: FaClipboardList,
    tone: "blue",
  },
  {
    to: "/lectures_taple",
    label: "الجدول",
    desc: "مواعيد المحاضرات",
    icon: MdSchedule,
    tone: "blue",
  },
  {
    to: "/student-daily-quizzes",
    label: "المسابقة",
    desc: "التحدي اليومي",
    icon: FaFire,
    tone: "orange",
  },
  {
    to: "/my-points",
    label: "نقاطي",
    desc: "رصيدك في الصف",
    icon: FaTrophy,
    tone: "orange",
  },
  {
    to: "/my-courses",
    label: "كورساتي",
    desc: "المحتوى المشترك",
    icon: FaBookOpen,
    tone: "blue",
  },
];

function ActionCard({ item, onActivateClick }) {
  const Icon = item.icon;
  const featured = item.featured;
  const orange = item.tone === "orange";
  const accent = featured || orange ? ORANGE : BLUE;

  if (featured) {
    return (
      <button
        type="button"
        onClick={onActivateClick}
        className="group relative flex h-full min-h-[96px] w-full flex-col overflow-hidden rounded-2xl p-3 text-right text-white shadow-[0_10px_24px_-12px_rgba(221,107,32,0.5)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-12px_rgba(221,107,32,0.55)] sm:min-h-[108px] sm:p-3.5"
        style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #C05621 100%)` }}
      >
        <Icon
          aria-hidden
          className="pointer-events-none absolute -bottom-2 -left-1 rotate-[-18deg] text-[4rem] text-white/20 transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110"
        />
        <span className="relative z-[1] mb-auto flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="text-sm" />
        </span>
        <div className="relative z-[1] mt-2.5">
          <h3 className="font-cairo text-sm font-extrabold">{item.label}</h3>
          <p className="mt-0.5 text-[10px] leading-4 text-orange-50/90">{item.desc}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold">
            ابدأ الآن
            <FaChevronLeft className="text-[8px] transition group-hover:-translate-x-0.5" />
          </span>
        </div>
      </button>
    );
  }

  return (
    <Link
      to={item.to}
      className="group relative flex min-h-[96px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 text-right shadow-[0_8px_22px_-18px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_14px_28px_-16px_rgba(49,130,206,0.3)] hover:no-underline dark:border-slate-700 dark:bg-slate-900 sm:min-h-[108px] sm:p-3.5"
    >
      <span
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent }}
        aria-hidden
      />
      <Icon
        aria-hidden
        className="pointer-events-none absolute -bottom-3 -left-2 rotate-[-16deg] text-[3.75rem] opacity-[0.07] transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:opacity-[0.12]"
        style={{ color: accent }}
      />

      <span
        className={`relative z-[1] mb-auto flex h-8 w-8 items-center justify-center rounded-xl ${
          orange
            ? "bg-orange-50 text-[#DD6B20] dark:bg-orange-950/40"
            : "bg-blue-50 text-[#3182CE] dark:bg-blue-950/40"
        }`}
      >
        <Icon className="text-sm" />
      </span>

      <div className="relative z-[1] mt-2.5">
        <h3 className="font-cairo text-[13px] font-extrabold text-slate-900 dark:text-white">
          {item.label}
        </h3>
        <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{item.desc}</p>
        <span
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold"
          style={{ color: accent }}
        >
          ادخل
          <FaChevronLeft className="text-[8px] transition group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export default function HomeProQuickActions({ onCourseActivated, enrolledCourseIds = [] }) {
  return (
    <section className="hidden py-7 sm:block" dir="rtl" data-tour-id="home-quick-actions">
      <div className={hpContainer}>
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#3182CE] dark:bg-blue-950/50 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DD6B20]" />
              اختصارات
            </span>
            <h2 className="mt-2 font-cairo text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              ابدأ من هنا
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              وصول سريع لأهم أقسام المنصة
            </p>
          </div>
          <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:inline-flex">
            {ACTIONS.length} أدوات
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {ACTIONS.map((item) =>
            item.key === "activate" ? (
              <div key={item.key} className="col-span-2 h-full sm:col-span-1">
                <HomeProActivateCourse
                  onActivated={onCourseActivated}
                  enrolledCourseIds={enrolledCourseIds}
                  renderTrigger={(open) => (
                    <ActionCard item={item} onActivateClick={open} />
                  )}
                />
              </div>
            ) : (
              <ActionCard key={item.to} item={item} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
