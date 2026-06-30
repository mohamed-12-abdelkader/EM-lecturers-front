import baseUrl from "./baseUrl";

const API = "/api/teacher";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return "—";
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
  "jpg",
  "jpeg",
  "png",
  "webp",
];

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_BULK_FILES = 20;

export function validateTeacherFile(file) {
  if (!file) return "لم يتم اختيار ملف";
  if (file.size > MAX_FILE_SIZE_BYTES) return "الحد الأقصى لحجم الملف 100 ميجابايت";
  const ext = (file.name || "").split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return "نوع الملف غير مدعوم";
  }
  return null;
}

export function apiErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

function inferPreviewType(raw) {
  const ext = (raw?.fileExtension ?? raw?.file_extension ?? "").toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
  return "none";
}

/** توحيد حقول الملف بين camelCase و snake_case */
export function normalizeTeacherFile(raw) {
  if (!raw) return null;
  const fileExtension = raw.fileExtension ?? raw.file_extension ?? "";
  const previewType = raw.previewType ?? raw.preview_type ?? inferPreviewType(raw);
  return {
    id: raw.id,
    teacherId: raw.teacherId ?? raw.teacher_id,
    name: raw.name,
    description: raw.description,
    fileUrl: raw.fileUrl ?? raw.file_url,
    fileKey: raw.fileKey ?? raw.file_key,
    fileSize: raw.fileSize ?? raw.file_size,
    fileExtension,
    mimeType: raw.mimeType ?? raw.mime_type,
    categoryId: raw.categoryId ?? raw.category_id,
    categoryName: raw.categoryName ?? raw.category_name,
    downloadsCount: raw.downloadsCount ?? raw.downloads_count ?? 0,
    previewType,
    canPreviewInline:
      raw.canPreviewInline ??
      raw.can_preview_inline ??
      (previewType === "pdf" || previewType === "image"),
    viewUrl: raw.viewUrl ?? raw.view_url,
    contentUrl: raw.contentUrl ?? raw.content_url,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

// ── Categories ──

export async function fetchFileCategories(token, teacherId) {
  const params = teacherId ? { teacher_id: teacherId } : {};
  const { data } = await baseUrl.get(`${API}/file-categories`, {
    params,
    headers: authHeaders(token),
  });
  return Array.isArray(data?.data) ? data.data : [];
}

export async function createFileCategory(name, token, teacherId) {
  const body = teacherId ? { name, teacher_id: teacherId } : { name };
  const { data } = await baseUrl.post(`${API}/file-categories`, body, {
    headers: authHeaders(token),
  });
  return data?.data;
}

export async function updateFileCategory(id, name, token) {
  const { data } = await baseUrl.put(`${API}/file-categories/${id}`, { name }, {
    headers: authHeaders(token),
  });
  return data?.data;
}

export async function deleteFileCategory(id, token) {
  const { data } = await baseUrl.delete(`${API}/file-categories/${id}`, {
    headers: authHeaders(token),
  });
  return data;
}

// ── Files ──

export async function fetchFiles(params, token, teacherId) {
  const query = { ...params };
  if (teacherId) query.teacher_id = teacherId;
  const { data } = await baseUrl.get(`${API}/files`, {
    params: query,
    headers: authHeaders(token),
  });
  return {
    items: (data?.data?.items ?? []).map(normalizeTeacherFile),
    pagination: data?.data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function fetchFile(id, token, teacherId) {
  const params = teacherId ? { teacher_id: teacherId } : {};
  const { data } = await baseUrl.get(`${API}/files/${id}`, {
    params,
    headers: authHeaders(token),
  });
  return normalizeTeacherFile(data?.data);
}

/** رابط العرض المباشر داخل iframe/img (يدعم access_token حسب توثيق API) */
export function buildFileViewSrc(id, token) {
  if (!id || !token) return "";
  const params = new URLSearchParams({ access_token: token });
  return `${API}/files/${id}/view?${params.toString()}`;
}

/** جلب الملف كـ Blob للعرض داخل الموقع (لا يزيد downloads_count) */
export async function fetchFileViewBlob(id, token, fallbackMime) {
  const response = await baseUrl.get(`${API}/files/${id}/view`, {
    headers: authHeaders(token),
    responseType: "blob",
  });

  const contentType =
    response.headers?.["content-type"]?.split(";")[0]?.trim() ||
    fallbackMime ||
    "application/octet-stream";

  const blob = response.data;
  if (blob instanceof Blob && blob.type !== contentType) {
    return new Blob([blob], { type: contentType });
  }
  return blob;
}

/** محتوى نصي مستخرج (PDF) */
export async function fetchFileContent(id, token) {
  const { data } = await baseUrl.get(`${API}/files/${id}/content`, {
    headers: authHeaders(token),
  });
  return data?.data ?? null;
}

export async function fetchFileStatistics(token, teacherId) {
  const params = teacherId ? { teacher_id: teacherId } : {};
  const { data } = await baseUrl.get(`${API}/files/statistics`, {
    params,
    headers: authHeaders(token),
  });
  return data?.data ?? null;
}

export async function uploadFile(
  { file, name, description, categoryId },
  token,
  teacherId,
  onUploadProgress
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  if (description) formData.append("description", description);
  if (categoryId) formData.append("categoryId", String(categoryId));
  if (teacherId) formData.append("teacher_id", String(teacherId));

  const { data } = await baseUrl.post(`${API}/files`, formData, {
    headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
    onUploadProgress: onUploadProgress
      ? (event) => {
          if (event.total) {
            onUploadProgress(Math.round((event.loaded / event.total) * 100), event);
          }
        }
      : undefined,
  });
  return data?.data;
}

export async function bulkUploadFiles(
  { files, categoryId, description, namePrefix },
  token,
  teacherId
) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  if (categoryId) formData.append("categoryId", String(categoryId));
  if (description) formData.append("description", description);
  if (namePrefix) formData.append("namePrefix", namePrefix);
  if (teacherId) formData.append("teacher_id", String(teacherId));

  const { data } = await baseUrl.post(`${API}/files/bulk-upload`, formData, {
    headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
  });
  return data?.data;
}

export async function updateFile(id, payload, token) {
  const { data } = await baseUrl.put(`${API}/files/${id}`, payload, {
    headers: authHeaders(token),
  });
  return data?.data;
}

export async function deleteFile(id, token) {
  const { data } = await baseUrl.delete(`${API}/files/${id}`, {
    headers: authHeaders(token),
  });
  return data;
}

export async function bulkDeleteFiles(ids, token) {
  const { data } = await baseUrl.delete(`${API}/files/bulk`, {
    data: { ids },
    headers: authHeaders(token),
  });
  return data;
}

export async function downloadFile(id, token) {
  const { data } = await baseUrl.get(`${API}/files/${id}/download`, {
    headers: authHeaders(token),
  });
  return data?.data;
}
