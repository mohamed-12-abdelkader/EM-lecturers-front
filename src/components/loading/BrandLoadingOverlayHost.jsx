import { useSyncExternalStore } from "react";
import BrandLoadingScreen from "./BrandLoadingScreen";
import {
  getBrandLoadingSnapshot,
  subscribeBrandLoading,
} from "../../utils/brandLoadingStore";

/** نسخة واحدة على مستوى التطبيق — تُعرض عند تحميل chunk أو بيانات الصفحة. */
export default function BrandLoadingOverlayHost() {
  const visible = useSyncExternalStore(
    subscribeBrandLoading,
    getBrandLoadingSnapshot,
    getBrandLoadingSnapshot,
  );

  if (!visible) return null;
  return <BrandLoadingScreen overlay />;
}
