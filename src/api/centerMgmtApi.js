import baseUrl from "./baseUrl";

const API = "/api/teacher/center";

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
      summary: data.summary ?? null,
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
      summary: null,
    };
  }
  const items =
    payload?.items ??
    payload?.subscriptions ??
    payload?.students ??
    payload?.payments ??
    payload?.groups ??
    [];
  return {
    items: Array.isArray(items) ? items : [],
    total: Number(payload?.total) || (Array.isArray(items) ? items.length : 0),
    page: Number(payload?.page) || 1,
    limit: Number(payload?.limit) || 20,
    totalPages: Number(payload?.totalPages) || 1,
    summary: payload?.summary ?? null,
    raw: payload,
  };
}

export function apiErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  const data = err?.response?.data;
  const base = data?.message || data?.error || err?.message || fallback;
  const errors = data?.errors;
  if (errors && typeof errors === "object") {
    const parts = Object.entries(errors)
      .map(([k, v]) => {
        const msg = Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : "";
        return msg ? `${k}: ${msg}` : "";
      })
      .filter(Boolean);
    if (parts.length) return `${base}\n${parts.join("\n")}`;
  }
  return base;
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
  const { data } = await baseUrl.patch(`${API}/groups/${groupId}`, payload, {
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

export async function fetchGroupStudents(groupId, params = {}) {
  const { data } = await baseUrl.get(
    `${API}/groups/${groupId}/students${buildQuery(params)}`,
    { headers: authHeaders() }
  );
  if (data?.success === false) {
    const err = new Error(data?.message || "فشل تحميل طلاب المجموعة");
    err.response = { data };
    throw err;
  }
  if (Array.isArray(data?.items)) return data.items;
  const payload = data?.data ?? data;
  if (Array.isArray(payload)) return payload;
  return payload?.items ?? payload?.students ?? [];
}

export async function addStudentToGroup(groupId, payload) {
  const { data } = await baseUrl.post(`${API}/groups/${groupId}/students`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إضافة الطالب");
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

export async function updateStudent(studentId, payload) {
  const { data } = await baseUrl.patch(`${API}/students/${studentId}`, payload, {
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

export async function enrollStudent(studentId, groupId) {
  const { data } = await baseUrl.post(
    `${API}/students/${studentId}/groups/${groupId}`,
    {},
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل تسجيل الطالب في المجموعة");
}

export async function unenrollStudent(studentId, groupId) {
  const { data } = await baseUrl.delete(`${API}/students/${studentId}/groups/${groupId}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل إزالة الطالب من المجموعة");
}

// ---------- Billing ----------
export async function openBillingMonth(payload) {
  const { data } = await baseUrl.post(`${API}/billing/months`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل فتح الشهر المالي");
}

export async function fetchBillingMonths(params = {}) {
  const { data } = await baseUrl.get(`${API}/billing/months${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل الأشهر");
  return Array.isArray(payload) ? payload : payload?.items ?? payload?.months ?? [];
}

export async function fetchBillingMonth(year, month, params = {}) {
  const { data } = await baseUrl.get(
    `${API}/billing/months/${year}/${month}${buildQuery(params)}`,
    { headers: authHeaders() }
  );
  const payload = unwrap(data, "فشل تحميل الشهر المالي");
  if (Array.isArray(payload)) {
    return { subscriptions: payload, summary: null, billing_month: { year, month } };
  }
  return {
    billing_month: payload?.billing_month ?? { year, month },
    summary: payload?.summary ?? null,
    subscriptions: payload?.subscriptions ?? payload?.items ?? [],
    total: payload?.total,
    page: payload?.page,
    limit: payload?.limit,
    totalPages: payload?.totalPages,
    raw: payload,
  };
}

export async function updateSubscription(subscriptionId, payload) {
  const { data } = await baseUrl.patch(
    `${API}/billing/subscriptions/${subscriptionId}`,
    payload,
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل تحديث الاشتراك");
}

export async function bulkUpdateSubscriptions(payload) {
  const { data } = await baseUrl.post(`${API}/billing/subscriptions/bulk`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل التحديث الجماعي للاشتراكات");
}

export async function fetchPayments(params = {}) {
  const { data } = await baseUrl.get(`${API}/billing/payments${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  return unwrapList(data, "فشل تحميل المدفوعات");
}

export async function createPayment(payload) {
  const { data } = await baseUrl.post(`${API}/billing/payments`, payload, {
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

export async function recordManualAttendance(payload) {
  const { data } = await baseUrl.post(`${API}/attendance/manual`, payload, {
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

export async function fetchAttendance(params = {}) {
  const { data } = await baseUrl.get(`${API}/attendance${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل الحضور");
}

export async function fetchStudentAttendance(studentId, params = {}) {
  const { data } = await baseUrl.get(
    `${API}/attendance/students/${studentId}${buildQuery(params)}`,
    { headers: authHeaders() }
  );
  return unwrap(data, "فشل تحميل سجل حضور الطالب");
}

export async function fetchStudentAttendanceReport(studentId, params = {}) {
  const { data } = await baseUrl.get(
    `${API}/reports/attendance/student/${studentId}${buildQuery(params)}`,
    { headers: authHeaders() }
  );
  return unwrap(data, "فشل تحميل تقرير الحضور");
}

export async function fetchGroupAttendanceReport(groupId, params = {}) {
  const { data } = await baseUrl.get(
    `${API}/reports/attendance/group/${groupId}${buildQuery(params)}`,
    { headers: authHeaders() }
  );
  return unwrap(data, "فشل تحميل تقرير حضور المجموعة");
}
