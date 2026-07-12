import baseUrl from "./baseUrl";

const API = "/api/center-mgmt";

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

function unwrapList(data, fallback) {
  if (data?.success === false) {
    const err = new Error(data?.message || fallback);
    err.response = { data };
    throw err;
  }
  if (Array.isArray(data?.items)) {
    return {
      items: data.items,
      total: Number(data.total) || 0,
      page: Number(data.page) || 1,
      limit: Number(data.limit) || 20,
      totalPages: Number(data.totalPages) || 1,
    };
  }
  const payload = data?.data ?? data;
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      limit: payload.length || 20,
      totalPages: 1,
    };
  }
  return {
    items: payload?.items ?? [],
    total: Number(payload?.total) || 0,
    page: Number(payload?.page) || 1,
    limit: Number(payload?.limit) || 20,
    totalPages: Number(payload?.totalPages) || 1,
  };
}

export function apiErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  const data = err?.response?.data;
  return data?.message || data?.error || err?.message || fallback;
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

// ---------- Shared lookups ----------
export async function fetchPlatformGrades() {
  const { data } = await baseUrl.get("/api/users/grades", { headers: authHeaders() });
  const list = data?.grades ?? data?.data?.grades ?? data?.data ?? data;
  return Array.isArray(list) ? list : [];
}

// ---------- Dashboard ----------
export async function fetchDashboard(params = {}) {
  const { data } = await baseUrl.get(`${API}/dashboard${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل لوحة التحكم");
}

export async function fetchFinanceReport(params = {}) {
  const { data } = await baseUrl.get(`${API}/reports/finance${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل التقرير المالي");
}

export async function fetchActivityLogs(params = {}) {
  const { data } = await baseUrl.get(`${API}/activity-logs${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  return unwrapList(data, "فشل تحميل سجل النشاط");
}

// ---------- Groups ----------
export async function fetchGroups(params = {}) {
  const { data } = await baseUrl.get(`${API}/groups${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  return unwrapList(data, "فشل تحميل المجموعات");
}

export async function fetchGroup(groupId) {
  const { data } = await baseUrl.get(`${API}/groups/${groupId}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل المجموعة");
}

export async function createGroup(payload) {
  const { data } = await baseUrl.post(`${API}/groups`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إنشاء المجموعة");
}

export async function updateGroup(groupId, payload) {
  const { data } = await baseUrl.put(`${API}/groups/${groupId}`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث المجموعة");
}

export async function deleteGroup(groupId) {
  const { data } = await baseUrl.delete(`${API}/groups/${groupId}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل حذف المجموعة");
}

export async function fetchGroupStudents(groupId) {
  const { data } = await baseUrl.get(`${API}/groups/${groupId}/students`, {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل طلاب المجموعة");
  if (Array.isArray(payload)) return payload;
  return payload?.items ?? payload?.students ?? [];
}

// ---------- Students ----------
export async function fetchStudents(params = {}) {
  const { data } = await baseUrl.get(`${API}/students${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  return unwrapList(data, "فشل تحميل الطلاب");
}

export async function fetchStudent(studentId) {
  const { data } = await baseUrl.get(`${API}/students/${studentId}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل بيانات الطالب");
}

export async function createStudent(payload) {
  const { data } = await baseUrl.post(`${API}/students`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إضافة الطالب");
}

export async function updateStudent(studentId, payload) {
  const { data } = await baseUrl.put(`${API}/students/${studentId}`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث الطالب");
}

export async function deleteStudent(studentId) {
  const { data } = await baseUrl.delete(`${API}/students/${studentId}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل حذف الطالب");
}

export async function fetchStudentQr(studentId) {
  const { data } = await baseUrl.get(`${API}/students/${studentId}/qr`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل QR الطالب");
}

export async function enrollStudent(studentId, payload) {
  const { data } = await baseUrl.post(`${API}/students/${studentId}/enroll`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تسجيل الطالب في المجموعة");
}

export async function unenrollStudent(studentId, payload) {
  const { data } = await baseUrl.post(`${API}/students/${studentId}/unenroll`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إلغاء تسجيل الطالب");
}

export async function fetchStudentAttendanceReport(studentId, params = {}) {
  const { data } = await baseUrl.get(
    `${API}/students/${studentId}/attendance-report${buildQuery(params)}`,
    { headers: authHeaders() }
  );
  return unwrap(data, "فشل تحميل تقرير الحضور");
}

// ---------- Billing months & subscriptions ----------
export async function openBillingMonth(payload) {
  const { data } = await baseUrl.post(`${API}/months/open`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل فتح الشهر");
}

export async function fetchBillingMonths(params = {}) {
  const { data } = await baseUrl.get(`${API}/months${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل الأشهر");
  return Array.isArray(payload) ? payload : payload?.items ?? payload?.months ?? [];
}

export async function fetchMonthSubscriptions(year, month, params = {}) {
  const { data } = await baseUrl.get(
    `${API}/months/${year}/${month}/subscriptions${buildQuery(params)}`,
    { headers: authHeaders() }
  );
  return unwrapList(data, "فشل تحميل الاشتراكات");
}

export async function updateSubscription(subscriptionId, payload) {
  const { data } = await baseUrl.patch(`${API}/subscriptions/${subscriptionId}`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث الاشتراك");
}

// ---------- Payments ----------
export async function fetchPayments(params = {}) {
  const { data } = await baseUrl.get(`${API}/payments${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  return unwrapList(data, "فشل تحميل المدفوعات");
}

export async function createPayment(payload) {
  const { data } = await baseUrl.post(`${API}/payments`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تسجيل الدفعة");
}

// ---------- Attendance ----------
export async function scanAttendance(payload) {
  const { data } = await baseUrl.post(`${API}/attendance/scan`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تسجيل الحضور بالـ QR");
}

export async function recordAttendance(payload) {
  const { data } = await baseUrl.post(`${API}/attendance/record`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تسجيل الحضور");
}

export async function bulkRecordAttendance(payload) {
  const { data } = await baseUrl.post(`${API}/attendance/bulk`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل التسجيل الجماعي");
}

export async function fetchTodayAttendance(params = {}) {
  const { data } = await baseUrl.get(`${API}/attendance/today${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل حضور اليوم");
}
