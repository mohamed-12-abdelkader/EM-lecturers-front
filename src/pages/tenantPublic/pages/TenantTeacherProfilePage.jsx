import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FaFacebook,
  FaGraduationCap,
  FaStar,
  FaUsers,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { fetchTenantTeacherPage } from "../../../api/tenantPublicApi";
import TenantPublicShell from "../TenantPublicShell";
import TenantBreadcrumb from "../components/TenantBreadcrumb";
import TenantCourseCard from "../components/TenantCourseCard";
import TenantPublicImage from "../components/TenantPublicImage";
import { TenantPublicSkeleton, TenantPublicNotFound } from "../components/TenantPublicStates";

/**
 * Public teacher profile page — optimized for Google indexing.
 * Data: GET /api/tenants/public/:subdomain/teacher
 */
export default function TenantTeacherProfilePage({ subdomain }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenant-teacher-page", subdomain],
    queryFn: () => fetchTenantTeacherPage(subdomain),
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <TenantPublicShell subdomain={subdomain} seoPage="teacher" showSearch={false}>
        <TenantPublicSkeleton rows={4} />
      </TenantPublicShell>
    );
  }

  if (isError || !data?.data?.page) {
    return (
      <TenantPublicShell subdomain={subdomain} seoPage="teacher">
        <TenantPublicNotFound subdomain={subdomain} />
      </TenantPublicShell>
    );
  }

  const { page } = data.data;
  const teacher = page.teacher;
  const tenant = page.tenant;
  const stats = page.stats || {};
  const ratings = page.ratings || {};

  return (
    <TenantPublicShell subdomain={subdomain} seoPage="teacher">
      <TenantBreadcrumb
        items={[
          { name: tenant.display_name, path: "/" },
          { name: "المدرس", path: "/teacher" },
        ]}
      />

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-center text-white md:rounded-r-none">
            <TenantPublicImage
              src={teacher?.avatar || tenant.avatar_url}
              alt={teacher?.name || tenant.display_name}
              className="mx-auto h-40 w-40 rounded-full ring-4 ring-white/30"
              aspectClass="aspect-square"
              priority
              objectFit="cover"
            />
            <h1 className="font-heading mt-4 text-2xl font-bold">
              {teacher?.name || tenant.display_name}
            </h1>
            <p className="mt-1 text-blue-100">{tenant.specialty || teacher?.subject}</p>
            {ratings.count > 0 ? (
              <p className="mt-3 flex items-center justify-center gap-1 text-sm">
                <FaStar className="text-yellow-300" aria-hidden />
                <span>
                  {Number(ratings.average).toFixed(1)} ({ratings.count} تقييم)
                </span>
              </p>
            ) : null}
          </div>

          <div className="p-6 md:p-8">
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
              نبذة عن المدرس
            </h2>
            <p className="mt-3 leading-8 text-slate-600 dark:text-slate-400">
              {tenant.bio || teacher?.description || "مدرس متخصص يقدم محتوى تعليمي عالي الجودة."}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat icon={FaUsers} label="طلاب" value={stats.students_count} />
              <Stat icon={FaGraduationCap} label="كورسات" value={stats.courses_count} />
              <Stat icon={FaGraduationCap} label="صفوف" value={stats.grades_count} />
            </div>

            {page.subjects?.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">المواد</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {page.subjects.map((s) => (
                    <Link
                      key={s}
                      to={`/search?q=${encodeURIComponent(s)}`}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {page.social_links?.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {page.social_links.map((link) => (
                  <a
                    key={link.type}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600"
                  >
                    {link.type === "facebook" ? <FaFacebook /> : null}
                    {link.type === "youtube" ? <FaYoutube /> : null}
                    {link.type === "whatsapp" ? <FaWhatsapp /> : null}
                    {link.type}
                  </a>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/signup"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                سجّل الآن
              </a>
              <Link
                to="/courses"
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold dark:border-slate-600"
              >
                استعرض الكورسات
              </Link>
            </div>
          </div>
        </div>
      </article>

      {page.latest_courses?.length > 0 ? (
        <section className="mt-12" aria-labelledby="latest-courses-heading">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="latest-courses-heading" className="font-heading text-xl font-bold">
              أحدث الكورسات
            </h2>
            <Link to="/courses/latest" className="text-sm font-semibold text-blue-600">
              عرض الكل
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.latest_courses.map((course) => (
              <TenantCourseCard
                key={course.id}
                course={course}
                fallbackImage={tenant.avatar_url}
              />
            ))}
          </div>
        </section>
      ) : null}
    </TenantPublicShell>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
      <Icon className="mx-auto text-blue-600" aria-hidden />
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{value ?? 0}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
