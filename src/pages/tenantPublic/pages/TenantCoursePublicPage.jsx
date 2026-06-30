import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaEye, FaStar, FaUsers } from "react-icons/fa";
import { fetchTenantCoursePage } from "../../../api/tenantPublicApi";
import TenantPublicShell from "../TenantPublicShell";
import TenantBreadcrumb from "../components/TenantBreadcrumb";
import TenantPublicImage from "../components/TenantPublicImage";
import { TenantPublicSkeleton, TenantPublicNotFound } from "../components/TenantPublicStates";

/**
 * Public course landing page — GET /api/tenants/public/:subdomain/course/:slug
 */
export default function TenantCoursePublicPage({ subdomain }) {
  const { slug } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenant-course-page", subdomain, slug],
    queryFn: () => fetchTenantCoursePage(subdomain, slug),
    enabled: Boolean(slug),
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <TenantPublicShell subdomain={subdomain} seoPage="course" seoSlug={slug} showSearch={false}>
        <TenantPublicSkeleton rows={2} />
      </TenantPublicShell>
    );
  }

  if (isError || !data?.data?.page) {
    return (
      <TenantPublicShell subdomain={subdomain} seoPage="course" seoSlug={slug}>
        <TenantPublicNotFound subdomain={subdomain} backHref="/courses" />
      </TenantPublicShell>
    );
  }

  const { page } = data.data;
  const course = page.course;
  const tenant = page.tenant;
  const isFree = course.is_free || Number(course.price) === 0;

  return (
    <TenantPublicShell subdomain={subdomain} seoPage="course" seoSlug={slug}>
      <TenantBreadcrumb
        items={page.breadcrumbs?.map((b) => ({ name: b.name, path: b.path })) || [
          { name: tenant.display_name, path: "/" },
          { name: "الكورسات", path: "/courses" },
          { name: course.title, path: null },
        ]}
      />

      <article className="grid gap-8 lg:grid-cols-2">
        <TenantPublicImage
          src={course.avatar}
          alt={course.title}
          priority
          className="rounded-2xl"
        />
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">
            {course.title}
          </h1>
          {course.grade?.name ? (
            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">{course.grade.name}</p>
          ) : null}
          <p className="mt-4 leading-8 text-slate-600 dark:text-slate-400">
            {course.description || course.seo_description || "كورس تعليمي شامل مع متابعة مستمرة."}
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <FaUsers aria-hidden /> {course.students_count} طالب
            </span>
            {course.rating_count > 0 ? (
              <span className="inline-flex items-center gap-1">
                <FaStar className="text-yellow-500" aria-hidden />
                {Number(course.rating_average).toFixed(1)} ({course.rating_count})
              </span>
            ) : null}
            {course.view_count > 0 ? (
              <span className="inline-flex items-center gap-1">
                <FaEye aria-hidden /> {course.view_count} مشاهدة
              </span>
            ) : null}
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
            <p className="text-sm text-slate-500">السعر</p>
            <p className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isFree ? "مجاني" : `${Number(course.price).toLocaleString("ar-EG")} ج.م`}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/signup"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {isFree ? "ابدأ التعلم مجاناً" : "اشترك في الكورس"}
              </a>
              <Link
                to="/courses"
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold dark:border-slate-600"
              >
                كورسات أخرى
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {course.teacher_avatar ? (
              <img
                src={course.teacher_avatar}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
                loading="lazy"
              />
            ) : null}
            <div>
              <p className="text-sm text-slate-500">المدرس</p>
              <Link to="/teacher" className="font-semibold text-blue-600 hover:underline">
                {course.teacher_name}
              </Link>
            </div>
          </div>
        </div>
      </article>
    </TenantPublicShell>
  );
}
