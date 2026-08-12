import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import { Spinner } from "@chakra-ui/react";
import baseUrl from "../../../api/baseUrl";
import { readAuthToken } from "../../../utils/authStorage";
import { hpContainer } from "../homeTheme";
import HomeProCourseCard from "./HomeProCourseCard";

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
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              كورساتي
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              المحتوى الذي اشتركت به
            </p>
          </div>
          <Link
            to="/my-courses"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            عرض الكل
            <FaChevronLeft className="text-[10px]" />
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <Spinner size="md" color="blue.500" thickness="3px" />
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
          <div className="flex flex-col items-center py-6 text-center sm:py-8">
            <div className="mx-auto flex aspect-square w-64 items-center justify-center overflow-hidden rounded-full bg-black sm:w-80">
              <img
                src="/images/my-courses-empty-v2.jpg"
                alt="لا توجد كورسات مسجلة بعد"
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <h3 className="mt-4 font-heading text-lg font-bold text-slate-900 dark:text-white">
              لست مشترك
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              لم تشترك في أي كورس بعد. فعّل كورساً من قسم «ابدأ من هنا» أو تصفّح كورسات المنصة.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
