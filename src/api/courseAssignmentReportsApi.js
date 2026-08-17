import baseUrl from "./baseUrl";
import { readAuthToken } from "../utils/authStorage";

function authConfig() {
  const token = readAuthToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

/**
 * GET /api/course/:courseId/assignment-reports
 * @param {object} [filters]
 * @param {string} [filters.type] - exam | assignment
 * @param {string} [filters.scope] - lecture | course
 */
export async function fetchCourseAssignmentReports(courseId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.scope) params.set("scope", filters.scope);
  const qs = params.toString();
  const { data } = await baseUrl.get(
    `/api/course/${courseId}/assignment-reports${qs ? `?${qs}` : ""}`,
    authConfig(),
  );
  return {
    courseId: data?.courseId ?? courseId,
    reports: Array.isArray(data?.reports) ? data.reports : [],
  };
}

/** GET /api/course/lecture-exam/:examId/report */
export async function fetchLectureExamReport(examId) {
  const { data } = await baseUrl.get(
    `/api/course/lecture-exam/${examId}/report`,
    authConfig(),
  );
  return data;
}

/** GET /api/course/course-exam/:examId/report */
export async function fetchCourseLevelExamReport(examId) {
  const { data } = await baseUrl.get(
    `/api/course/course-exam/${examId}/report`,
    authConfig(),
  );
  return data;
}
