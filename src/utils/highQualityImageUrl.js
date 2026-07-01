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

function getCloudinaryOriginal(url) {
  const cloudinary = url.match(CLOUDINARY_UPLOAD);
  if (!cloudinary) return url;
  const [, head, path] = cloudinary;
  return `${head}${stripCloudinaryTransforms(path)}`;
}

export function getHighQualityImageUrl(
  url,
  { width = 2560, quality = 100, dpr = 2, preserveTransparency = false } = {},
) {
  if (!url || typeof url !== "string") return url;

  const cloudinary = url.match(CLOUDINARY_UPLOAD);
  if (cloudinary) {
    const [, head, path] = cloudinary;
    const cleanPath = stripCloudinaryTransforms(path);
    const keepAlpha = preserveTransparency || isTransparentImageUrl(url);
    const format = keepAlpha ? "f_png,fl_preserve_transparency" : "f_auto";
    const transform = `q_${quality},${format},w_${width},c_limit,dpr_${dpr}`;
    return `${head}${transform}/${cleanPath}`;
  }

  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(Math.min(100, quality)));
      u.searchParams.set("auto", "format");
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/** صورة المدرس — الرابط الأصلي بدون تحويلات تُفسد الشفافية */
export function getPortraitImageUrl(url) {
  if (!url) return url;
  if (isTransparentImageUrl(url)) {
    return getCloudinaryOriginal(url);
  }
  return getHighQualityImageUrl(url, { width: 1200, quality: 90, dpr: 2 });
}

export function getPortraitImageSrcSet() {
  return undefined;
}

export function getHeroImageSrcSet(url) {
  if (!url) return undefined;
  const widths = [1600, 2200, 2800, 3840];
  return widths
    .map((w) => `${getHighQualityImageUrl(url, { width: w, quality: 100, dpr: 2 })} ${w}w`)
    .join(", ");
}

export function getHeroImageUrl(url) {
  return getHighQualityImageUrl(url, { width: 3840, quality: 100, dpr: 2 });
}
