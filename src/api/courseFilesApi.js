import baseUrl from "./baseUrl";
import { getApiOrigin, getResolvedApiTarget, useDevViteProxy } from "./apiConfig";
import { readAuthToken } from "../utils/authStorage";
import {
  getTenantSubdomain,
  resolveLoginTenantSubdomain,
} from "../utils/tenantHost";
import { getAuthScopeSubdomain } from "../utils/tenantAuthStorage";

/** يطابق الحد الافتراضي في الـBackend (`COURSE_PDF_MAX_FILE_SIZE_MB`) */
export const COURSE_PDF_MAX_FILE_SIZE_MB = 50;
export const COURSE_PDF_MAX_UPLOAD_BYTES = COURSE_PDF_MAX_FILE_SIZE_MB * 1024 * 1024;

export function formatCourseFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return null;
  const n = Number(bytes);
  if (n < 1024) return `${n.toLocaleString("ar-EG")} بايت`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function getCourseFileDisplayName(file) {
  return file?.title || file?.name || file?.originalName || file?.original_name || "ملف بدون اسم";
}

export function isPdfFile(file) {
  if (!file) return false;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

export function normalizeCourseFile(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id;
  return {
    id,
    courseId: raw.courseId ?? raw.course_id ?? null,
    lectureId: raw.lectureId ?? raw.lecture_id ?? null,
    teacherId: raw.teacherId ?? raw.teacher_id ?? null,
    title: raw.title || raw.name || "",
    description: raw.description || "",
    originalName: raw.originalName ?? raw.original_name ?? "",
    fileSize: raw.fileSize ?? raw.file_size ?? 0,
    mimeType: raw.mimeType ?? raw.mime_type ?? "application/pdf",
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
  };
}

function extractFilesList(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.files)) return payload.files;
  if (Array.isArray(payload)) return payload;
  return [];
}

function extractFilePayload(payload) {
  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }
  if (payload?.file && typeof payload.file === "object") return payload.file;
  if (payload && typeof payload === "object" && payload.id != null) return payload;
  return null;
}

export async function hydrateBlobError(err) {
  const data = err?.response?.data;
  if (!(data instanceof Blob)) return err;
  try {
    const text = await data.text();
    const json = JSON.parse(text);
    if (err.response) err.response.data = json;
  } catch {
    // keep original blob error
  }
  return err;
}

export function courseFilesApiError(err, fallback = "حدث خطأ غير متوقع") {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const message = data?.message || data?.msg || data?.error;

  if (status === 401) {
    return message || "يجب تسجيل الدخول أولاً للوصول إلى هذا الملف";
  }
  if (status === 403) {
    return message || "ليس لديك صلاحية الوصول إلى هذا الملف";
  }
  if (status === 404) {
    return message || "الملف غير موجود أو تم حذفه";
  }
  if (status === 413) {
    return message || `حجم الملف أكبر من الحد المسموح (${COURSE_PDF_MAX_FILE_SIZE_MB} ميجابايت)`;
  }
  if (status === 422) {
    return message || "البيانات المدخلة غير صحيحة، راجع العنوان والملف ثم حاول مرة أخرى";
  }
  if (status === 429) {
    return message || "تم تجاوز عدد المحاولات، انتظر قليلاً ثم حاول مرة أخرى";
  }
  if (status === 400) {
    return message || "تعذّر رفع الملف. تأكد أنه PDF وعنوانه غير فارغ";
  }
  if (status === 502) {
    return message || "تعذّر رفع الملف إلى التخزين، حاول مرة أخرى";
  }
  if (status === 500 || status >= 500) {
    return message || "حدث خطأ في الخادم، حاول مرة أخرى لاحقاً";
  }

  return message || err?.message || fallback;
}

export async function getLectureFiles(lectureId) {
  const { data } = await baseUrl.get(`/api/course/lecture/${lectureId}/files`);
  return extractFilesList(data)
    .map(normalizeCourseFile)
    .filter(Boolean)
    .sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
}

