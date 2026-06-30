export default function TenantPublicLoading({ label = "جاري التحميل..." }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function TenantPublicSkeleton({ rows = 3 }) {
  return (
    <div className="animate-pulse space-y-4 px-4 py-8" aria-hidden>
      <div className="mx-auto h-8 max-w-md rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-200 dark:bg-slate-700">
            <div className="aspect-[16/10] rounded-t-xl bg-slate-300 dark:bg-slate-600" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-slate-300 dark:bg-slate-600" />
              <div className="h-3 w-full rounded bg-slate-300 dark:bg-slate-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TenantPublicEmpty({ title = "لا توجد نتائج", description, action }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-5xl" aria-hidden>
        🔍
      </div>
      <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function TenantPublicNotFound({ subdomain, backHref = "/" }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-black text-slate-200 dark:text-slate-700" aria-hidden>
        404
      </p>
      <h1 className="font-heading mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
        الصفحة غير موجودة
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        {subdomain
          ? `لم نجد الصفحة المطلوبة على منصة ${subdomain}.`
          : "لم نجد الصفحة المطلوبة."}
      </p>
      <a
        href={backHref}
        className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        العودة للرئيسية
      </a>
    </div>
  );
}
