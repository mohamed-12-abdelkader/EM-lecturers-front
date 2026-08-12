import { FaCheckCircle, FaChevronLeft, FaLock, FaPlayCircle } from "react-icons/fa";

const DEFAULT_COURSE_COVER =
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80";

function resolveCourseCover(url, fallback = DEFAULT_COURSE_COVER) {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  return trimmed;
}

function handleCoverError(event, fallback = DEFAULT_COURSE_COVER) {
  const img = event?.currentTarget;
  if (!img || img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = fallback;
}

export default function HomePlatformCourseCard({
  course,
  teacherName,
  isFree,
  isEnrolled,
  isActivating = false,
  onEnter,
  onSubscribe,
  onActivateFree,
}) {
  const cover = resolveCourseCover(course.avatar);

  const gradeLabel = course?.grade?.name || course?.grade_name || course?.category_name || null;
  const instructor = teacherName ? `أ. ${teacherName}` : "المدرس";
  const lecturesCount = course?.lectures_count ?? course?.lectures?.length ?? null;

  const priceLabel = isFree ? "مجاني" : course?.price != null ? `${course.price} ج.م` : "مدفوع";

  const status = isEnrolled
    ? { label: "مشترك", className: "bg-emerald-500 text-white" }
    : isFree
      ? { label: "مجاني", className: "bg-blue-600 text-white" }
      : { label: "مدفوع", className: "bg-orange-500 text-white" };

  const handlePrimary = () => {
    if (isEnrolled || isFree) {
      onEnter?.();
      return;
    }
    onSubscribe?.();
  };

  const buttonLabel = isEnrolled || isFree ? "دخول للكورس" : "تفعيل الكورس";

  const buttonClass =
    isEnrolled || isFree
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-orange-500 text-white hover:bg-orange-600";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800">
      <div className="relative h-40 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={cover}
          alt={course.title || "كورس"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          onError={handleCoverError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {gradeLabel ? (
            <span className="rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-200">
              {gradeLabel}
            </span>
          ) : (
            <span />
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${status.className}`}
          >
            {isEnrolled ? <FaCheckCircle className="text-[10px]" /> : null}
            {!isEnrolled && !isFree ? <FaLock className="text-[10px]" /> : null}
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-heading text-base font-bold leading-snug text-slate-900 dark:text-white">
          {course.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">{instructor}</p>
          <span
            className={`text-sm font-bold ${
              isFree || isEnrolled ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"
            }`}
          >
            {priceLabel}
          </span>
        </div>

        {course.description ? (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {course.description}
          </p>
        ) : null}

        {lecturesCount != null ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <FaPlayCircle className="text-blue-500" />
            {lecturesCount} محاضرة
          </p>
        ) : (
          <div className="mt-3 flex-1" />
        )}

        <button
          type="button"
          onClick={handlePrimary}
          disabled={isActivating}
          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors disabled:cursor-wait disabled:opacity-70 ${buttonClass}`}
        >
          {isActivating ? "جاري التفعيل…" : buttonLabel}
          {!isActivating ? <FaChevronLeft className="text-[10px]" /> : null}
        </button>
      </div>
    </article>
  );
}
