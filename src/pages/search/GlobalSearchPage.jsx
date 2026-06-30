import { useEffect, useMemo } from "react";

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

/**
 * Main site global search — /search?q=محمد
 * Only shown on the primary domain (no tenant subdomain).
 */
export default function GlobalSearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";

  useEffect(() => {
    applyPageMetadata({
      title: q ? `نتائج البحث: ${q} | Next Edu School` : "البحث | Next Edu School",
      description: "ابحث عن مدرسين وكورسات تعليمية على منصة Next Edu School",
      canonicalUrl: `${window.location.origin}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      robots: { index: true, follow: true },
      openGraph: {
        title: "البحث في Next Edu School",
        description: "اكتشف مدرسين ومنصات تعليمية",
        url: window.location.href,
        type: "website",
        siteName: "Next Edu School",
        locale: "ar_EG",
      },
      twitter: { card: "summary", title: "البحث", description: "ابحث عن مدرسين وكورسات" },
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Next Edu School",
          url: window.location.origin,
          potentialAction: {
            "@type": "SearchAction",
            target: `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
      ],
    });
  }, [q]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["global-search", q],
    queryFn: () => fetchGlobalSearch({ q, limit: 30 }),
    enabled: q.length >= 1,
    staleTime: 30_000,
  });

  const grouped = useMemo(() => groupResults(data?.data?.items || []), [data]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-heading text-lg font-bold text-blue-600">
            Next Edu School
          </Link>
          <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-heading text-center text-3xl font-bold text-slate-900 dark:text-slate-100">
          ابحث عن مدرس أو كورس
        </h1>
        <p className="mt-2 text-center text-slate-600 dark:text-slate-400">
          اكتشف منصات المدرسين والكورسات التعليمية
        </p>

        <div className="mx-auto mt-8 flex justify-center">
          <TenantSearchBar variant="hero" autoNavigate searchPath="/search" />
        </div>

        {!q ? (
          <div className="mt-12">
            <TenantPublicEmpty
              title="ابدأ بالكتابة"
              description="ابحث عن اسم مدرس، مادة، أو منصة تعليمية."
            />
          </div>
        ) : isLoading || isFetching ? (
          <div className="mt-12">
            <TenantPublicSkeleton rows={4} />
          </div>
        ) : (
          <div className="mt-12 space-y-10">
            {grouped.teachers.length === 0 && grouped.courses.length === 0 ? (
              <TenantPublicEmpty title={`لا توجد نتائج لـ «${q}»`} />
            ) : null}
            {grouped.teachers.length > 0 ? (
              <Section title="المدرسون والمنصات">
                {grouped.teachers.map((item) => (
                  <GlobalResultCard key={`t-${item.id}`} item={item} query={q} />
                ))}
              </Section>
            ) : null}
            {grouped.courses.length > 0 ? (
              <Section title="الكورسات">
                {grouped.courses.map((item) => (
                  <GlobalResultCard key={`c-${item.id}`} item={item} query={q} />
                ))}
              </Section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-bold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function GlobalResultCard({ item, query }) {
  return (
    <a
      href={item.public_url || "#"}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900"
    >
      {item.avatar ? (
        <img src={item.avatar} alt="" className="h-12 w-12 rounded-full object-cover" loading="lazy" />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">
          {item.type === "course" ? "📘" : "👨‍🏫"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          <TenantHighlightText text={item.title} query={query} />
        </p>
        {item.subtitle ? <p className="truncate text-xs text-slate-500">{item.subtitle}</p> : null}
      </div>
    </a>
  );
}
