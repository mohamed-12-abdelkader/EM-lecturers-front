import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import TenantPublicImage from "./TenantPublicImage";
import TenantHighlightText from "./TenantHighlightText";

function formatPrice(course) {
  if (course.is_free || Number(course.price) === 0) return "مجاني";
  return `${Number(course.price).toLocaleString("ar-EG")} ج.م`;
}

export default function TenantCourseCard({
  course,
  fallbackImage,
  highlightQuery,
  loginHref = "/login",
}) {
  const slug = course.slug || `course-${course.id}`;
  const href = `/course/${slug}`;
  const title = course.title || course.name || "كورس";
  const image = course.avatar || course.image_url || course.cover_url || fallbackImage;
  const gradeName = course.grade?.name || course.grade_name;
  const isFree = course.is_free || Number(course.price) === 0;

  return (
    <motion.article
      layout
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
    >
      <Link to={href} className="block" aria-label={`عرض كورس ${title}`}>
        <TenantPublicImage src={image} alt={title} className="w-full" />
      </Link>
      <div className="flex flex-1 flex-col p-4 text-right">
        <div className="mb-2 flex flex-wrap gap-2">
          {gradeName ? (
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {gradeName}
            </span>
          ) : null}
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
              isFree
                ? "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
            }`}
          >
            {isFree ? "مجاني" : "مدفوع"}
          </span>
        </div>
        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100">
          {highlightQuery ? (
            <TenantHighlightText text={title} query={highlightQuery} />
          ) : (
            title
          )}
        </h3>
        {course.description ? (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-7 text-slate-600 dark:text-slate-400">
            {course.description}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500">السعر</p>
            <p className="font-bold text-slate-900 dark:text-slate-100">{formatPrice(course)}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to={href}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              التفاصيل
            </Link>
            <a
              href={loginHref}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              اشترك
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
