import baseUrl from "./baseUrl";

const API_PATH = "/api/exams/teacher";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function apiErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

export function normalizeCourseExam(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    title: raw.title,
    courseId: raw.courseId ?? raw.course_id,
    courseTitle:
      raw.courseTitle ?? raw.course_title ?? raw.courseName ?? raw.course_name,
    durationMinutes: raw.durationMinutes ?? raw.duration_minutes ?? raw.duration,
    durationUnlimited: Boolean(
      raw.durationUnlimited ??
        raw.duration_unlimited ??
        ((raw.durationMinutes ?? raw.duration_minutes ?? raw.duration) == null ||
          Number(raw.durationMinutes ?? raw.duration_minutes ?? raw.duration) <= 0),
    ),
    questionsCount: raw.questionsCount ?? raw.questions_count ?? 0,
    configuredQuestionsCount:
      raw.configuredQuestionsCount ?? raw.configured_questions_count ?? 0,
    isVisibleToStudents:
      raw.isVisibleToStudents ?? raw.is_visible_to_students ?? raw.is_visible,
    isActive: raw.isActive ?? raw.is_active ?? true,
    submissionsCount: raw.submissionsCount ?? raw.submissions_count ?? 0,
    examKind: raw.examKind ?? raw.exam_kind ?? "course_level",
    createdAt: raw.createdAt ?? raw.created_at,
  };
}

/**
 * @param {Object} params
 * @param {number|string} [params.course_id]
 * @param {number|string} [params.teacher_id] — للأدمن
 */
export async function fetchTeacherCourseExams(params = {}, token) {
  const query = { ...params };
  Object.keys(query).forEach((key) => {
    if (query[key] === "" || query[key] == null) delete query[key];
  });

  const { data } = await baseUrl.get(API_PATH, {
    params: query,
    headers: authHeaders(token),
  });

  const exams = (data?.exams ?? data?.data?.exams ?? []).map(normalizeCourseExam);
  return {
    success: data?.success ?? true,
    total: data?.total ?? exams.length,
    exams,
    filters: data?.filters ?? null,
  };
}

export async function fetchTeacherCourses(token) {
  const { data } = await baseUrl.get("api/course/my-courses", {
    headers: authHeaders(token),
  });
  const list = data?.courses ?? data?.data ?? data ?? [];
  return Array.isArray(list) ? list : [];
}
