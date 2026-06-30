import baseUrl from "./baseUrl";

const API = "/api/teacher/students";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function authHeaders(contentType) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function unwrap(data, fallback) {
  if (data?.success === false) {
    const err = new Error(data?.message || fallback);
    err.response = { data };
    throw err;
  }
  return data?.data ?? data;
}

export function apiErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchRegistrationSettings() {
  const { data } = await baseUrl.get(`${API}/registration-settings`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل إعدادات التسجيل");
}

export async function updateRegistrationSettings(payload) {
  const { data } = await baseUrl.put(`${API}/registration-settings`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث إعدادات التسجيل");
}

export async function fetchManagedStudents(params = {}) {
  const { data } = await baseUrl.get(`${API}${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل قائمة الطلاب");
  return {
    students: payload?.students ?? [],
    pagination: payload?.pagination ?? { page: 1, limit: 20, total: 0, total_pages: 1 },
  };
}

export async function fetchManagedStudent(studentId) {
  const { data } = await baseUrl.get(`${API}/${studentId}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل بيانات الطالب");
}

export async function createManagedStudent(payload) {
  const { data } = await baseUrl.post(API, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إضافة الطالب");
}

export async function updateManagedStudent(studentId, payload) {
  const { data } = await baseUrl.put(`${API}/${studentId}`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث بيانات الطالب");
}

export async function deleteManagedStudent(studentId) {
  const { data } = await baseUrl.delete(`${API}/${studentId}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل حذف الطالب");
}

export async function updateManagedStudentGroup(studentId, groupId) {
  const { data } = await baseUrl.patch(
    `${API}/${studentId}/group`,
    { group_id: groupId ?? null },
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل تحديث مجموعة الطالب");
}

export async function resetManagedStudentPassword(studentId, payload = {}) {
  const { data } = await baseUrl.post(`${API}/${studentId}/reset-password`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إعادة تعيين كلمة المرور");
}

export async function updateManagedStudentStatus(studentId, accountStatus) {
  const { data } = await baseUrl.patch(
    `${API}/${studentId}/status`,
    { account_status: accountStatus },
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل تحديث حالة الحساب");
}

export async function importManagedStudentsCsv(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await baseUrl.post(`${API}/import`, formData, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل استيراد الطلاب");
}

export async function fetchTeacherGrades() {
  const { data } = await baseUrl.get("/api/teacher/grades", {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل الصفوف");
  return payload?.grades ?? (Array.isArray(payload) ? payload : []);
}

export async function fetchTeacherStudyGroups() {
  const { data } = await baseUrl.get("/api/study-groups/teacher/my-groups", {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل المجموعات");
  return payload?.groups ?? (Array.isArray(payload) ? payload : []);
}
