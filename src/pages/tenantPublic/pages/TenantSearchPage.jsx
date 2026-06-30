import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantSearch } from "../../../api/tenantPublicApi";
import TenantPublicShell from "../TenantPublicShell";
import TenantSearchBar from "../components/TenantSearchBar";
import TenantHighlightText from "../components/TenantHighlightText";
import { TenantPublicEmpty, TenantPublicSkeleton } from "../components/TenantPublicStates";

function groupResults(items = []) {
  const teachers = [];
  const courses = [];
  const subjects = new Set();

  items.forEach((item) => {
    if (item.type === "teacher") teachers.push(item);
    else if (item.type === "course") {
      courses.push(item);
      if (item.subject) subjects.add(item.subject);
      if (item.grade) subjects.add(item.grade);
    }
  });

  return { teachers, courses, subjects: [...subjects] };
}

/** Tenant-scoped search page — /search?q= */
export default function TenantSearchPage({ subdomain }) {
  const [params] = useSearchParams();
  const q = params.get("q") || "";

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["tenant-search-page", subdomain, q],
    queryFn: () => fetchTenantSearch(subdomain, { q, limit: 30 }),
    enabled: q.length >= 1,
    staleTime: 30_000,
  });

  const grouped = useMemo(() => groupResults(data?.data?.items || []), [data]);
  const total = data?.data?.total ?? grouped.teachers.length + grouped.courses.length;

  return (
    <TenantPublicShell subdomain={subdomain} seoPage="home" showSearch={false}>
      <header className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold">البحث في المنصة</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          ابحث عن كورسات ومواد ومحتوى تعليمي
        </p>
        <div className="mx-auto mt-6 flex justify-center">
          <TenantSearchBar
            subdomain={subdomain}
            variant="hero"
            autoNavigate
            placeholder="ابحث هنا..."
          />
        </div>
      </header>

      {!q ? (
        <TenantPublicEmpty
          title="ابدأ بالكتابة للبحث"
          description="اكتب اسم كورس أو مادة أو كلمة مفتاحية."
        />
      ) : isLoading || isFetching ? (
        <TenantPublicSkeleton rows={4} />
      ) : total === 0 ? (
        <TenantPublicEmpty
          title={`لا توجد نتائج لـ «${q}»`}
          description="جرّب كلمات مختلفة أو تصفح الكورسات من القائمة."
        />
      ) : (
        <div className="space-y-10">
          {grouped.teachers.length > 0 ? (
            <ResultSection title="المدرسون" count={grouped.teachers.length}>
              {grouped.teachers.map((item) => (
                <ResultCard key={`t-${item.id}`} item={item} query={q} />
              ))}
            </ResultSection>
          ) : null}
          {grouped.courses.length > 0 ? (
            <ResultSection title="الكورسات" count={grouped.courses.length}>
              {grouped.courses.map((item) => (
                <ResultCard key={`c-${item.id}`} item={item} query={q} />
              ))}
            </ResultSection>
          ) : null}
          {grouped.subjects.length > 0 ? (
            <ResultSection title="المواد" count={grouped.subjects.length}>
              {grouped.subjects.map((s) => (
                <a
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="block rounded-xl border border-slate-200 p-4 hover:border-blue-300 dark:border-slate-700"
                >
                  <TenantHighlightText text={s} query={q} className="font-semibold" />
                </a>
              ))}
            </ResultSection>
          ) : null}
        </div>
      )}
    </TenantPublicShell>
  );
}

function ResultSection({ title, count, children }) {
  return (
    <section aria-labelledby={`section-${title}`}>
      <h2 id={`section-${title}`} className="mb-4 font-heading text-xl font-bold">
        {title}{" "}
        <span className="text-sm font-normal text-slate-500">({count})</span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ResultCard({ item, query }) {
  const href = item.public_url || (item.type === "course" ? `/course/${item.slug}` : "/teacher");
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-700"
    >
      {item.avatar ? (
        <img src={item.avatar} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl dark:bg-blue-900/40">
          {item.type === "course" ? "📘" : "👨‍🏫"}
        </span>
      )}
      <div className="min-w-0 flex-1 text-right">
        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
          <TenantHighlightText text={item.title} query={query} />
        </p>
        {item.subtitle ? (
          <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
        ) : null}
      </div>
    </a>
  );
}
