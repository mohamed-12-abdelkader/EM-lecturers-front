import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantGrades, fetchTenantPublic } from "../../../api/tenantPublicApi";
import TenantPublicShell from "../TenantPublicShell";
import TenantBreadcrumb from "../components/TenantBreadcrumb";
import { TenantPublicEmpty, TenantPublicSkeleton } from "../components/TenantPublicStates";

/** All subjects/grades offered by the teacher platform. */
export default function TenantSubjectsPage({ subdomain }) {
  const { data: tenantData } = useQuery({
    queryKey: ["tenant-public", subdomain],
    queryFn: () => fetchTenantPublic(subdomain),
    staleTime: 120_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-grades", subdomain],
    queryFn: () => fetchTenantGrades(subdomain),
    staleTime: 300_000,
  });

  const tenant = tenantData?.data?.tenant;
  const grades = data?.data?.grades || [];

  return (
    <TenantPublicShell subdomain={subdomain} seoPage="courses">
      <TenantBreadcrumb
        items={[
          { name: tenant?.display_name || "الرئيسية", path: "/" },
          { name: "المواد والصفوف", path: "/subjects" },
        ]}
      />

      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold">المواد والصفوف الدراسية</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          اختر المادة أو الصف لاستعراض الكورسات المتاحة
        </p>
      </header>

      {isLoading ? (
        <TenantPublicSkeleton rows={4} />
      ) : grades.length === 0 ? (
        <TenantPublicEmpty
          title="لا توجد مواد مسجّلة"
          description="سيتم إضافة المواد قريباً."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((grade) => (
            <Link
              key={grade.id}
              to={`/courses?grade=${grade.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
            >
              <h2 className="font-heading text-lg font-bold text-slate-900 group-hover:text-blue-600 dark:text-slate-100">
                {grade.name}
              </h2>
              {grade.stage ? (
                <p className="mt-1 text-sm text-slate-500">{grade.stage}</p>
              ) : null}
              <p className="mt-3 text-xs font-semibold text-blue-600">عرض الكورسات ←</p>
            </Link>
          ))}
        </div>
      )}
    </TenantPublicShell>
  );
}
