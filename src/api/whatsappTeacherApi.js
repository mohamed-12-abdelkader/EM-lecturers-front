import baseUrl from "./baseUrl";

const API = "/api/teacher/whatsapp";

function authHeaders(contentType) {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

export async function fetchTeacherWaStatus() {
  const { data } = await baseUrl.get(`${API}/status`, {
    headers: authHeaders(),
  });
  return data?.data || data;
}

export async function fetchTeacherWaServices() {
  const { data } = await baseUrl.get(`${API}/services`, {
    headers: authHeaders(),
  });
  return data?.data?.services || [];
}

export async function putTeacherWaServiceSessions(key, sessions) {
  const { data } = await baseUrl.put(
    `${API}/services/${encodeURIComponent(key)}/sessions`,
    { sessions },
    { headers: authHeaders("application/json") },
  );
  return data?.data?.services || [];
}

export async function fetchTeacherWaSessions() {
  const { data } = await baseUrl.get(`${API}/sessions`, {
    headers: authHeaders(),
  });
  return data?.data?.sessions || [];
}

export async function createTeacherWaSession(label) {
  const { data } = await baseUrl.post(
    `${API}/sessions`,
    { label: label || undefined },
    { headers: authHeaders("application/json") },
  );
  return data?.data || data;
}

export async function getTeacherWaSession(slug) {
  const { data } = await baseUrl.get(`${API}/sessions/${encodeURIComponent(slug)}`, {
    headers: authHeaders(),
  });
  return data?.data || data;
}

export async function reconnectTeacherWaSession(slug) {
  const { data } = await baseUrl.post(
    `${API}/sessions/${encodeURIComponent(slug)}/reconnect`,
    {},
    { headers: authHeaders("application/json") },
  );
  return data?.data || data;
}

export async function deleteTeacherWaSession(slug) {
  const { data } = await baseUrl.delete(`${API}/sessions/${encodeURIComponent(slug)}`, {
    headers: authHeaders(),
  });
  return data;
}

export async function notifyTeacherWaStudents(message, studentIds) {
  const { data } = await baseUrl.post(
    `${API}/notify-students`,
    { message, student_ids: studentIds },
    { headers: authHeaders("application/json") },
  );
  return data?.data || data;
}

export async function sendTeacherWaParentReports(studentIds) {
  const { data } = await baseUrl.post(
    `${API}/parent-reports`,
    { student_ids: studentIds },
    { headers: authHeaders("application/json") },
  );
  return data?.data || data;
}

export async function fetchTeacherCourseStudents() {
  const { data } = await baseUrl.get("/api/course/teacher/students", {
    headers: authHeaders(),
  });
  return data?.students || data?.data?.students || [];
}

export async function fetchTeacherParentExamSettings() {
  const { data } = await baseUrl.get(`${API}/parents-exam/settings`, { headers: authHeaders() });
  return data?.data || data;
}

export async function saveTeacherParentExamSettings(payload) {
  const { data } = await baseUrl.put(`${API}/parents-exam/settings`, payload, {
    headers: authHeaders("application/json"),
  });
  return data?.data || data;
}

export async function fetchTeacherParentExams() {
  const { data } = await baseUrl.get(`${API}/parents-exam/exams`, { headers: authHeaders() });
  return data?.data?.exams || [];
}

export async function fetchTeacherParentExamPreview(examId) {
  const { data } = await baseUrl.get(`${API}/parents-exam/exams/${examId}/preview`, {
    headers: authHeaders(),
  });
  return data?.data || data;
}

export async function setTeacherParentExamEnabled(examId, enabled) {
  const { data } = await baseUrl.put(
    `${API}/parents-exam/exams/${examId}`,
    { enabled },
    { headers: authHeaders("application/json") },
  );
  return data?.data || data;
}

export async function testTeacherParentExam(examId, studentId, cohort) {
  const { data } = await baseUrl.post(
    `${API}/parents-exam/exams/${examId}/test`,
    { studentId, cohort },
    { headers: authHeaders("application/json") },
  );
  return data?.data || data;
}
