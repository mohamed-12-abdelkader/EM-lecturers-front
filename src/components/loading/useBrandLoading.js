import { useLayoutEffect } from "react";
import { decBrandLoading, incBrandLoading } from "../../utils/brandLoadingStore";

/** يربط حالة تحميل (Suspense أو صفحة) بالـ overlay الموحّد. */
export default function useBrandLoading(active = true) {
  useLayoutEffect(() => {
    if (!active) return undefined;
    incBrandLoading();
    return () => decBrandLoading();
  }, [active]);
}
