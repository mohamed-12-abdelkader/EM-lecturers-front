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

/**
 * يُرجع رابط صورة بجودة عالية — مفيد لصور الهيرو والخلفيات الكبيرة.
 */
export function getHighQualityImageUrl(
  url,
  { width = 2560, quality = 100, dpr = 2 } = {},
) {
  if (!url || typeof url !== "string") return url;

  const cloudinary = url.match(CLOUDINARY_UPLOAD);
  if (cloudinary) {
    const [, head, path] = cloudinary;
    const transform = `q_${quality},f_auto,w_${width},c_limit,dpr_${dpr}`;
    const cleanPath = stripCloudinaryTransforms(path);
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

/** srcSet للهيرو — شاشات مختلفة بدقة عالية */
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
