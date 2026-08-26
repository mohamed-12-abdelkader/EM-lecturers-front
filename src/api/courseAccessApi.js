import baseUrl from "./baseUrl";

/** وصول كل محاضرة عند إنشائها/تعديلها — ليس إعداداً على مستوى الكورس */
export const PER_LECTURE_ACCESS_MODES = {
  open: "open",
  activation_code: "activation_code",
  groups: "groups",
};

/** @deprecated استخدم PER_LECTURE_ACCESS_MODES — أسماء قديمة للتوافق */
export const LECTURE_ACCESS_MODES = {
  always_open: "open",
  open: "open",
  time_limited: "open",
  activation_code: "activation_code",
  groups: "groups",
  per_lecture: "open",
};

export const ASSIGNMENT_MODES = {
  lecture_based: "lecture_based",
  course_based: "course_based",
};

export function courseAccessApiError(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

/**
 * يوحّد access_mode من رد الـ API (يشمل الحقول القديمة).
 * @param {object|string|null|undefined} lectureOrMode
 */
export function resolveLectureAccessMode(lectureOrMode) {
  const raw =
    typeof lectureOrMode === "string"
      ? lectureOrMode
      : lectureOrMode?.access_mode ||
        lectureOrMode?.lecture_access_mode ||
        lectureOrMode?.access_type;

  if (!raw || raw === "all" || raw === "always_open" || raw === "time_limited" || raw === "per_lecture") {
    return PER_LECTURE_ACCESS_MODES.open;
  }
  if (raw === "groups") return PER_LECTURE_ACCESS_MODES.groups;
  if (raw === "activation_code") return PER_LECTURE_ACCESS_MODES.activation_code;
  if (raw === "open") return PER_LECTURE_ACCESS_MODES.open;
  return PER_LECTURE_ACCESS_MODES.open;
}

export async function fetchCourseAccessSettings(courseId) {
  const { data } = await baseUrl.get(`/api/course/${courseId}/access-settings`);
  return {
    // الكورس لم يعد يملك وضع وصول موحّد — القيمة للتوافق فقط
    lecture_access_mode: data.lecture_access_mode || "per_lecture",
    assignment_mode: data.assignment_mode || ASSIGNMENT_MODES.lecture_based,
    note: data.note || null,
  };
}

/** لا ترسل lecture_access_mode — الـ API يرفضه بـ 400 */
export async function updateCourseAccessSettings(courseId, payload) {
  const body = {};
  if (payload?.assignment_mode) {
    body.assignment_mode = payload.assignment_mode;
  }
  const { data } = await baseUrl.patch(`/api/course/${courseId}/access-settings`, body);
  return {
    lecture_access_mode: data.lecture_access_mode || "per_lecture",
    assignment_mode: data.assignment_mode || ASSIGNMENT_MODES.lecture_based,
    note: data.note || null,
  };
}

export async function activateLectureByCode(code) {
  const { data } = await baseUrl.post("/api/course/lecture/activate-by-code", { code });
  return data;
}

export async function fetchLectureActivationCodes(lectureId) {
  const { data } = await baseUrl.get(`/api/course/lecture/${lectureId}/activation-codes`);
  return Array.isArray(data?.codes) ? data.codes : [];
}

export async function createLectureActivationCode(lectureId, payload) {
  const { data } = await baseUrl.post(
    `/api/course/lecture/${lectureId}/activation-codes`,
    payload,
  );
  return data?.code ?? data;
}

export async function deactivateLectureActivationCode(lectureId, codeId) {
  const { data } = await baseUrl.patch(
    `/api/course/lecture/${lectureId}/activation-codes/${codeId}/deactivate`,
  );
  return data?.code ?? data;
}

export async function patchCourseLecture(lectureId, payload) {
  const { data } = await baseUrl.patch(`/api/course/lecture/${lectureId}`, payload);
  return data?.lecture ?? data;
}

export async function fetchCourseAssignments(courseId) {
  const { data } = await baseUrl.get(`/api/course/${courseId}/assignments`);
  const list = data?.assignments ?? data?.exams ?? [];
  return {
    assignment_mode: data?.assignment_mode,
    assignments: Array.isArray(list) ? list : [],
  };
}

export function buildCourseExamPayload(data, { type = "assignment" } = {}) {
  const payload = {
    title: data.title,
    type: data.type || type,
    total_grade: Number(data.total_grade) || 20,
    duration: data.duration != null && data.duration !== "" ? Number(data.duration) : null,
    is_visible: data.is_visible ?? true,
    lock_next_lectures: false,
    show_answers_immediately: data.show_answers_immediately ?? true,
    show_answers_after_hours: Number(data.show_answers_after_hours) || 0,
  };

  if (data.show_at) payload.show_at = new Date(data.show_at).toISOString();
  if (data.hide_at) payload.hide_at = new Date(data.hide_at).toISOString();

  return payload;
}

/** POST /api/course/:courseId/exam — نفس body واجب المحاضرة */
export async function createCourseExam(courseId, data) {
  const { data: res } = await baseUrl.post(
    `/api/course/${courseId}/exam`,
    buildCourseExamPayload(data),
  );
  return res?.exam ?? res?.assignment ?? res;
}

/** Alias — POST /api/course/:courseId/assignments */
export async function createCourseAssignment(courseId, data) {
  const { data: res } = await baseUrl.post(
    `/api/course/${courseId}/assignments`,
    buildCourseExamPayload(data),
  );
  return res?.exam ?? res?.assignment ?? res;
}
