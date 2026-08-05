/**
 * يحمّل بيانات المنصة ويحدّث مانيفست PWA (الاسم + اللوجو) مبكراً.
 * يعمل على subdomain المدرس فقط — كل منصة أصل مستقل ويمكن تثبيتها وحدها.
 */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantPublic, readCachedTenantPublic } from "../../api/tenantPublicApi";
import { getTenantSubdomain } from "../../utils/tenantHost";
import {
  applyTenantPwaManifest,
  applyTenantPwaManifestFromCache,
  resolveTenantPwaBranding,
} from "../../utils/tenantPwaManifest";

export default function TenantPwaBranding() {
  const subdomain = getTenantSubdomain();

  useEffect(() => {
    if (!subdomain) return undefined;
    applyTenantPwaManifestFromCache(subdomain);
    return undefined;
  }, [subdomain]);

  const { data } = useQuery({
    queryKey: ["tenant-public", subdomain],
    queryFn: () => fetchTenantPublic(subdomain),
    enabled: Boolean(subdomain),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    initialData: subdomain ? readCachedTenantPublic(subdomain) : undefined,
  });

  useEffect(() => {
    if (!subdomain || !data?.data?.tenant) return undefined;
    const branding = resolveTenantPwaBranding(
      data.data.tenant,
      data.data.teacher,
      subdomain,
    );
    applyTenantPwaManifest(branding);
    return undefined;
  }, [subdomain, data]);

  return null;
}
