import { Link } from "react-router-dom";
import { FaCheckCircle, FaChevronLeft, FaPlayCircle } from "react-icons/fa";

function getProgress(course) {
  const total =
    course?.total_lessons ??
    course?.lectures_count ??
    course?.progress?.total_videos ??
    0;
  const done =
    course?.completed_lessons ??
    course?.progress?.watched_videos ??
    (course?.progress_percent != null
      ? Math.round((Number(course.progress_percent) / 100) * (total || 15))
      : 0);
  const percent =
    course?.progress_percent != null
      ? Math.min(100, Math.max(0, Number(course.progress_percent)))
      : total > 0
        ? Math.round((done / total) * 100)
        : 0;
  return { total: total || 15, done: done || 0, percent };
}

function getCourseLink(course) {
  const t = course.type || "course";
  if (t === "package") return `/package/${course.id}`;
  if (t === "general_course") return `/general-course/${course.id}`;
  return `/CourseDetailsPage/${course.id}`;
}

function getTypeLabel(course) {
  const t = course.type || "course";
  if (t === "package") return "باقة";
  if (t === "general_course") return "كورس عام";
  return null;
}

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

export default function HomeProCourseCard({ course, teacherName }) {
  const cover = resolveCourseCover(
    course.avatar,
    "https://images.unsplash.com/photo-1532094349884-543559743aa8?w=800&q=80",
  );

  const instructor =
    course.teacher_name ||
    course.instructor_name ||
    (teacherName ? `أ. ${teacherName}` : "المدرس");

  const gradeLabel =
    course?.grade?.name || course?.grade_name || course?.category_name || null;

  const typeLabel = getTypeLabel(course);
  const lecturesCount = course?.lectures_count ?? course?.lectures?.length ?? null;
  const linkTo = getCourseLink(course);

  const { total, done, percent } = getProgress(course);
  const hasProgress = percent > 0;
  const displayDone = hasProgress ? Math.max(done, Math.round((percent / 100) * total)) : 0;

  const buttonLabel = hasProgress ? "متابعة التعلم" : "ابدأ التعلم";
  const buttonClass = hasProgress
    ? "bg-blue-600 text-white hover:bg-blue-700"
    : "border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 dark:bg-transparent dark:hover:bg-blue-950/40";

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
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            <FaCheckCircle className="text-[10px]" />
            {typeLabel || "مشترك"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-heading text-base font-bold leading-snug text-slate-900 dark:text-white">
          {course.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">{instructor}</p>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">مشترك</span>
        </div>

        {course.description ? (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {course.description}
          </p>
        ) : null}

        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
              {lecturesCount != null ? (
                <>
                  <FaPlayCircle className="text-blue-500" />
                  {displayDone} من {total} درس
                </>
              ) : (
                <>
                  {displayDone} من {total} درس
                </>
              )}
            </span>
            <span className="font-bold text-blue-600">{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <Link
          to={linkTo}
          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${buttonClass}`}
        >
          {buttonLabel}
          <FaChevronLeft className="text-[10px]" />
        </Link>
      </div>
    </article>
  );
}
