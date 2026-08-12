import { Spinner } from "@chakra-ui/react";
import { hpContainer } from "../homeTheme";
import HomePlatformCourseCard from "./HomePlatformCourseCard";

function CourseSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="h-40 animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-1/2 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-full animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/80" />
        <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function HomeProPlatformCourses({
  courses = [],
  loading = false,
  teacherName,
  isCourseFree,
  activatingCourseId = null,
  onEnter,
  onSubscribe,
  onActivateFree,
}) {
  const count = courses.length;

  return (
    <section
      id="platform-courses"
      className="scroll-mt-[90px] pb-4 pt-2 sm:pb-6"
      dir="rtl"
      data-tour-id="home-platform-courses"
    >
      <div className={hpContainer}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              كورسات المنصة
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              اكتشف المحتوى المتاح للاشتراك والتفعيل
            </p>
          </div>

          {loading ? (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <Spinner size="sm" color="blue.500" thickness="3px" />
              جاري التحميل…
            </span>
          ) : count > 0 ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              {count.toLocaleString("ar-EG")} كورس
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <CourseSkeleton key={i} />
            ))}
          </div>
        ) : count > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const free = isCourseFree?.(course) ?? false;
              const enrolled = !!course.is_enrolled;
              return (
                <HomePlatformCourseCard
                  key={course.id}
                  course={course}
                  teacherName={teacherName}
                  isFree={free}
                  isEnrolled={enrolled}
                  isActivating={activatingCourseId === course.id}
                  onEnter={() => onEnter?.(course)}
                  onSubscribe={() => onSubscribe?.(course)}
                  onActivateFree={() => onActivateFree?.(course)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center sm:py-6">
            <div className="mx-auto flex aspect-square w-64 items-center justify-center overflow-hidden rounded-full bg-black sm:w-80">
              <img
                src="/images/platform-courses-empty-v3.jpg"
                alt="لا توجد كورسات حالياً — سيتم إضافتها قريباً"
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
