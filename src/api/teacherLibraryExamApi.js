import baseUrl from "./baseUrl";

function authHeaders(token) {
  const t = token || (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : {};
}

export function teacherLibraryExamErrorMessage(err, fallback = "فشل إضافة الأسئلة للامتحان") {
  const data = err?.response?.data;
  if (data?.missingQuestionIds?.length) {
    return `${data.message || fallback} (معرّفات غير موجودة: ${data.missingQuestionIds.join(", ")})`;
  }
  if (data?.skippedTeacherQuestionIds?.length && data?.addedCount === 0) {
    return data.message || "جميع الأسئلة مضافة مسبقاً لهذا الامتحان";
  }
  return data?.message || err?.message || fallback;
}

/**
 * POST /api/exams/lecture/:examId/questions/from-teacher-library
 * POST /api/exams/course-level/:examId/questions/from-teacher-library
 *
 * @param {number|string} examId
 * @param {{ questionIds?: number[], lessonId?: number, passageId?: number, type?: string }} payload
 * @param {string} [token]
 */
export async function addTeacherLibraryToExam(examId, payload, token) {
  const isCourseExam = payload?.type === "course-exam";
  const path = isCourseExam
    ? `/api/exams/course-level/${examId}/questions/from-teacher-library`
    : `/api/exams/lecture/${examId}/questions/from-teacher-library`;

  const body = { ...payload };
  if (!isCourseExam) delete body.type;

  const { data } = await baseUrl.post(path, body, { headers: authHeaders(token) });
  return data;
}

export async function fetchLectureExamsForLibrary(token) {
  const { data } = await baseUrl.get("/api/exams/teacher/lecture-exams", {
    headers: authHeaders(token),
  });
  return data?.exams ?? [];
}

export async function fetchCourseLevelExamsForLibrary(token) {
  const { data } = await baseUrl.get("/api/exams/teacher", {
    headers: authHeaders(token),
  });
  return data?.exams ?? [];
}
