const CLOUDINARY_UPLOAD = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i;

function stripCloudinaryTransforms(path) {
  return path
    .split("/")
    .filter((segment) => {
      if (!segment) return false;
      if (/^v\d+/.test(segment)) return true;
      if (segment.includes(",")) return false;
      if (/^(q|w|h|c|f|dpr|fl|ar|b|e|g|r|x|y|z)_/.test(segment)) return false;
      return true;
    })
    .join("/");
}

function isTransparentImageUrl(url) {
  return /\.(png|webp)(\?|$)/i.test(url);
}

/**
 * Optimized Cloudinary / Unsplash URL for display size.
 * Prefer f_auto + reasonable width so pages don't wait on multi‑MB originals.
 */
export function getHighQualityImageUrl(
  url,
  { width = 1280, quality = 80, dpr = 2, preserveTransparency = false } = {},
) {
  if (!url || typeof url !== "string") return url;

  const cloudinary = url.match(CLOUDINARY_UPLOAD);
  if (cloudinary) {
    const [, head, path] = cloudinary;
    const cleanPath = stripCloudinaryTransforms(path);
    const keepAlpha = preserveTransparency || isTransparentImageUrl(url);
    const format = keepAlpha ? "f_png,fl_preserve_transparency" : "f_auto";
    const transform = `q_${quality},${format},w_${width},c_limit,dpr_auto`;
    return `${head}${transform}/${cleanPath}`;
  }

  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(Math.min(85, quality)));
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "max");
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/** Portrait on landing hero / about — max display ~520px */
export function getPortraitImageUrl(url) {
  if (!url) return url;
  return getHighQualityImageUrl(url, {
    width: 800,
    quality: 78,
    preserveTransparency: isTransparentImageUrl(url),
  });
}

/** Course / lecture cards — smaller thumbnails */
export function getCardImageUrl(url) {
  if (!url) return url;
  return getHighQualityImageUrl(url, { width: 480, quality: 72 });
}

export function getPortraitImageSrcSet(url) {
  if (!url) return undefined;
  return [480, 720, 960]
    .map((w) => `${getHighQualityImageUrl(url, { width: w, quality: 78 })} ${w}w`)
    .join(", ");
}

export function getHeroImageSrcSet(url) {
  if (!url) return undefined;
  return [720, 1080, 1440]
    .map((w) => `${getHighQualityImageUrl(url, { width: w, quality: 80 })} ${w}w`)
    .join(", ");
}

export function getHeroImageUrl(url) {
  return getHighQualityImageUrl(url, { width: 1440, quality: 80 });
}

/** Tiny blurred placeholder URL when Cloudinary supports it */
export function getBlurPlaceholderUrl(url) {
  if (!url || typeof url !== "string") return null;
  const cloudinary = url.match(CLOUDINARY_UPLOAD);
  if (!cloudinary) return null;
  const [, head, path] = cloudinary;
  const cleanPath = stripCloudinaryTransforms(path);
  return `${head}w_40,q_30,e_blur:800,f_auto/${cleanPath}`;
}
