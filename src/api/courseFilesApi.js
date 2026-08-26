import baseUrl from "./baseUrl";

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

/**
 * يجلب محتوى PDF بعد التحقق من الصلاحيات.
 * يُستخدم داخل العارض فقط — لا يُحفظ الرابط ولا الـBlob بشكل دائم.
 */
export async function getCourseFileView(fileId) {
  try {
    const response = await baseUrl.post(
      `/api/course-files/${fileId}/view`,
      {},
      {
        responseType: "arraybuffer",
        maxRedirects: 0,
        headers: {
          Accept: "application/octet-stream",
          "X-Requested-With": "XMLHttpRequest",
        },
        params: { client: "app" },
      },
    );

    const buffer = response.data;
    const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer?.data || buffer || []);
    const contentType = String(response.headers?.["content-type"] || "");

    if (contentType.includes("application/json")) {
      const json = JSON.parse(new TextDecoder().decode(bytes));
      const error = new Error(json.message || "تعذّر تحميل الملف");
      error.response = { status: response.status, data: json };
      throw error;
    }

    return new Blob([bytes], { type: "application/pdf" });
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
