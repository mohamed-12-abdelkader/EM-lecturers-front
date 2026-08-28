import baseUrl from "./baseUrl";
import { parseCourseExamsResponse } from "../utils/courseLevelExamUtils";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** GET /api/exams/course/:courseId — للمدرس والأدمن */
export async function fetchCourseExams(courseId, token) {
  const { data } = await baseUrl.get(`/api/exams/course/${courseId}`, {
    headers: {
      ...authHeaders(token),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    params: { _t: Date.now() },
  });
  return parseCourseExamsResponse(data);
}

/** GET /api/exams/course/:courseId/student — للطالب */
export async function fetchStudentCourseExams(courseId, token) {
  const { data } = await baseUrl.get(`/api/exams/course/${courseId}/student`, {
    headers: {
      ...authHeaders(token),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    params: { _t: Date.now() },
  });
  return parseCourseExamsResponse(data);
}