import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantPublicCourses } from "../../../api/tenantPublicApi";
import TenantPublicShell from "../TenantPublicShell";
import TenantBreadcrumb from "../components/TenantBreadcrumb";
import TenantCourseCard from "../components/TenantCourseCard";
import { TenantPublicEmpty, TenantPublicSkeleton } from "../components/TenantPublicStates";

const PAGE_TITLES = {
  all: "جميع الكورسات",
  latest: "أحدث الكورسات",
  popular: "الأكثر مشاهدة",
};

/**
 * Courses listing with filtering — sort: all | latest | popular
 */
export default function TenantCoursesListPage({ subdomain, sort = "all" }) {
  const [gradeFilter, setGradeFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const { data: gradesData } = useQuery({
    queryKey: ["tenant-grades", subdomain],
    queryFn: () => fetchTenantGrades(subdomain),
    staleTime: 300_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-courses-list", subdomain, gradeFilter],
    queryFn: () => fetchTenantPublicCourses(subdomain, gradeFilter || undefined),
    staleTime: 60_000,
  });

  const courses = useMemo(() => {
    let list = data?.data?.courses || [];
    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.title || c.name || "").toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q),
      );
    }
    if (sort === "latest") {
      list = [...list].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );
    } else if (sort === "popular") {
      list = [...list].sort(
        (a, b) =>
          Number(b.view_count || b.students_count || 0) -
          Number(a.view_count || a.students_count || 0),
      );
    }
    return list;
  }, [data, sort, searchFilter]);

  const grades = gradesData?.data?.grades || [];
  const title = PAGE_TITLES[sort] || PAGE_TITLES.all;

  return (
    <TenantPublicShell subdomain={subdomain} seoPage="courses">
      <TenantBreadcrumb
        items={[
          { name: "الرئيسية", path: "/" },
          { name: title, path: sort === "all" ? "/courses" : `/courses/${sort}` },
        ]}
      />

      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          استعرض الكورسات المتاحة واختر ما يناسبك
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <TabLink to="/courses" active={sort === "all"}>
            الكل
          </TabLink>
          <TabLink to="/courses/latest" active={sort === "latest"}>
            الأحدث
          </TabLink>
          <TabLink to="/courses/popular" active={sort === "popular"}>
            الأكثر مشاهدة
          </TabLink>
        </div>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="ابحث في الكورسات..."
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
          aria-label="بحث في الكورسات"
        />
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
          aria-label="فلترة حسب الصف"
        >
          <option value="">كل الصفوف</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <TenantPublicSkeleton rows={6} />
      ) : courses.length === 0 ? (
        <TenantPublicEmpty
          title="لا توجد كورسات"
          description="جرّب تغيير الفلاتر أو عد لاحقاً."
          action={
            <Link to="/" className="text-sm font-semibold text-blue-600">
              العودة للرئيسية
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <TenantCourseCard key={course.id} course={course} highlightQuery={searchFilter} />
          ))}
        </div>
      )}
    </TenantPublicShell>
  );
}

function TabLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
