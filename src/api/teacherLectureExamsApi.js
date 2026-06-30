import baseUrl from "./baseUrl";

const ENDPOINTS = [
  "/api/teacher/lecture-exams",
  "/api/exams/teacher/lecture-exams",
];

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function normalizeLectureExam(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    lectureId: raw.lectureId ?? raw.lecture_id,
    title: raw.title,
    totalGrade: raw.totalGrade ?? raw.total_grade,
    duration: raw.duration,
    isVisible: raw.isVisible ?? raw.is_visible,
    lectureTitle:
      raw.lectureTitle ??
      raw.lecture_title ??
      raw.lectureName ??
      raw.lecture_name,
    courseId: raw.courseId ?? raw.course_id,
    courseTitle:
      raw.courseTitle ??
      raw.course_title ??
      raw.courseName ??
      raw.course_name,
    questionsCount: raw.questionsCount ?? raw.questions_count ?? 0,
    submissionsCount: raw.submissionsCount ?? raw.submissions_count ?? 0,
    type: raw.type ?? "exam",
    createdAt: raw.createdAt ?? raw.created_at,
  };
}

export function apiErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

/**
 * @param {Object} params
 * @param {number|string} [params.course_id]
 * @param {number|string} [params.lecture_id]
 * @param {string} [params.type] — assignment للواجبات
 * @param {number|string} [params.teacher_id] — للأدمن
 */
export async function fetchTeacherLectureExams(params = {}, token) {
  const query = { type: "assignment", ...params };
  Object.keys(query).forEach((key) => {
    if (query[key] === "" || query[key] == null) delete query[key];
  });

  let lastError;
  for (const path of ENDPOINTS) {
    try {
      const { data } = await baseUrl.get(path, {
        params: query,
        headers: authHeaders(token),
      });
      const exams = (data?.exams ?? data?.data?.exams ?? []).map(normalizeLectureExam);
      return {
        success: data?.success ?? true,
        total: data?.total ?? exams.length,
        exams,
      };
    } catch (err) {
      lastError = err;
      if (err?.response?.status !== 404) break;
    }
  }
  throw lastError ?? new Error("تعذر تحميل الواجبات");
}

export async function fetchTeacherCourses(token) {
  const { data } = await baseUrl.get("api/course/my-courses", {
    headers: authHeaders(token),
  });
  const list = data?.courses ?? data?.data ?? data ?? [];
  return Array.isArray(list) ? list : [];
}

export async function fetchCourseLectures(courseId, token) {
  const { data } = await baseUrl.get(`api/course/${courseId}/details`, {
    headers: authHeaders(token),
  });
  const lectures = data?.lectures ?? data?.course?.lectures ?? [];
  return Array.isArray(lectures) ? lectures : [];
}
