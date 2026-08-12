import baseUrl from "./baseUrl";

export const LECTURE_ACCESS_MODES = {
  always_open: "always_open",
  time_limited: "time_limited",
  activation_code: "activation_code",
};

export const ASSIGNMENT_MODES = {
  lecture_based: "lecture_based",
  course_based: "course_based",
};

export function courseAccessApiError(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

export async function fetchCourseAccessSettings(courseId) {
  const { data } = await baseUrl.get(`/api/course/${courseId}/access-settings`);
  return {
    lecture_access_mode: data.lecture_access_mode || LECTURE_ACCESS_MODES.always_open,
    assignment_mode: data.assignment_mode || ASSIGNMENT_MODES.lecture_based,
  };
}

export async function updateCourseAccessSettings(courseId, payload) {
  const { data } = await baseUrl.patch(`/api/course/${courseId}/access-settings`, payload);
  return {
    lecture_access_mode: data.lecture_access_mode || LECTURE_ACCESS_MODES.always_open,
    assignment_mode: data.assignment_mode || ASSIGNMENT_MODES.lecture_based,
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
