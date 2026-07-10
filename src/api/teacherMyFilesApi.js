import baseUrl from "./baseUrl";
import { getApiOrigin, useDevViteProxy } from "./apiConfig";

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
  const sourceType = raw?.sourceType ?? raw?.source_type;
  if (sourceType === "drive" || raw?.driveUrl || raw?.drive_url) return "drive";
  const ext = (raw?.fileExtension ?? raw?.file_extension ?? "").toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
  return "none";
}

export function isDriveFile(file) {
  if (!file) return false;
  return (
    file.sourceType === "drive" ||
    file.source_type === "drive" ||
    file.storageProvider === "google_drive" ||
    file.storage_provider === "google_drive" ||
    Boolean(file.driveUrl || file.drive_url)
  );
}

const DRIVE_URL_PATTERN =
  /^https?:\/\/(drive\.google\.com|docs\.google\.com)\//i;

export function validateDriveUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "رابط Google Drive مطلوب";
  if (!/^https?:\/\//i.test(value)) return "أدخل رابطاً صالحاً يبدأ بـ https://";
  if (!DRIVE_URL_PATTERN.test(value)) {
    return "يجب أن يكون الرابط من Google Drive أو Google Docs";
  }
  return null;
}

export function inferExtensionFromDriveUrl(url, name) {
  const fromName = (name || "").split(".").pop()?.toLowerCase();
  if (fromName && ALLOWED_EXTENSIONS.includes(fromName)) return fromName;
  const u = String(url || "").toLowerCase();
  if (u.includes("/document/")) return "docx";
  if (u.includes("/spreadsheets/")) return "xlsx";
  if (u.includes("/presentation/")) return "pptx";
  return "pdf";
}

