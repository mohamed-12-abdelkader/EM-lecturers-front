import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantPageMetadata } from "../../api/tenantPublicApi";
import { applyPageMetadata, buildTenantSeoMeta } from "../../utils/tenantSeo";

/**
 * Fetches dynamic metadata from Backend and applies it to <head>.
 * React equivalent of Next.js generateMetadata + Metadata API.
 */
export function useTenantPageMetadata(subdomain, page = "home", slug, fallback) {
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-page-metadata", subdomain, page, slug],
    queryFn: async () => {
      const res = await fetchTenantPageMetadata(subdomain, page, slug);
      return res?.data ?? null;
    },
    enabled: Boolean(subdomain),
    staleTime: 120_000,
    retry: 1,
  });

  useEffect(() => {
    if (data) {
      applyPageMetadata(data);
      return;
    }
    if (fallback && !isLoading) {
      applyPageMetadata(buildTenantSeoMeta(fallback));
    }
  }, [data, fallback, isLoading]);

  return { metadata: data, isLoading };
}
