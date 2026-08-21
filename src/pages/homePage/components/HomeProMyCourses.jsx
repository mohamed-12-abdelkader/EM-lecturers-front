import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import baseUrl from "../../../api/baseUrl";
import { readAuthToken } from "../../../utils/authStorage";
import { hpContainer } from "../homeTheme";
import HomeProCourseCard, { HomeProCourseCardSkeleton } from "./HomeProCourseCard";

export default function HomeProMyCourses({ teacherName, limit = 4, refreshKey = 0 }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeader = useMemo(() => {
    const token = readAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await baseUrl.get("/api/course/my-enrollments", {
          headers: authHeader,
        });
        const root = res?.data?.data ?? res?.data;
        const items = Array.isArray(root?.items) ? root.items : [];
        if (mounted) setCourses(items.slice(0, limit));
      } catch {
        if (mounted) setCourses([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authHeader, limit, refreshKey]);

  return (
    <section className="pb-2 pt-2 sm:pb-4" dir="rtl" data-tour-id="home-my-courses">
      <div className={hpContainer}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              كورساتي
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              المحتوى الذي اشتركت به
            </p>
          </div>
          <Link
            to="/my-courses"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 hover:no-underline dark:text-blue-400"
          >
            عرض الكل
            <FaChevronLeft className="text-[10px]" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
              <HomeProCourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <HomeProCourseCard
                key={`${course.type || "course"}-${course.id}`}
                course={course}
                teacherName={teacherName}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mx-auto flex aspect-square w-48 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 sm:w-56">
              <img
                src="/images/my-courses-empty-v2.jpg"
                alt="لا توجد كورسات مسجلة بعد"
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <h3 className="mt-3 font-heading text-base font-bold text-slate-900 dark:text-white">
              لست مشترك
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              لم تشترك في أي كورس بعد. فعّل كورساً من قسم «ابدأ من هنا» أو تصفّح كورسات المنصة.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
