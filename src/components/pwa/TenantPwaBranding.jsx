/**
 * يحمّل بيانات المنصة ويحدّث مانيفست PWA (الاسم + اللوجو) مبكراً.
 * يعمل على subdomain المدرس فقط — كل منصة أصل مستقل ويمكن تثبيتها وحدها.
 */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantPublic, readCachedTenantPublic } from "../../api/tenantPublicApi";
import { getTenantSubdomain } from "../../utils/tenantHost";
import { ensurePwaServiceWorker } from "../../Hooks/pwa/usePWAInstall";
import {
  applyTenantPwaManifest,
  applyTenantPwaManifestFromCache,
  resolveTenantPwaBranding,
} from "../../utils/tenantPwaManifest";

export default function TenantPwaBranding() {
  const subdomain = getTenantSubdomain();

  useEffect(() => {
    if (!subdomain) return undefined;
    let cancelled = false;
    (async () => {
      await ensurePwaServiceWorker();
      if (cancelled) return;
      await applyTenantPwaManifestFromCache(subdomain);
    })();
    return () => {
      cancelled = true;
    };
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
    let cancelled = false;
    (async () => {
      await ensurePwaServiceWorker();
      if (cancelled) return;
      const branding = resolveTenantPwaBranding(
        data.data.tenant,
        data.data.teacher,
        subdomain,
      );
      await applyTenantPwaManifest(branding);
    })();
    return () => {
      cancelled = true;
    };
  }, [subdomain, data]);

  return null;
}
