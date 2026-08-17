import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaChevronLeft,
  FaClipboardList,
  FaFire,
  FaKey,
} from "react-icons/fa";
import { MdSchedule } from "react-icons/md";
import { hpContainer, hpEyebrow, hpSectionTitle } from "../homeTheme";
import HomeProActivateCourse from "./HomeProActivateCourse";

const ACTIONS = [
  {
    key: "activate",
    label: "تفعيل كورس",
    desc: "فعل كورس باستخدام كود الاشتراك",
    icon: FaKey,
    featured: true,
  },
  {
    to: "/exam_grades",
    label: "امتحاناتي",
    desc: "نتائج ودرجات امتحاناتك",
    icon: FaClipboardList,
    tone: "blue",
  },
  {
    to: "/lectures_taple",
    label: "الجدول",
    desc: "مواعيد المحاضرات",
    icon: MdSchedule,
    tone: "violet",
  },
  {
    to: "/student-daily-quizzes",
    label: "المسابقة",
    desc: "المسابقة اليومية وترتيبك",
    icon: FaFire,
    tone: "orange",
  },
  {
    to: "/my-courses",
    label: "كورساتي",
    desc: "كورساتك المشترك بها",
    icon: FaBookOpen,
    tone: "emerald",
  },
];

const TONE_STYLES = {
  blue: {
    icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    hover: "hover:border-blue-200 dark:hover:border-blue-800",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
    hover: "hover:border-violet-200 dark:hover:border-violet-800",
  },
  orange: {
    icon: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
    hover: "hover:border-orange-200 dark:hover:border-orange-800",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    hover: "hover:border-emerald-200 dark:hover:border-emerald-800",
  },
};

const CAROUSEL_CARD =
  "min-w-[58vw] max-w-[58vw] shrink-0 snap-start sm:min-w-[190px] sm:max-w-[190px] md:min-w-0 md:max-w-none";

function ActionCard({ item, onActivateClick, layout = "grid" }) {
  const Icon = item.icon;
  const isActivate = item.key === "activate";
  const tone = TONE_STYLES[item.tone] || TONE_STYLES.blue;
  const isCarousel = layout === "carousel";

  const baseClass = isActivate
    ? `group relative flex flex-col overflow-hidden border border-blue-200/80 bg-gradient-to-l from-blue-600 to-blue-500 text-right text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/30 ${
        isCarousel
          ? `min-h-[108px] rounded-xl p-3 ${CAROUSEL_CARD}`
          : "min-h-[132px] rounded-2xl p-4"
      }`
    : `group flex flex-col border border-slate-200/90 bg-white text-right shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 ${tone.hover} ${
        isCarousel
          ? `min-h-[108px] rounded-xl p-3 ${CAROUSEL_CARD}`
          : "min-h-[132px] rounded-2xl p-4"
      }`;

  const iconWrapClass = isCarousel
    ? "mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
    : "mb-3 flex h-10 w-10 items-center justify-center rounded-xl";

  const titleClass = isCarousel
    ? "text-[13px] font-bold leading-snug"
    : "text-sm font-bold sm:text-base";

  const descClass = isCarousel
    ? "mt-1 text-[10px] leading-relaxed"
    : "mt-1.5 text-xs leading-relaxed";

  const body = isActivate ? (
    <>
      <span
        className="pointer-events-none absolute -left-4 -top-4 h-16 w-16 rounded-full bg-white/10"
        aria-hidden
      />
      <span className={`relative bg-white/20 text-white ${iconWrapClass}`}>
        <Icon className={isCarousel ? "text-sm" : "text-base"} />
      </span>
      <div className="relative min-w-0 flex-1">
        <h3 className={titleClass}>{item.label}</h3>
        <p className={`${descClass} text-blue-100`}>{item.desc}</p>
      </div>
    </>
  ) : (
    <>
      <span className={`${tone.icon} ${iconWrapClass}`}>
        <Icon className={isCarousel ? "text-sm" : "text-base"} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className={`${titleClass} text-slate-900 dark:text-white`}>{item.label}</h3>
        <p className={`${descClass} text-slate-500 dark:text-slate-400`}>{item.desc}</p>
      </div>
      {!isCarousel ? (
      <FaChevronLeft
        className="mt-2 self-end text-[10px] text-slate-300 opacity-0 transition-all group-hover:opacity-100 dark:text-slate-600"
        aria-hidden
      />
      ) : null}
    </>
  );

  if (isActivate) {
    return (
      <button type="button" onClick={onActivateClick} className={baseClass}>
        {body}
      </button>
    );
  }

  return (
    <Link to={item.to} className={`${baseClass} hover:no-underline`}>
      {body}
    </Link>
  );
}

function renderAction(item, onCourseActivated, layout) {
  if (item.key === "activate") {
    return (
      <HomeProActivateCourse
        key={item.key}
        onActivated={onCourseActivated}
        renderTrigger={(open) => (
          <ActionCard item={item} onActivateClick={open} layout={layout} />
        )}
      />
    );
  }

  return <ActionCard key={item.to} item={item} layout={layout} />;
}

export default function HomeProQuickActions({ onCourseActivated }) {
  return (
    <section className="py-4 sm:py-6" dir="rtl" data-tour-id="home-quick-actions">
      <div className={hpContainer}>
        <div className="mb-3 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className={hpEyebrow}>اختصارات</span>
            <h2 className={`${hpSectionTitle} mt-2`}>ابدأ من هنا</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              وصول سريع لأهم أقسام المنصة
            </p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 md:hidden">
            اسحب للتنقل بين الأقسام ←
          </p>
          <p className="hidden text-xs text-slate-400 dark:text-slate-500 md:block">
            {ACTIONS.length} أقسام
          </p>
        </div>

        {/* موبايل / تابلت صغير: كarousel أفقي */}
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
          aria-label="اختصارات المنصة"
        >
          {ACTIONS.map((item) => renderAction(item, onCourseActivated, "carousel"))}
        </div>

        {/* ديسكتوب: شبكة */}
        <div className="hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-5">
          {ACTIONS.map((item) => renderAction(item, onCourseActivated, "grid"))}
        </div>
      </div>
    </section>
  );
}
