import baseUrl from "./baseUrl";

const TEACHER_API = "/api/teacher/free-lectures";
const PUBLIC_API = "/api/public/free-lectures";

export const FREE_LECTURE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const FREE_LECTURE_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function apiErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

export function normalizeFreeLecture(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    teacherId: raw.teacherId ?? raw.teacher_id,
    title: raw.title ?? "",
    link: raw.link ?? "",
    imageUrl: raw.imageUrl ?? raw.image_url ?? null,
    isPublished: raw.isPublished ?? raw.is_published ?? true,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    teacherName: raw.teacherName ?? raw.teacher_name,
    teacherAvatar: raw.teacherAvatar ?? raw.teacher_avatar,
  };
}

export function validateFreeLectureForm({ title, link, imageFile }) {
  const trimmedTitle = (title || "").trim();
  const trimmedLink = (link || "").trim();

  if (!trimmedTitle) return "اسم المحاضرة مطلوب";
  if (!trimmedLink) return "رابط المحاضرة مطلوب";
  if (!/^https?:\/\//i.test(trimmedLink)) {
    return "الرابط يجب أن يبدأ بـ http:// أو https://";
  }

  if (imageFile) {
    if (imageFile.size > FREE_LECTURE_MAX_IMAGE_BYTES) {
      return "الحد الأقصى لحجم الصورة 5 ميجابايت";
    }
    if (!FREE_LECTURE_IMAGE_TYPES.includes(imageFile.type)) {
      return "نوع الصورة غير مدعوم (jpg, png, webp, gif)";
    }
  }

  return null;
}

export async function fetchTeacherFreeLectures(token) {
  const { data } = await baseUrl.get(TEACHER_API, {
    headers: authHeaders(token),
  });
  const list = data?.lectures ?? data?.data ?? [];
  return Array.isArray(list) ? list.map(normalizeFreeLecture).filter(Boolean) : [];
}

export async function fetchTeacherFreeLecture(id, token) {
  const { data } = await baseUrl.get(`${TEACHER_API}/${id}`, {
    headers: authHeaders(token),
  });
  return normalizeFreeLecture(data?.lecture ?? data?.data ?? data);
}

export async function fetchPublicFreeLectures(teacherId) {
  const params = teacherId ? { teacher_id: teacherId } : {};
  const { data } = await baseUrl.get(PUBLIC_API, { params });
  const list = data?.lectures ?? [];
  return Array.isArray(list) ? list.map(normalizeFreeLecture).filter(Boolean) : [];
}

function buildLectureFormData({ title, link, imageFile, imageUrl, isPublished, removeImage }) {
  const formData = new FormData();
  if (title != null) formData.append("title", String(title).trim());
  if (link != null) formData.append("link", String(link).trim());
  if (imageFile) formData.append("image", imageFile);
  if (imageUrl != null && !imageFile) formData.append("image_url", imageUrl);
  if (removeImage) formData.append("image_url", "");
  if (isPublished != null) formData.append("is_published", isPublished ? "true" : "false");
  return formData;
}

export async function createTeacherFreeLecture(payload, token) {
  const formData = buildLectureFormData(payload);
  const { data } = await baseUrl.post(TEACHER_API, formData, {
    headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
  });
  return normalizeFreeLecture(data?.lecture ?? data?.data);
}

export async function updateTeacherFreeLecture(id, payload, token) {
  const formData = buildLectureFormData(payload);
  const { data } = await baseUrl.put(`${TEACHER_API}/${id}`, formData, {
    headers: { ...authHeaders(token), "Content-Type": "multipart/form-data" },
  });
  return normalizeFreeLecture(data?.lecture ?? data?.data);
}

export async function deleteTeacherFreeLecture(id, token) {
  const { data } = await baseUrl.delete(`${TEACHER_API}/${id}`, {
    headers: authHeaders(token),
  });
  return data;
}
