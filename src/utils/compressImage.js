/**
 * ضغط صورة قبل الرفع لتجنب خطأ 413 (Content Too Large) من nginx/السيرفر.
 */
export async function compressImage(
  file,
  {
    maxWidth = 1024,
    quality = 0.8,
    maxBytes = 600 * 1024,
    preferPng = false,
  } = {},
) {
  if (!file || !file.type?.startsWith("image/")) {
    return file;
  }

  const loadImage = () =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const renderBlob = (img, mime, q) =>
    new Promise((resolve) => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => resolve(blob), mime, q);
    });

  try {
    const img = await loadImage();
    const usePng = preferPng && file.type === "image/png";
    let mime = usePng ? "image/png" : "image/jpeg";
    let q = quality;
    let blob = await renderBlob(img, mime, q);

    while (blob && blob.size > maxBytes && q > 0.45) {
      q = Math.max(0.45, q - 0.08);
      if (!usePng && q < 0.7) {
        mime = "image/jpeg";
      }
      blob = await renderBlob(img, mime, q);
    }

    if (!blob) return file;

    const ext = mime === "image/png" ? ".png" : ".jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}${ext}`, {
      type: mime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export const TENANT_MEDIA_COMPRESS = {
  avatar: { maxWidth: 480, quality: 0.8, maxBytes: 250 * 1024 },
  favicon: { maxWidth: 128, quality: 0.82, maxBytes: 80 * 1024, preferPng: true },
  og_image: { maxWidth: 1000, quality: 0.75, maxBytes: 300 * 1024 },
  hero_image: { maxWidth: 1280, quality: 0.7, maxBytes: 350 * 1024 },
};

export async function compressTenantMediaFiles(files) {
  const keys = ["avatar", "favicon", "og_image", "hero_image"];
  const next = { ...files };

  await Promise.all(
    keys.map(async (key) => {
      if (!files[key]) return;
      next[key] = await compressImage(files[key], TENANT_MEDIA_COMPRESS[key] || {});
    }),
  );

  return next;
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
