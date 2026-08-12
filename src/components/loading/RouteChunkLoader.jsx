import useBrandLoading from "./useBrandLoading";

/** يُستخدم كـ Suspense fallback أثناء جلب كود الصفحة — نفس overlay التحميل الموحّد. */
export default function RouteChunkLoader() {
  useBrandLoading(true);
  return null;
}
