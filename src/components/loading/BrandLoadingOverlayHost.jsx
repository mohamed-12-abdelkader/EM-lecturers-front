import { useSyncExternalStore } from "react";
import BrandLoadingScreen from "./BrandLoadingScreen";
import {
  BRAND_LOADING_HERO_SRC,
  warmupBrandLoadingHero,
} from "../../utils/brandLoadingHero";
import {
  getBrandLoadingSnapshot,
  subscribeBrandLoading,
} from "../../utils/brandLoadingStore";

warmupBrandLoadingHero();

/** نسخة واحدة على مستوى التطبيق — تُعرض عند تحميل chunk أو بيانات الصفحة. */
export default function BrandLoadingOverlayHost() {
  const visible = useSyncExternalStore(
    subscribeBrandLoading,
    getBrandLoadingSnapshot,
    getBrandLoadingSnapshot,
  );

  return (
    <>
      <img
        className="brand-loading-hero-warm"
        src={BRAND_LOADING_HERO_SRC}
        alt=""
        width={300}
        height={300}
        decoding="async"
        fetchPriority="high"
        loading="eager"
        aria-hidden="true"
      />
      {visible ? <BrandLoadingScreen overlay /> : null}
    </>
  );
}
