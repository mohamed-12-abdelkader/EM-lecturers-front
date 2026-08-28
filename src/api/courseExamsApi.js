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

/** GET /api/exams/course/:courseId — للمدرس والأدمن */
export async function fetchCourseExams(courseId, token) {
  return fetchFromEndpoints(teacherCourseExamPaths(courseId), token);
}

/** GET /api/exams/course/:courseId/student — للطالب */
export async function fetchStudentCourseExams(courseId, token) {
  return fetchFromEndpoints(studentCourseExamPaths(courseId), token);
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
