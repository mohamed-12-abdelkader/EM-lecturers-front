import { useLayoutEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantPublic } from "../../../api/tenantPublicApi";
import {
  applyPageMetadata,
  buildTenantSeoMeta,
  isCompanyBrandingTitle,
} from "../../../utils/tenantSeo";
import {
  isAbsoluteHttpUrl,
  resolvePublicImageUrl,
} from "../../../utils/highQualityImageUrl";

function resolveTeacherLabel(tenant, teacher, subdomain) {
  const name =
    teacher?.name ||
    teacher?.full_name ||
    tenant?.teacher_name ||
    tenant?.display_name ||
    subdomain ||
    "";
  if (!name || isCompanyBrandingTitle(name)) {
    return subdomain ? `منصة ${subdomain}` : "منصة تعليمية";
  }
  if (
    name.startsWith("مستر") ||
    name.startsWith("أ.") ||
    name.startsWith("ا.")
  ) {
    return name;
  }
  return `مستر ${name}`;
}

/**
 * Forces browser tab title/icon/meta for a teacher platform.
 * Mounted globally on tenant subdomains (see Routes.jsx).
 */
export default function TenantSeoHead({ subdomain }) {
  const { data, isSuccess } = useQuery({
    queryKey: ["tenant-public", subdomain],
    queryFn: () => fetchTenantPublic(subdomain),
    enabled: Boolean(subdomain),
    staleTime: 60_000,
  });

  const payload = data?.data;
  const tenant = payload?.tenant;
  const teacher = payload?.teacher;
  const theme = payload?.landing?.theme;

  const meta = useMemo(() => {
    if (!subdomain || !tenant) return null;
    const built = buildTenantSeoMeta({ tenant, teacher, subdomain, theme });
    if (!built) return null;

    const specialty = tenant.specialty || teacher?.subject || "";
    const teacherLabel = resolveTeacherLabel(tenant, teacher, subdomain);
    // Always force a teacher-centric title (ignore stored company seo_title)
    const forcedTitle = [teacherLabel, specialty]
      .filter(Boolean)
      .join(" | ");

    return {
      ...built,
      title: forcedTitle,
      openGraph: {
        ...built.openGraph,
        title: forcedTitle,
        siteName: teacherLabel,
      },
      twitter: {
        ...built.twitter,
        title: forcedTitle,
      },
      siteName: teacherLabel,
      author: teacherLabel,
    };
  }, [subdomain, tenant, teacher, theme]);

  useLayoutEffect(() => {
    if (!subdomain || !meta) return undefined;

    applyPageMetadata(meta);
    document.title = meta.title;

    // Replace favicon nodes aggressively (browsers cache link[rel=icon])
    const iconHref = resolvePublicImageUrl(
      meta.favicon ||
        meta.appleTouchIcon ||
        tenant?.avatar_url ||
        teacher?.avatar,
    );
    if (iconHref && isAbsoluteHttpUrl(iconHref)) {
      document
        .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
        .forEach((node) => node.parentNode?.removeChild(node));

      const isExternalCdn = /cloudinary\.com|unsplash\.com|googleusercontent\.com/i.test(iconHref);
      const href = isExternalCdn
        ? iconHref
        : `${iconHref}${iconHref.includes("?") ? "&" : "?"}v=${encodeURIComponent(subdomain)}`;

      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.type = "image/png";
      icon.href = href;
      document.head.appendChild(icon);

      const apple = document.createElement("link");
      apple.rel = "apple-touch-icon";
      apple.href = href;
      document.head.appendChild(apple);
    }

    const desired = meta.title;
    const sync = () => {
      if (document.title !== desired) document.title = desired;
    };
    const intervalId = window.setInterval(sync, 400);
    const timeoutId = window.setTimeout(() => window.clearInterval(intervalId), 10000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [subdomain, meta, isSuccess, tenant?.avatar_url, teacher?.avatar]);

  return null;
}