export async function uploadLectureFile(lectureId, { file, title, name, description }, onUploadProgress) {
  const form = new FormData();
  form.append("file", file);
  const displayTitle = String(title || name || "").trim();
  if (displayTitle) form.append("title", displayTitle);
  if (description) form.append("description", String(description).trim());

  const { data } = await baseUrl.post(`/api/course/lecture/${lectureId}/files`, form, {
    onUploadProgress: onUploadProgress
      ? (event) => {
          if (event.total) {
            onUploadProgress(Math.round((event.loaded / event.total) * 100), event);
          }
        }
      : undefined,
  });
  return normalizeCourseFile(extractFilePayload(data));
}

export async function getCourseFiles(courseId) {
  const { data } = await baseUrl.get(`/api/courses/${courseId}/files`);
  return extractFilesList(data)
    .map(normalizeCourseFile)
    .filter(Boolean)
    .sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
}

/** @deprecated استخدم getCourseFiles */
export const fetchCourseFiles = getCourseFiles;

export async function getCourseFile(fileId) {
  const { data } = await baseUrl.get(`/api/course-files/${fileId}`);
  return normalizeCourseFile(extractFilePayload(data));
}

export async function uploadCourseFile(courseId, { file, title, name, description }, onUploadProgress) {
  const form = new FormData();
  form.append("file", file);
  const displayTitle = String(title || name || "").trim();
  if (displayTitle) form.append("title", displayTitle);
  if (description) form.append("description", String(description).trim());

  const { data } = await baseUrl.post(`/api/courses/${courseId}/files`, form, {
    onUploadProgress: onUploadProgress
      ? (event) => {
          if (event.total) {
            onUploadProgress(Math.round((event.loaded / event.total) * 100), event);
          }
        }
      : undefined,
  });
  return normalizeCourseFile(extractFilePayload(data));
}

export async function updateCourseFile(fileId, { title, description }) {
  const body = {};
  if (title != null) body.title = String(title).trim();
  if (description != null) body.description = String(description).trim();

  const { data } = await baseUrl.patch(`/api/course-files/${fileId}`, body);
  return normalizeCourseFile(extractFilePayload(data)) || { id: fileId, ...body };
}

export async function deleteCourseFile(fileId) {
  const { data } = await baseUrl.delete(`/api/course-files/${fileId}`);
  return data;
}

function bytesLookLikePdf(bytes) {
  if (!bytes?.length) return false;
  const magic = new TextDecoder().decode(bytes.slice(0, 5));
  return magic.startsWith("%PDF");
}

function blobFromBytes(bytes) {
  if (!bytesLookLikePdf(bytes)) {
    let message = "الملف المستلم ليس PDF صالحاً";
    try {
      const json = JSON.parse(new TextDecoder().decode(bytes));
      if (json?.message) message = json.message;
    } catch {
      // not JSON
    }
    const error = new Error(message);
    error.response = { status: 502, data: { message } };
    throw error;
  }
  return new Blob([bytes], { type: "application/pdf" });
}

function isApiBackedViewUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/api/")) return true;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    return (
      parsed.origin === window.location.origin &&
      parsed.pathname.startsWith("/api/")
    );
  } catch {
    return false;
  }
}

async function resolveCourseFileDirectViewUrl(fileId) {
  const { data } = await baseUrl.post(
    `/api/course-files/${fileId}/view`,
    {},
    {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      params: { client: "app", format: "json" },
    },
  );
  return data?.data?.signedViewUrl || null;
}

