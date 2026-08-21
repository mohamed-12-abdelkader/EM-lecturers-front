import { useNavigate } from "react-router-dom";
import HomePlatformCourseCard from "./HomePlatformCourseCard";

function getCourseLink(course) {
  const t = course.type || "course";
  if (t === "package") return `/package/${course.id}`;
  if (t === "general_course") return `/general-course/${course.id}`;
  return `/CourseDetailsPage/${course.id}`;
}

function isCourseFree(course) {
  const price = Number(course?.price);
  return course?.is_free === true || (!Number.isNaN(price) && price <= 0);
}

export default function HomeProCourseCard({ course, teacherName }) {
  const navigate = useNavigate();

  return (
    <HomePlatformCourseCard
      course={course}
      teacherName={teacherName}
      isFree={isCourseFree(course)}
      isEnrolled
      onEnter={() => navigate(getCourseLink(course))}
    />
  );
}

export function HomeProCourseCardSkeleton() {
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
