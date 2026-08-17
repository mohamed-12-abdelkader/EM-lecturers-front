import baseUrl from "./baseUrl";
import { getApiOrigin, useDevViteProxy } from "./apiConfig";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function formatCourseFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return null;
  const n = Number(bytes);
  if (n < 1024) return `${n.toLocaleString("ar-EG")} بايت`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function getCourseFileDisplayName(file) {
  return file?.name || file?.filename || file?.title || "ملف بدون اسم";
}

export function isAbsoluteHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || "").trim());
}

/** مسار محلي على الـ API مثل /uploads/course-files/... */
export function isCourseFileUploadPath(url) {
  const s = String(url || "").trim();
  return s.startsWith("/uploads/") || s.startsWith("uploads/");
}

/** يحوّل file_url النسبي إلى رابط كامل (Bunny HTTPS أو مسار API) */
export function resolveCourseFileAbsoluteUrl(url) {
  if (!url || typeof url !== "string") return null;
  const raw = url.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  const path = raw.startsWith("/") ? raw : `/${raw}`;
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

export function getCourseFileUrl(file) {
  const raw = file?.file_url || file?.url || file?.link || null;
  if (!raw) return null;
  if (isAbsoluteHttpUrl(raw)) return raw;
  if (isCourseFileUploadPath(raw) || raw.startsWith("/")) {
    return resolveCourseFileAbsoluteUrl(raw);
  }
  return raw;
}

/** رابط HTTPS خارجي (Bunny CDN وغيره) — ليس Google Drive */
export function isRemoteCourseFileUrl(url) {
  return isAbsoluteHttpUrl(url) && !/drive\.google\.com/i.test(String(url || ""));
}

export function isCourseFilePdf(file) {
  const type = String(file?.file_type || "").toLowerCase();
  if (type.includes("pdf")) return true;
  const url = getCourseFileUrl(file) || "";
  return /\.pdf(\?|$)/i.test(url);
}

export function isCourseFileImage(file) {
  const type = String(file?.file_type || "").toLowerCase();
  if (type.startsWith("image/")) return true;
  const url = getCourseFileUrl(file) || "";
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

export function getCourseFileKind(file) {
  if (isCourseFilePdf(file)) return "pdf";
  if (isCourseFileImage(file)) return "image";
  const type = String(file?.file_type || "").toLowerCase();
  if (type.includes("word") || type.includes("document")) return "doc";
  if (type.includes("sheet") || type.includes("excel")) return "sheet";
  if (type.includes("presentation") || type.includes("powerpoint")) return "slides";
  if (type.includes("zip") || type.includes("compressed")) return "archive";
  return "other";
}

export function courseFilesApiError(err, fallback = "حدث خطأ غير متوقع") {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const message = data?.message || data?.msg;

  if (status === 403) {
    return message || "ليس لديك صلاحية للوصول إلى ملفات هذا الكورس";
  }
  if (status === 413) {
    return message || "حجم الملف يتجاوز 50MB";
  }
  if (status === 502) {
    return message || "فشل رفع الملف على التخزين السحابي والمحلي، حاول مرة أخرى";
  }
  if (status === 404) {
    return message || "الكورس أو الملف غير موجود";
  }
  if (status === 400) {
    return message || "بيانات الرفع غير مكتملة";
  }

  return message || err?.message || fallback;
}

export async function fetchCourseFiles(courseId) {
  const { data } = await baseUrl.get(`/api/course/${courseId}/files`);
  const files = Array.isArray(data?.files) ? data.files : [];
  return [...files].sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return tb - ta;
  });
}

export async function uploadCourseFile(courseId, { file, name, filename, file_url }) {
  const form = new FormData();
  if (file) form.append("file", file);
  const displayName = String(name || filename || "").trim();
  if (displayName) form.append("name", displayName);
  if (file_url) form.append("file_url", String(file_url).trim());

  const { data } = await baseUrl.post(`/api/course/${courseId}/files`, form);
  return data?.file ?? data;
}

export async function deleteCourseFile(courseId, fileId) {
  const { data } = await baseUrl.delete(`/api/course/${courseId}/files/${fileId}`);
  return data?.file ?? data;
}

export function validateCourseFileUpload({ file, name, filename, file_url }) {
  if (!String(name || filename || "").trim()) return "اسم الملف مطلوب";
  if (!file && !String(file_url || "").trim()) return "اختر ملفاً أو أدخل رابطاً";
  if (file && file.size > MAX_UPLOAD_BYTES) return "حجم الملف يتجاوز 50MB";
  if (file_url && !/^https?:\/\//i.test(String(file_url).trim())) {
    return "أدخل رابطاً صالحاً يبدأ بـ https://";
  }
  return null;
}
