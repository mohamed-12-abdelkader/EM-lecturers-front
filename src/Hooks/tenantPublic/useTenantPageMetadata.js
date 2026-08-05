import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantPageMetadata } from "../../api/tenantPublicApi";
import { applyPageMetadata, buildTenantSeoMeta, isCompanyBrandingTitle } from "../../utils/tenantSeo";

/** عناوين عامة للشركة — نتجاهلها لو رجعت من الـ API بدل بيانات المدرس */
function isCompanyBrandingMeta(meta) {
  if (!meta) return true;
  return isCompanyBrandingTitle(meta.title || meta.seoTitle);
}

/**
 * دمج ذكي: بيانات المدرس من الـ landing هي الأساس،
 * وAPI الـ SEO يكمّل فقط لو مش راجع ببراند الشركة.
 */
function mergeTenantMetadata(apiMeta, fallbackMeta) {
  if (!apiMeta && !fallbackMeta) return null;
  if (!apiMeta) return fallbackMeta;
  if (!fallbackMeta) {
    return isCompanyBrandingMeta(apiMeta) ? null : apiMeta;
  }

  const apiIsGeneric = isCompanyBrandingMeta(apiMeta);
  const title = apiIsGeneric
    ? fallbackMeta.title
    : apiMeta.title || apiMeta.seoTitle || fallbackMeta.title;
  const description = apiIsGeneric
    ? fallbackMeta.description
    : apiMeta.description || apiMeta.seoDescription || fallbackMeta.description;

  return {
    ...fallbackMeta,
    ...(!apiIsGeneric ? apiMeta : {}),
    title,
    description,
    author: fallbackMeta.author || apiMeta.author,
    siteName: fallbackMeta.siteName || apiMeta.siteName,
    themeColor:
      apiMeta.themeColor ||
      apiMeta.theme_color ||
      fallbackMeta.themeColor,
    favicon:
      fallbackMeta.favicon ||
      apiMeta.favicon ||
      apiMeta.favicon_url,
    appleTouchIcon:
      fallbackMeta.appleTouchIcon ||
      apiMeta.appleTouchIcon ||
      apiMeta.apple_touch_icon ||
      fallbackMeta.favicon,
    keywords: Array.isArray(apiMeta.keywords) && apiMeta.keywords.length && !apiIsGeneric
      ? apiMeta.keywords
      : fallbackMeta.keywords,
    canonicalUrl:
      apiMeta.canonicalUrl ||
      apiMeta.canonical_url ||
      fallbackMeta.canonicalUrl,
    openGraph: {
      ...(fallbackMeta.openGraph || {}),
      ...(!apiIsGeneric ? apiMeta.openGraph || {} : {}),
      title:
        (!apiIsGeneric && (apiMeta.openGraph?.title || apiMeta.title)) ||
        fallbackMeta.openGraph?.title ||
        title,
      description:
        (!apiIsGeneric &&
          (apiMeta.openGraph?.description || apiMeta.description)) ||
        fallbackMeta.openGraph?.description ||
        description,
      image:
        fallbackMeta.openGraph?.image ||
        apiMeta.openGraph?.image ||
        apiMeta.ogImage,
      siteName:
        fallbackMeta.openGraph?.siteName ||
        apiMeta.openGraph?.siteName ||
        fallbackMeta.siteName,
      url:
        apiMeta.openGraph?.url ||
        apiMeta.canonicalUrl ||
        fallbackMeta.openGraph?.url,
    },
    twitter: {
      ...(fallbackMeta.twitter || {}),
      ...(!apiIsGeneric ? apiMeta.twitter || {} : {}),
      title:
        (!apiIsGeneric && (apiMeta.twitter?.title || apiMeta.title)) ||
        fallbackMeta.twitter?.title ||
        title,
      description:
        (!apiIsGeneric &&
          (apiMeta.twitter?.description || apiMeta.description)) ||
        fallbackMeta.twitter?.description ||
        description,
      image:
        fallbackMeta.twitter?.image ||
        apiMeta.twitter?.image ||
        fallbackMeta.openGraph?.image,
    },
    jsonLd:
      Array.isArray(apiMeta.jsonLd) && apiMeta.jsonLd.length && !apiIsGeneric
        ? apiMeta.jsonLd
        : fallbackMeta.jsonLd,
  };
}

/**
 * Applies teacher-platform SEO to <head>.
 * Priority: tenant/teacher public data → API metadata (if not company branding).
 */
export function useTenantPageMetadata(subdomain, page = "home", slug, fallback) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenant-page-metadata", subdomain, page, slug || ""],
    queryFn: async () => {
      try {
        const res = await fetchTenantPageMetadata(subdomain, page, slug);
        return res?.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: Boolean(subdomain),
    staleTime: 120_000,
    retry: 0,
  });

  const fallbackMeta = useMemo(() => {
    if (!fallback?.tenant || !fallback?.subdomain) return null;
    return buildTenantSeoMeta({
      tenant: fallback.tenant,
      teacher: fallback.teacher,
      subdomain: fallback.subdomain,
      theme: fallback.theme,
    });
  }, [
    fallback?.tenant,
    fallback?.teacher,
    fallback?.subdomain,
    fallback?.theme,
  ]);

  const resolvedMeta = useMemo(
    () => mergeTenantMetadata(data, fallbackMeta),
    [data, fallbackMeta],
  );

  useEffect(() => {
    if (!subdomain || !resolvedMeta) return undefined;
    applyPageMetadata(resolvedMeta);
    // مزامنة مانيفست PWA مع اسم/لوجو المنصة
    import("../../utils/tenantPwaManifest")
      .then(({ applyTenantPwaManifest }) =>
        applyTenantPwaManifest({
          subdomain,
          name: resolvedMeta.siteName || resolvedMeta.title,
          description: resolvedMeta.description,
          iconUrl: resolvedMeta.favicon || resolvedMeta.appleTouchIcon,
          themeColor: resolvedMeta.themeColor,
        }),
      )
      .catch(() => null);
    return undefined;
  }, [subdomain, resolvedMeta]);

  return { metadata: resolvedMeta, isLoading: isLoading && !fallbackMeta, isError };
}
