import {
  FaCheckCircle,
  FaChevronLeft,
  FaEye,
  FaLock,
  FaPlay,
  FaUserGraduate,
} from "react-icons/fa";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";

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
  onPreview,
}) {
  const cover = resolveCourseCover(course.avatar);
  const gradeLabel = course?.grade?.name || course?.grade_name || course?.category_name || null;
  const instructor = teacherName ? `أ. ${teacherName}` : "المدرس";
  const lecturesCount = course?.lectures_count ?? course?.lectures?.length ?? null;
  const priceLabel = isFree
    ? "مجاني"
    : course?.price != null
      ? `${Number(course.price).toLocaleString("ar-EG")} ج.م`
      : "مدفوع";

  const accent = isEnrolled || isFree ? BLUE : ORANGE;

  const handlePrimary = () => {
    if (isEnrolled) {
      onEnter?.();
      return;
    }
    if (isFree) {
      if (onActivateFree) onActivateFree();
      else onEnter?.();
      return;
    }
    onSubscribe?.();
  };

  const buttonLabel = isEnrolled
    ? "دخول للكورس"
    : isFree
      ? "تفعيل مجاني"
      : "تفعيل الكورس";

  const showPreview = !isEnrolled;

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_-22px_rgba(49,130,206,0.4)] dark:bg-slate-900 dark:ring-slate-700"
    >
      <div
        className="absolute inset-y-0 right-0 w-1.5 opacity-90"
        style={{ background: accent }}
        aria-hidden
      />

      <div className="relative mx-3 mt-3 overflow-hidden rounded-[1.1rem]">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={cover}
            alt={course.title || "كورس"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            loading="lazy"
            onError={handleCoverError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/75 via-[#0F172A]/15 to-transparent" />

          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            {gradeLabel ? (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-200">
                {gradeLabel}
              </span>
            ) : (
              <span />
            )}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-md"
              style={{ background: accent }}
            >
              {isEnrolled ? <FaCheckCircle className="text-[10px]" /> : null}
              {!isEnrolled && !isFree ? <FaLock className="text-[10px]" /> : null}
              {isEnrolled ? "مشترك" : isFree ? "مجاني" : "مدفوع"}
            </span>
          </div>

          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <span className="rounded-xl bg-white/95 px-3 py-1.5 font-cairo text-sm font-extrabold shadow-sm backdrop-blur-sm dark:bg-slate-900/90"
              style={{ color: accent }}
            >
              {priceLabel}
            </span>
            {lecturesCount != null ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur-md ring-1 ring-white/25">
                <FaPlay className="text-[9px]" />
                {lecturesCount} محاضرة
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <h3 className="line-clamp-2 min-h-[2.9rem] font-cairo text-[1.05rem] font-extrabold leading-snug tracking-tight text-slate-900 transition group-hover:text-[#3182CE] dark:text-white dark:group-hover:text-blue-300">
          {course.title}
        </h3>

        <div className="mt-3 flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${accent}, ${isFree || isEnrolled ? "#2B6CB0" : "#C05621"})` }}
          >
            <FaUserGraduate className="text-sm" />
          </span>
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{instructor}</p>
            <p className="text-[11px] font-medium text-slate-400">مدرّس الكورس</p>
          </div>
        </div>

        {course.description ? (
          <p className="mt-3 line-clamp-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
            {course.description}
          </p>
        ) : (
          <div className="mt-3 flex-1" />
        )}

        <div className="mt-4 flex gap-2">
          {showPreview ? (
            <button
              type="button"
              onClick={() => onPreview?.()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-[#3182CE] transition hover:border-[#3182CE] hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-blue-950/40"
            >
              <FaEye className="text-sm" />
              معاينة مجانية
            </button>
          ) : null}

          <button
            type="button"
            onClick={handlePrimary}
            disabled={isActivating}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-wait disabled:opacity-70 ${
              showPreview ? "flex-[1.15]" : "w-full"
            }`}
            style={{ background: accent }}
          >
            {isActivating ? "جاري التفعيل…" : buttonLabel}
            {!isActivating ? <FaChevronLeft className="text-[9px]" /> : null}
          </button>
        </div>
      </div>
    </article>
  );
}
