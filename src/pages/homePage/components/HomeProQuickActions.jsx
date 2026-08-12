import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaClipboardList,
  FaFire,
  FaKey,
} from "react-icons/fa";
import { MdSchedule } from "react-icons/md";
import { hpContainer } from "../homeTheme";
import HomeProActivateCourse from "./HomeProActivateCourse";

const ACTIONS = [
  {
    key: "activate",
    label: "تفعيل كورس",
    desc: "فعل كورس باستخدام كود الاشتراك",
    icon: FaKey,
    accent: true,
  },
  {
    to: "/exam_grades",
    label: "امتحاناتي",
    desc: "تابع نتائج ودرجات امتحاناتك",
    icon: FaClipboardList,
  },
  {
    to: "/lectures_taple",
    label: "الجدول",
    desc: "شاهد جدول المحاضرات والمواعيد",
    icon: MdSchedule,
  },
  {
    to: "/student-daily-quizzes",
    label: "المسابقة",
    desc: "شارك في المسابقة اليومية وتابع ترتيبك",
    icon: FaFire,
  },
  {
    to: "/my-courses",
    label: "كورساتي",
    desc: "الوصول إلى الكورسات المشترك بها",
    icon: FaBookOpen,
  },
];

function ActionCard({ item, onActivateClick }) {
  const Icon = item.icon;
  const isActivate = item.key === "activate";

  const body = (
    <>
      <span
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
          item.accent
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
            : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        }`}
      >
        <Icon className="text-base" />
      </span>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {item.desc}
      </p>
    </>
  );

  const className =
    "group flex min-h-[140px] min-w-[150px] flex-1 flex-col rounded-2xl border border-slate-200/90 bg-white p-4 text-right shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800 sm:min-w-0";

  if (isActivate) {
    return (
      <button type="button" onClick={onActivateClick} className={className}>
        {body}
      </button>
    );
  }

  return (
    <Link to={item.to} className={`${className} hover:no-underline`}>
      {body}
    </Link>
  );
}

export default function HomeProQuickActions({ onCourseActivated }) {
  return (
    <section className="py-4 sm:py-5" dir="rtl" data-tour-id="home-quick-actions">
      <div className={hpContainer}>
        <div className="mb-4">
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
            ابدأ من هنا
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            وصول سريع لأهم أقسام المنصة
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
          {ACTIONS.map((item) =>
            item.key === "activate" ? (
              <HomeProActivateCourse
                key={item.key}
                onActivated={onCourseActivated}
                renderTrigger={(open) => (
                  <ActionCard item={item} onActivateClick={open} />
                )}
              />
            ) : (
              <ActionCard key={item.to} item={item} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
