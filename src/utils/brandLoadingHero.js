/** أصل صورة شاشة التحميل (JPEG حقيقي — الامتداد .png كان يكسّر العرض في بعض المتصفحات). */
export const BRAND_LOADING_HERO_SRC = "/images/brand-loading-hero.jpg";

let heroImage = null;

/**
 * يجلب الصورة في كاش المتصفح فور الإقلاع، بحجم العرض الحقيقي حتى لا يؤجَّل الـ decode.
 */
export function warmupBrandLoadingHero() {
  if (typeof window === "undefined") return;
  if (heroImage) return;

  heroImage = new Image();
  heroImage.decoding = "sync";
  try {
    heroImage.fetchPriority = "high";
  } catch {
    /* Safari قديم */
  }
  heroImage.width = 300;
  heroImage.height = 300;
  heroImage.src = BRAND_LOADING_HERO_SRC;
}

if (typeof window !== "undefined") {
  warmupBrandLoadingHero();
}