async function fetchCourseFilePdfFromDirectUrl(signedViewUrl) {
  const absolute = /^https?:\/\//i.test(signedViewUrl)
    ? signedViewUrl
    : `${window.location.origin}${signedViewUrl.startsWith("/") ? "" : "/"}${signedViewUrl}`;

  const response = await fetch(absolute, {
    credentials: "omit",
    redirect: "follow",
  });

  if (!response.ok) {
    const error = new Error(`تعذّر جلب الملف (${response.status})`);
    error.response = { status: response.status, data: { message: error.message } };
    throw error;
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  return blobFromBytes(bytes);
}

function getCourseFileStreamBaseUrl() {
  if (useDevViteProxy()) {
    return getResolvedApiTarget();
  }
  return getApiOrigin() || getResolvedApiTarget() || window.location.origin;
}

function buildCourseFileViewAuthHeaders(accept = "application/octet-stream") {
  const headers = {
    Accept: accept,
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  };
  const token = readAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenant =
    getTenantSubdomain() || getAuthScopeSubdomain() || resolveLoginTenantSubdomain();
  if (tenant) headers["X-Tenant-Subdomain"] = tenant;
  return headers;
}

async function streamCourseFilePdfViaApi(fileId) {
  const apiBase = getCourseFileStreamBaseUrl().replace(/\/$/, "");
  const url = `${apiBase}/api/course-files/${fileId}/view?client=app`;

  const response = await fetch(url, {
    method: "POST",
    headers: buildCourseFileViewAuthHeaders(),
    body: "{}",
    credentials: "omit",
    redirect: "follow",
  });

  if (!response.ok) {
    let payload = { message: `تعذّر تحميل الملف (${response.status})` };
    try {
      payload = await response.json();
    } catch {
      // keep default message
    }
    const error = new Error(
      payload.message || payload.msg || payload.error || "تعذّر تحميل الملف",
    );
    error.response = { status: response.status, data: payload };
    throw error;
  }

  const contentType = String(response.headers.get("content-type") || "");
  const bytes = new Uint8Array(await response.arrayBuffer());

  if (contentType.includes("application/json")) {
    const json = JSON.parse(new TextDecoder().decode(bytes));
    const error = new Error(json.message || "تعذّر تحميل الملف");
    error.response = { status: response.status, data: json };
    throw error;
  }

  return blobFromBytes(bytes);
}

/**
 * يجلب محتوى PDF بعد التحقق من الصلاحيات.
 * يُستخدم داخل العارض فقط — لا يُحفظ الرابط ولا الـBlob بشكل دائم.
 */
export async function getCourseFileView(fileId) {
  // في التطوير مع Vite proxy: البث المباشر عبر :8000 — الـproxy يقطع الملفات الكبيرة
  if (!useDevViteProxy()) {
    try {
      const signedViewUrl = await resolveCourseFileDirectViewUrl(fileId);
      if (signedViewUrl && !isApiBackedViewUrl(signedViewUrl)) {
        try {
          return await fetchCourseFilePdfFromDirectUrl(signedViewUrl);
        } catch {
          // الرابط الموقّع (CDN) فشل — نجرّب البث عبر API
        }
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        throw err;
      }
    }
  }

  try {
    return await streamCourseFilePdfViaApi(fileId);
  } catch (err) {
    const data = err?.response?.data;
    if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      try {
        const text = new TextDecoder().decode(data instanceof ArrayBuffer ? data : data.buffer);
        const json = JSON.parse(text);
        if (err.response) err.response.data = json;
      } catch {
        // keep original error
      }
    } else {
      await hydrateBlobError(err);
    }
    throw err;
  }
}

export function validateCourseFileUpload({ file, title, name, description }) {
  const displayTitle = String(title || name || "").trim();
  if (!displayTitle) return "عنوان الملف مطلوب";
  if (displayTitle.length > 200) return "عنوان الملف طويل جداً";
  if (description && String(description).length > 1000) return "الوصف طويل جداً";
  if (!file) return "اختر ملف PDF";
  if (!isPdfFile(file)) return "يُسمح بملفات PDF فقط";
  if (file.size > COURSE_PDF_MAX_UPLOAD_BYTES) {
    return `حجم الملف يتجاوز ${COURSE_PDF_MAX_FILE_SIZE_MB} ميجابايت`;
  }
  return null;
}

export function validateCourseFileUpdate({ title, description }) {
  const displayTitle = String(title || "").trim();
  if (!displayTitle) return "عنوان الملف مطلوب";
  if (displayTitle.length > 200) return "عنوان الملف طويل جداً";
  if (description && String(description).length > 1000) return "الوصف طويل جداً";
  return null;
}

/** مسار العرض داخل المنصة — بدون روابط تخزين في الـURL */
export function buildCourseFileViewPath(courseId, file) {
  const fileId = file?.id;
  if (!courseId || fileId == null || fileId === "") return null;
  return `/CourseDetailsPage/${courseId}/file/${fileId}`;
}
