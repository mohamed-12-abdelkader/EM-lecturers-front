import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchTenantPublic,
  readCachedTenantPublic,
} from "../../api/tenantPublicApi";
import {
  getLandingDesign,
  resolveLandingLayout,
} from "../../pages/tenantPublic/tenantLandingDesigns";
import { resolveTenantSubdomain } from "../../utils/tenantHost";
import {
  readCachedTenantBrandLogo,
  resolveTenantBrandLogo,
} from "../../utils/tenantBrandLogo";

/** تدرج هيرو متناسب مع ثيم لاندينج المنصة (navy / ember / sky) */
export function heroGradientFromDesign(design) {
  if (!design) {
    return "linear-gradient(125deg, #082B57 0%, #0E4C92 46%, #1A6BB8 100%)";
  }
  if (design.id === "ember") {
    return `linear-gradient(125deg, ${design.accent2} 0%, #9A3412 48%, ${design.accent} 100%)`;
  }
  if (design.id === "navy") {
    return `linear-gradient(125deg, ${design.pageBg} 0%, #1E3A8A 48%, ${design.accent} 100%)`;
  }
  return `linear-gradient(125deg, ${design.accent2 || design.fg} 0%, #1D4ED8 48%, ${design.accent} 100%)`;
}

/**
 * ألوان/هوية منصة المدرس من اللاندينج الحالي.
 */
export default function useTeacherPlatformBrand() {
  const subdomain = resolveTenantSubdomain();

  const cached = useMemo(
    () => (subdomain ? readCachedTenantPublic(subdomain) : undefined),
    [subdomain],
  );

  const { data } = useQuery({
    queryKey: ["teacher-platform-brand", subdomain],
    queryFn: () => fetchTenantPublic(subdomain),
    enabled: Boolean(subdomain),
    staleTime: 5 * 60_000,
    placeholderData: cached,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const payload = data?.data || cached?.data || data || cached || {};
    const landing = payload?.landing || {};
    const tenant = payload?.tenant || {};
    const teacher = payload?.teacher || {};
    const layout = resolveLandingLayout(landing?.layout);
    const design = getLandingDesign(layout);
    const specialty =
      landing?.specialty ||
      landing?.hero?.subtitle ||
      teacher?.subject ||
      tenant?.specialty ||
      "";
    const brandName =
      teacher?.name || tenant?.display_name || subdomain || "المنصة";
    const logoUrl =
      (subdomain && readCachedTenantBrandLogo(subdomain)) ||
      resolveTenantBrandLogo(tenant, teacher);

    return {
      subdomain,
      layout,
      design,
      specialty: String(specialty || "").trim(),
      brandName,
      logoUrl,
      accent: design?.accent || "#3182CE",
      accentSoft: design?.accentSoft || "#63B3ED",
      accent2: design?.accent2 || design?.fg || "#0B1B3A",
      heroGradient: heroGradientFromDesign(design),
      heroShadow: `0 28px 60px -28px ${design?.accent || "#3182CE"}99`,
    };
  }, [cached, data, subdomain]);
}
