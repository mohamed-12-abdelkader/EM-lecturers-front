import baseUrl from "./baseUrl";

const API = "/api/teacher/questions";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiError(err, fallback) {
  return err?.response?.data?.message || fallback;
}

export async function fetchTeacherLibraryGrades() {
  const { data } = await baseUrl.get(`${API}/grades`, { headers: authHeaders() });
  return data?.grades || [];
}

export async function fetchTeacherLibraryLessons(gradeId) {
  const params = gradeId != null && gradeId !== "" ? { grade_id: gradeId } : undefined;
  const { data } = await baseUrl.get(`${API}/lessons`, {
    headers: authHeaders(),
    params,
  });
  return data?.lessons || [];
}

export async function fetchTeacherLibraryTree() {
  const { data } = await baseUrl.get(`${API}/tree`, { headers: authHeaders() });
  return data?.grades || [];
}

export async function createTeacherLibraryGrade(payload) {
  const { data } = await baseUrl.post(`${API}/grade`, payload, { headers: authHeaders() });
  return data?.grade || data;
}

export async function updateTeacherLibraryGrade(gradeId, payload) {
  const { data } = await baseUrl.put(`${API}/grade/${gradeId}`, payload, {
    headers: authHeaders(),
  });
  return data?.grade || data;
}

export async function deleteTeacherLibraryGrade(gradeId) {
  await baseUrl.delete(`${API}/grade/${gradeId}`, { headers: authHeaders() });
}

export async function createTeacherLibraryLesson(payload) {
  const { data } = await baseUrl.post(`${API}/lesson`, payload, { headers: authHeaders() });
  return data?.lesson || data;
}

export async function updateTeacherLibraryLesson(lessonId, payload) {
  const { data } = await baseUrl.put(`${API}/lesson/${lessonId}`, payload, {
    headers: authHeaders(),
  });
  return data?.lesson || data;
}

export async function deleteTeacherLibraryLesson(lessonId) {
  await baseUrl.delete(`${API}/lesson/${lessonId}`, { headers: authHeaders() });
}

export { API as TEACHER_LIBRARY_API, apiError as teacherLibraryApiError };
