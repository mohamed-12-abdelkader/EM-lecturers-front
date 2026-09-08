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

function reportQueryConfig({ passPercentage, groupId } = {}) {
  const config = authConfig();
  const params = {};
  const pass = Number(passPercentage);
  if (Number.isFinite(pass) && pass >= 0) {
    params.passPercentage = pass;
  }
  const gid = Number(groupId);
  if (Number.isFinite(gid) && gid > 0) {
    params.groupId = gid;
  }
  if (Object.keys(params).length) {
    config.params = params;
  }
  return config;
}

/** GET /api/exams/:examId/report?groupId= */
export async function fetchLectureExamReport(examId, filters = {}) {
  const { data } = await baseUrl.get(
    `/api/exams/${examId}/report`,
    reportQueryConfig(filters),
  );
  return data;
}

/** GET /api/course/course-exam/:examId/report?groupId= */
export async function fetchCourseLevelExamReport(examId, filters = {}) {
  const { data } = await baseUrl.get(
    `/api/course/course-exam/${examId}/report`,
    reportQueryConfig(filters),
  );
  return data;
}

/** GET /api/exams/:examId/grades?groupId= */
export async function fetchExamGrades(examId, filters = {}) {
  const { data } = await baseUrl.get(
    `/api/exams/${examId}/grades`,
    reportQueryConfig({ groupId: filters.groupId }),
  );
  const payload = data?.data && !Array.isArray(data?.submissions) ? data.data : data;
  const list =
    payload?.submissions ??
    payload?.grades ??
    payload?.students ??
    payload?.examinedStudents ??
    (Array.isArray(payload) ? payload : []);
  return Array.isArray(list) ? list : [];
}