/** توحيد حقول الملف بين camelCase و snake_case */
export function normalizeTeacherFile(raw) {
  if (!raw) return null;
  const fileExtension = raw.fileExtension ?? raw.file_extension ?? "";
  const sourceType = raw.sourceType ?? raw.source_type ?? (raw.driveUrl || raw.drive_url ? "drive" : "upload");
  const driveUrl = raw.driveUrl ?? raw.drive_url ?? null;
  const drivePreviewUrl = raw.drivePreviewUrl ?? raw.drive_preview_url ?? null;
  const driveViewUrl = raw.driveViewUrl ?? raw.drive_view_url ?? driveUrl;
  const storageProvider = raw.storageProvider ?? raw.storage_provider ?? null;
  const previewType = raw.previewType ?? raw.preview_type ?? inferPreviewType(raw);
  const isDrive = sourceType === "drive" || storageProvider === "google_drive" || Boolean(driveUrl);
  const viewerComponent =
    raw.viewerComponent ??
    raw.viewer_component ??
    (isDrive
      ? "drive-embed"
      : previewType === "pdf"
        ? "pdf-viewer"
        : previewType === "image"
          ? "image-viewer"
          : "download-only");
  return {
    id: raw.id,
    teacherId: raw.teacherId ?? raw.teacher_id,
    name: raw.name,
    description: raw.description,
    sourceType,
    driveUrl,
    drivePreviewUrl,
    driveViewUrl,
    storageProvider,
    fileUrl: raw.fileUrl ?? raw.file_url ?? driveUrl,
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
      (isDrive || previewType === "pdf" || previewType === "image"),
    viewUrl: raw.viewUrl ?? raw.view_url,
    contentUrl: raw.contentUrl ?? raw.content_url,
    embedUrl: raw.embedUrl ?? raw.embed_url,
    viewerComponent,
    fileSizeLabel: raw.fileSizeLabel ?? raw.file_size_label,
    absoluteViewUrl: raw.absoluteViewUrl ?? raw.absolute_view_url,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

/** توحيد استجابة GET /files/:id/preview */
export function normalizeFilePreview(raw) {
  if (!raw) return null;
  const file = raw.file ?? {};
  const preview = raw.preview ?? {};
  const display = raw.display ?? {};
  const urls = raw.urls ?? {};
  const content = raw.content ?? {};

  return {
    file: normalizeTeacherFile({
      ...file,
      absoluteViewUrl: file.absoluteViewUrl ?? file.absolute_view_url ?? urls.view,
      viewUrl: file.viewUrl ?? file.view_url ?? urls.view,
      contentUrl: file.contentUrl ?? file.content_url ?? urls.content,
    }),
    preview: {
      type: preview.type ?? preview.previewType ?? preview.preview_type,
      mode: preview.mode ?? "inline",
      viewerComponent:
        preview.viewerComponent ??
        preview.viewer_component ??
        file.viewerComponent ??
        file.viewer_component,
      canPreviewInline:
        preview.canPreviewInline ??
        preview.can_preview_inline ??
        file.canPreviewInline ??
        file.can_preview_inline,
      canExtractText: preview.canExtractText ?? preview.can_extract_text,
    },
    display: {
      icon: display.icon,
      extensionLabel: display.extensionLabel ?? display.extension_label,
      fileSizeLabel: display.fileSizeLabel ?? display.file_size_label,
      badgeColor: display.badgeColor ?? display.badge_color,
    },
    urls: {
      view: urls.view,
      download: urls.download,
      content: urls.content,
      embed: urls.embed,
      open: urls.open,
      drivePreview: urls.drivePreview ?? urls.drive_preview,
      driveView: urls.driveView ?? urls.drive_view,
    },
    actions: raw.actions ?? {},
    content: {
      text: content.text ?? null,
      paragraphs: Array.isArray(content.paragraphs) ? content.paragraphs : [],
      pageCount: content.pageCount ?? content.page_count,
      characterCount: content.characterCount ?? content.character_count,
      truncated: content.truncated === true,
      supported: content.supported,
      message: content.message,
    },
  };
}

/** يحوّل مسار API نسبي إلى رابط كامل */
export function resolveTeacherFileUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  if (typeof window !== "undefined" && useDevViteProxy()) {
    return `${window.location.origin}${path}`;
  }
  const origin = getApiOrigin();
  return origin ? `${origin}${path}` : path;
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

/** بيانات العرض الاحترافية — المسار الموصى به للواجهة */
export async function fetchFilePreview(id, token, { includeText = true, teacherId } = {}) {
  const params = { includeText: includeText ? "true" : "false" };
  if (teacherId) params.teacher_id = teacherId;
  const { data } = await baseUrl.get(`${API}/files/${id}/preview`, {
    params,
    headers: authHeaders(token),
  });
  return normalizeFilePreview(data?.data);
}

/** بيانات العرض داخل iframe لملفات Google Drive */
export async function fetchFileEmbed(id, token, teacherId) {
  const params = teacherId ? { teacher_id: teacherId } : {};
  const { data } = await baseUrl.get(`${API}/files/${id}/embed`, {
    params,
    headers: authHeaders(token),
  });
  const payload = data?.data ?? data ?? {};
  return {
    drivePreviewUrl: payload.drivePreviewUrl ?? payload.drive_preview_url,
    recommendedIframeSrc:
      payload.recommendedIframeSrc ?? payload.recommended_iframe_src ?? payload.drivePreviewUrl,
    driveViewUrl: payload.driveViewUrl ?? payload.drive_view_url,
    openUrl: payload.openUrl ?? payload.open_url,
  };
}

export function getDrivePreviewSrc(file, embedData) {
  return (
    embedData?.recommendedIframeSrc ||
    embedData?.drivePreviewUrl ||
    file?.drivePreviewUrl ||
    file?.driveUrl ||
    file?.fileUrl ||
    ""
  );
}

export function getDriveOpenUrl(file, embedData) {
  return (
    embedData?.openUrl ||
    embedData?.driveViewUrl ||
    file?.driveViewUrl ||
    file?.driveUrl ||
    file?.fileUrl ||
    ""
  );
}

export function buildFileOpenSrc(id, token) {
  if (!id || !token) return "";
  const params = new URLSearchParams({ access_token: token });
  const path = `/api/teacher/files/${id}/open?${params.toString()}`;
  if (typeof window !== "undefined" && useDevViteProxy()) {
    return `${window.location.origin}${path}`;
  }
  const origin = getApiOrigin();
  return origin ? `${origin}${path}` : path;
}

/**
 * رابط العرض المباشر داخل iframe/img (ملفات مرفوعة)
 * يدعم access_token في الاستعلام حسب توثيق API
 */
export function buildFileViewSrc(id, token, viewPath) {
  if (!id || !token) return "";
  if (viewPath) {
    const url = resolveTeacherFileUrl(viewPath);
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}access_token=${encodeURIComponent(token)}`;
  }
  const params = new URLSearchParams({ access_token: token });
  const path = `/api/teacher/files/${id}/view?${params.toString()}`;
  if (typeof window !== "undefined" && useDevViteProxy()) {
    return `${window.location.origin}${path}`;
  }
  const origin = getApiOrigin();
  return origin ? `${origin}${path}` : path;
}

/** جلب الملف كـ Blob للعرض داخل الموقع (لا يزيد downloads_count) */
export async function fetchFileViewBlob(id, token, fallbackMime, teacherId) {
  const params = teacherId ? { teacher_id: teacherId } : {};
  const response = await baseUrl.get(`${API}/files/${id}/view`, {
    params,
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

/** إنشاء object URL للعرض داخل iframe أو img */
export async function createFileViewObjectUrl(id, token, options = {}) {
  const { mimeType, teacherId } = options;
  const blob = await fetchFileViewBlob(id, token, mimeType, teacherId);
  return URL.createObjectURL(blob);
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

export async function addDriveFile(payload, token, teacherId) {
  const body = {
    name: payload.name.trim(),
    driveUrl: payload.driveUrl.trim(),
    description: payload.description?.trim() || undefined,
    categoryId: payload.categoryId ? Number(payload.categoryId) : undefined,
    fileExtension: payload.fileExtension?.trim() || undefined,
  };
  if (teacherId) body.teacher_id = teacherId;

  const { data } = await baseUrl.post(`${API}/files`, body, {
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
  });
  return normalizeTeacherFile(data?.data);
}

export async function bulkAddDriveLinks(payload, token, teacherId) {
  const body = {
    links: payload.links.map((item) => ({
      name: item.name.trim(),
      driveUrl: item.driveUrl.trim(),
      fileExtension: item.fileExtension?.trim() || undefined,
      description: item.description?.trim() || undefined,
    })),
  };
  if (payload.categoryId) body.categoryId = Number(payload.categoryId);
  if (payload.description?.trim()) body.description = payload.description.trim();
  if (teacherId) body.teacher_id = teacherId;

  const { data } = await baseUrl.post(`${API}/files/bulk-links`, body, {
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
  });
  return data?.data ?? data;
}

/** رفع ملف من الجهاز (multipart — اختياري للملفات القديمة) */
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
  return normalizeTeacherFile(data?.data);
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
  const body = { ...payload };
  if (body.categoryId != null && body.categoryId !== "") {
    body.categoryId = Number(body.categoryId);
  } else if (body.categoryId === "" || body.categoryId === null) {
    body.categoryId = null;
  }
  const { data } = await baseUrl.put(`${API}/files/${id}`, body, {
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
  });
  return normalizeTeacherFile(data?.data);
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
