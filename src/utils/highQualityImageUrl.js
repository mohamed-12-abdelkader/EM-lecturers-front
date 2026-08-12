import { getApiOrigin, useDevViteProxy } from "../api/apiConfig";

const CLOUDINARY_UPLOAD =
  /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i;

const CLOUDINARY_HOST = /res\.cloudinary\.com/i;

/** Skip derived transforms — this project's Cloudinary env blocks unsigned delivery transforms. */
function cloudinaryTransformsEnabled() {
  return import.meta.env.VITE_CLOUDINARY_TRANSFORMS === "true";
}

export function isAbsoluteHttpUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Turn API-relative media paths (/uploads/..., media/foo.png) into absolute URLs.
 * Required on tenant subdomains where bare filenames would hit the Vite dev server.
 */
export function resolvePublicImageUrl(url) {
  if (!url || typeof url !== "string") return null;
  const raw = url.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  // بعض الـ APIs ترجع اسم ملف فقط مثل vqsgyb1ozrv7vdbfc3bw.png
  let path = raw.startsWith("/") ? raw : `/${raw}`;
  if (
    !raw.startsWith("/") &&
    !raw.includes("/") &&
    /\.(png|jpe?g|webp|gif|jfif|svg)$/i.test(raw)
  ) {
    path = `/uploads/${raw}`;
  } else if (!raw.startsWith("/")) {
    path = `/${raw}`;
  }
  if (typeof window !== "undefined" && useDevViteProxy()) {
    return `${window.location.origin}${path}`;
  }
  const origin = getApiOrigin();
  if (origin) return `${origin}${path}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}

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

function isCloudinaryUrl(url) {
  return CLOUDINARY_HOST.test(String(url || ""));
}

/**
 * Optimized Cloudinary / Unsplash URL for display size.
 * Prefer f_auto + reasonable width so pages don't wait on multi‑MB originals.
 */
export function getHighQualityImageUrl(
  url,
  { width = 1280, quality = 80, preserveTransparency = false } = {},
) {
  const resolved = resolvePublicImageUrl(url);
  if (!resolved) return null;

  const cloudinary = resolved.match(CLOUDINARY_UPLOAD);
  if (cloudinary) {
    if (!cloudinaryTransformsEnabled()) return resolved;
    const [, head, path] = cloudinary;
    const cleanPath = stripCloudinaryTransforms(path);
    const keepAlpha = preserveTransparency || isTransparentImageUrl(resolved);
    const format = keepAlpha ? "f_auto" : "f_auto";
    const transform = `q_${quality},${format},w_${width},c_limit,dpr_auto`;
    return `${head}${transform}/${cleanPath}`;
  }

  if (resolved.includes("images.unsplash.com")) {
    try {
      const u = new URL(resolved);
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(Math.min(85, quality)));
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "max");
      return u.toString();
    } catch {
      return resolved;
    }
  }

  return resolved;
}

/** Portrait on landing hero / about — max display ~520px */
export function getPortraitImageUrl(url) {
  if (!url) return null;
  return getHighQualityImageUrl(url, {
    width: 800,
    quality: 78,
    preserveTransparency: isTransparentImageUrl(String(url)),
  });
}

/** Course / lecture cards — smaller thumbnails */
export function getCardImageUrl(url) {
  if (!url) return null;
  return getHighQualityImageUrl(url, { width: 480, quality: 72 });
}

export function getPortraitImageSrcSet(url) {
  const resolved = resolvePublicImageUrl(url);
  if (!resolved || (isCloudinaryUrl(resolved) && !cloudinaryTransformsEnabled())) {
    return undefined;
  }
  return [480, 720, 960]
    .map((w) => `${getHighQualityImageUrl(url, { width: w, quality: 78 })} ${w}w`)
    .join(", ");
}

export function getHeroImageSrcSet(url) {
  const resolved = resolvePublicImageUrl(url);
  if (!resolved || (isCloudinaryUrl(resolved) && !cloudinaryTransformsEnabled())) {
    return undefined;
  }
  return [720, 1080, 1440]
    .map((w) => `${getHighQualityImageUrl(url, { width: w, quality: 80 })} ${w}w`)
    .join(", ");
}

export function getHeroImageUrl(url) {
  return getHighQualityImageUrl(url, { width: 1440, quality: 80 });
}

/** Tiny blurred placeholder URL when Cloudinary supports it */
export function getBlurPlaceholderUrl(url) {
  const resolved = resolvePublicImageUrl(url);
  if (!resolved || isCloudinaryUrl(resolved)) return null;
  const cloudinary = resolved.match(CLOUDINARY_UPLOAD);
  if (!cloudinary || !cloudinaryTransformsEnabled()) return null;
  const [, head, path] = cloudinary;
  const cleanPath = stripCloudinaryTransforms(path);
  return `${head}w_40,q_30,e_blur:800,f_auto/${cleanPath}`;
}
