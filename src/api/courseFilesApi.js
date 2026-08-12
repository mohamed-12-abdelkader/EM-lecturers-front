import baseUrl from "./baseUrl";

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

export function getCourseFileUrl(file) {
  return file?.file_url || file?.url || file?.link || null;
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
  return err?.response?.data?.message || err?.response?.data?.msg || err?.message || fallback;
}

export async function fetchCourseFiles(courseId) {
  const { data } = await baseUrl.get(`/api/course/${courseId}/files`);
  return Array.isArray(data?.files) ? data.files : [];
}

export async function uploadCourseFile(courseId, { file, name, file_url }) {
  const form = new FormData();
  if (file) form.append("file", file);
  if (name) form.append("name", name);
  if (file_url) form.append("file_url", file_url);

  const { data } = await baseUrl.post(`/api/course/${courseId}/files`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.file ?? data;
}

export async function deleteCourseFile(courseId, fileId) {
  const { data } = await baseUrl.delete(`/api/course/${courseId}/files/${fileId}`);
  return data?.file ?? data;
}

export function validateCourseFileUpload({ file, name, file_url }) {
  if (!String(name || "").trim()) return "اسم الملف مطلوب";
  if (!file && !String(file_url || "").trim()) return "اختر ملفاً أو أدخل رابطاً";
  if (file && file.size > MAX_UPLOAD_BYTES) return "حجم الملف يتجاوز 50MB";
  if (file_url && !/^https?:\/\//i.test(String(file_url).trim())) {
    return "أدخل رابطاً صالحاً يبدأ بـ https://";
  }
  return null;
}
