import baseUrl from "./baseUrl";
import { readAuthToken } from "../utils/authStorage";
import { normalizeGradeSubmission } from "../pages/exam/utils/examSubmissionUtils";

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

function reportQueryConfig({ passPercentage, groupId, groupType } = {}) {
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
  if (groupType === "study" || groupType === "course") {
    params.groupType = groupType;
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

/** GET /api/course/lecture-exam/:examId/submissions — نتائج الواجب / امتحان المحاضرة مع الأخطاء */
export async function fetchLectureExamSubmissions(examId, filters = {}) {
  const { data } = await baseUrl.get(
    `/api/course/lecture-exam/${examId}/submissions`,
    reportQueryConfig({ groupId: filters.groupId }),
  );
  const payload = data?.data && !Array.isArray(data?.submissions) ? data.data : data;
  const list = payload?.submissions ?? (Array.isArray(payload) ? payload : []);
  return Array.isArray(list) ? list.map(normalizeGradeSubmission) : [];
}

function firstNonEmptyList(...candidates) {
  for (const list of candidates) {
    if (Array.isArray(list) && list.length) return list;
  }
  for (const list of candidates) {
    if (Array.isArray(list)) return list;
  }
  return [];
}

/** GET /api/exams/:examId/grades?groupId=&groupType= */
export async function fetchExamGrades(examId, filters = {}) {
  const { data } = await baseUrl.get(
    `/api/exams/${examId}/grades`,
    reportQueryConfig({
      groupId: filters.groupId,
      groupType: filters.groupType,
    }),
  );
  const payload = data?.data && !Array.isArray(data?.students) && !Array.isArray(data?.submissions)
    ? data.data
    : data;
  const list = firstNonEmptyList(
    payload?.students,
    payload?.submissions,
    payload?.grades,
    payload?.examinedStudents,
    Array.isArray(payload) ? payload : null,
  );
  return {
    exam: payload?.exam || null,
    groupFilter: payload?.groupFilter ?? payload?.group_filter ?? null,
    statistics: payload?.statistics || null,
    students: list.map(normalizeGradeSubmission),
  };
}
