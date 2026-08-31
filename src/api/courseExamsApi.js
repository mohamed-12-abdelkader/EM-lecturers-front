import baseUrl from "./baseUrl";
import { parseCourseExamsResponse } from "../utils/courseLevelExamUtils";
import { isNetworkError } from "../utils/network";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function teacherCourseExamPaths(courseId) {
  return [
    `/api/exams/course/${courseId}`,
    `/api/course/${courseId}/course-exams`,
  ];
}

function studentCourseExamPaths(courseId) {
  return [`/api/exams/course/${courseId}/student`];
}

async function fetchFromEndpoints(paths, token) {
  let lastError;

  for (const path of paths) {
    try {
      const { data } = await baseUrl.get(path, {
        headers: authHeaders(token),
        params: { _t: Date.now() },
      });
      return parseCourseExamsResponse(data);
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      if (status !== 404 && !isNetworkError(err)) break;
    }
  }

  throw lastError ?? new Error("تعذر تحميل الامتحانات الشاملة");
}

/** GET /api/exams/:examId/attempt-report */
export async function fetchExamAttemptReport(examId, token, attemptId) {
  const params = { _t: Date.now() };
  if (attemptId) params.attemptId = attemptId;
  const { data } = await baseUrl.get(`/api/exams/${examId}/attempt-report`, {
    headers: authHeaders(token),
    params,
  });
  return data?.data && data.exam == null ? data.data : data;
}

async function attachAttemptReports(exams, token) {
  const list = Array.isArray(exams) ? exams : [];
  const withAttempts = list.filter(
    (exam) => Number(exam?.attempts_count) > 0 || exam?.last_attempt_number
  );
  if (!withAttempts.length) return list;

  const entries = await Promise.all(
    withAttempts.map(async (exam) => {
      try {
        const report = await fetchExamAttemptReport(exam.id, token);
        return [exam.id, report];
      } catch {
        return [exam.id, null];
      }
    })
  );
  const reports = Object.fromEntries(entries);

  return list.map((exam) => {
    const report = reports[exam.id];
    if (!report) return exam;
    return {
      ...exam,
      attempt_report: report,
      showAnswers: report.showAnswers,
      show_answers: report.showAnswers,
      releaseReason: report.releaseReason,
      release_reason: report.releaseReason,
      examEndAt: report.examEndAt ?? exam.examEndAt,
      answersVisibleAt: report.answersVisibleAt ?? exam.answersVisibleAt,
    };
  });
}

/** GET /api/exams/course/:courseId — للمدرس والأدمن */
export async function fetchCourseExams(courseId, token) {
  return fetchFromEndpoints(teacherCourseExamPaths(courseId), token);
}

/** GET /api/exams/course/:courseId/student — للطالب */
export async function fetchStudentCourseExams(courseId, token) {
  const exams = await fetchFromEndpoints(studentCourseExamPaths(courseId), token);
  return attachAttemptReports(exams, token);
}

export function courseExamsErrorMessage(
  err,
  fallback = "حدث خطأ في تحميل الامتحانات الشاملة",
) {
  if (isNetworkError(err)) {
    return "تعذر الاتصال بالخادم. تحقق من الإنترنت ثم حدّث الصفحة.";
  }
  return err?.response?.data?.message || err?.message || fallback;
}
