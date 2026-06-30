import { Link } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";

/**
 * Accessible breadcrumb navigation with Schema.org-friendly structure.
 */
export default function TenantBreadcrumb({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="مسار التنقل" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-slate-500 dark:text-slate-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.path}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <FaChevronLeft className="text-[10px] opacity-50" aria-hidden />
              ) : null}
              {isLast || !item.path ? (
                <span
                  className="font-medium text-slate-800 dark:text-slate-200"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
