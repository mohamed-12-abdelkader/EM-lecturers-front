/**
 * معالجة صور الرفع — تحافظ على شفافية PNG ولا تُخفّض الجودة إلا عند الحاجة.
 */

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
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
}

async function imageHasTransparency(img) {
  const w = Math.min(img.width, 80);
  const h = Math.min(img.height, 80);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

function fileFromBlob(blob, originalName, mime) {
  const ext = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
  const baseName = (originalName || "image").replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}${ext}`, { type: mime, lastModified: Date.now() });
}

async function renderToCanvas(img, maxWidth) {
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
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

async function compressAsPng(canvas, fileName, maxBytes) {
  let blob = await canvasToBlob(canvas, "image/png");
  if (!blob) return null;

  if (blob.size <= maxBytes) {
    return fileFromBlob(blob, fileName, "image/png");
  }

  let scale = 0.92;
  let current = canvas;
  while (scale > 0.45) {
    const w = Math.max(1, Math.round(current.width * scale));
    const h = Math.max(1, Math.round(current.height * scale));
    const next = document.createElement("canvas");
    next.width = w;
    next.height = h;
    const ctx = next.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(current, 0, 0, w, h);
    blob = await canvasToBlob(next, "image/png");
    if (blob && blob.size <= maxBytes) {
      return fileFromBlob(blob, fileName, "image/png");
    }
    current = next;
    scale -= 0.08;
  }

  return blob ? fileFromBlob(blob, fileName, "image/png") : null;
}

async function compressAsJpeg(canvas, fileName, quality, maxBytes) {
  let q = quality;
  let blob = await canvasToBlob(canvas, "image/jpeg", q);
  while (blob && blob.size > maxBytes && q > 0.5) {
    q = Math.max(0.5, q - 0.06);
    blob = await canvasToBlob(canvas, "image/jpeg", q);
  }
  return blob ? fileFromBlob(blob, fileName, "image/jpeg") : null;
}

export async function compressImage(
  file,
  {
    maxWidth = 2048,
    quality = 0.92,
    maxBytes = 2 * 1024 * 1024,
    preserveOriginal = true,
  } = {},
) {
  if (!file || !file.type?.startsWith("image/")) {
    return file;
  }

  try {
    const img = await loadImageFromFile(file);
    const transparent =
      file.type === "image/png" ||
      file.type === "image/webp" ||
      (await imageHasTransparency(img));

    const withinSize = file.size <= maxBytes;
    const withinDimensions = img.width <= maxWidth && img.height <= maxWidth;

    if (preserveOriginal && withinSize && withinDimensions) {
      return file;
    }

    const canvas = await renderToCanvas(img, maxWidth);

    if (transparent) {
      const pngFile = await compressAsPng(canvas, file.name, maxBytes);
      return pngFile || file;
    }

    const jpegFile = await compressAsJpeg(canvas, file.name, quality, maxBytes);
    return jpegFile || file;
  } catch {
    return file;
  }
}

/** حدود رفع أعلى — ضغط خفيف فقط عند تجاوز الحجم */
export const TENANT_MEDIA_COMPRESS = {
  avatar: { maxWidth: 1600, quality: 0.92, maxBytes: 2 * 1024 * 1024 },
  favicon: { maxWidth: 512, quality: 0.95, maxBytes: 400 * 1024 },
  og_image: { maxWidth: 1920, quality: 0.9, maxBytes: 2 * 1024 * 1024 },
  hero_image: { maxWidth: 2800, quality: 0.95, maxBytes: 4 * 1024 * 1024 },
};

export async function compressTenantMediaFiles(files) {
  const keys = ["avatar", "favicon", "og_image", "hero_image"];
  const next = { ...files };
  await Promise.all(
    keys.map(async (key) => {
      if (!files[key]) return;
      next[key] = await compressImage(files[key], {
        ...(TENANT_MEDIA_COMPRESS[key] || {}),
        preserveOriginal: true,
      });
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
