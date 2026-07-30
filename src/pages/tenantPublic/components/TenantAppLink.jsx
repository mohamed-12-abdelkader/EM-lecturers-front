import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { resolveTenantSubdomain, withTenantQuery } from "../../../utils/tenantHost";

/** مسار داخلي للتطبيق (SPA) مقابل رابط خارجي أو هاش */
export function isAppRoute(href) {
  if (!href || typeof href !== "string") return false;
  if (href.startsWith("#")) return false;
  if (/^(mailto:|tel:|whatsapp:|sms:)/i.test(href)) return false;
  if (href.startsWith("//")) return false;

  if (/^https?:\/\//i.test(href)) {
    if (typeof window === "undefined") return false;
    try {
      return new URL(href).origin === window.location.origin;
    } catch {
      return false;
    }
  }

  return href.startsWith("/");
}

export function toAppPath(href) {
  if (!href) return "/";
  if (/^https?:\/\//i.test(href) && typeof window !== "undefined") {
    try {
      const u = new URL(href);
      if (u.origin === window.location.origin) {
        return `${u.pathname}${u.search}${u.hash}` || "/";
      }
    } catch {
      /* fall through */
    }
  }
  return href;
}

function decorateAuthPath(path) {
  if (!path || typeof path !== "string") return path;
  const pathname = path.split("?")[0].split("#")[0];
  if (pathname !== "/login" && pathname !== "/signup" && pathname !== "/welcome") {
    return path;
  }
  return withTenantQuery(path, resolveTenantSubdomain());
}

/**
 * يستخدم React Router للمسارات الداخلية، و`<a>` للخارجي/الهاش.
 */
const TenantAppLink = forwardRef(function TenantAppLink(
  { href, to, children, ...rest },
  ref,
) {
  const target = decorateAuthPath(to ?? href);
  if (isAppRoute(target)) {
    return (
      <Link ref={ref} to={toAppPath(target)} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a ref={ref} href={target} {...rest}>
      {children}
    </a>
  );
});

export default TenantAppLink;
