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

function centerPath(centerId, suffix = "") {
  return `${API}/centers/${centerId}${suffix}`;
}

// ---------- Centers ----------
export async function fetchCenters() {
  const { data } = await baseUrl.get(`${API}/centers`, { headers: authHeaders() });
  const payload = unwrap(data, "فشل تحميل السناتر");
  return Array.isArray(payload) ? payload : payload?.centers ?? [];
}

export async function fetchCenter(centerId) {
  const { data } = await baseUrl.get(centerPath(centerId), { headers: authHeaders() });
  return unwrap(data, "فشل تحميل بيانات السنتر");
}

export async function createCenter(payload) {
  const { data } = await baseUrl.post(`${API}/centers`, payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إنشاء السنتر");
}

export async function updateCenter(centerId, payload) {
  const { data } = await baseUrl.put(centerPath(centerId), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث السنتر");
}

export async function deleteCenter(centerId) {
  const { data } = await baseUrl.delete(centerPath(centerId), { headers: authHeaders() });
  return unwrap(data, "فشل حذف السنتر");
}

// ---------- Dashboard ----------
export async function fetchCenterDashboard(centerId) {
  const { data } = await baseUrl.get(centerPath(centerId, "/dashboard"), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل لوحة السنتر");
}

export async function fetchFinanceDashboard(centerId, params = {}) {
  const { data } = await baseUrl.get(
    centerPath(centerId, `/finance/dashboard${buildQuery(params)}`),
    { headers: authHeaders() }
  );
  return unwrap(data, "فشل تحميل لوحة الماليات");
}

// ---------- Grades ----------
export async function fetchGrades(centerId) {
  const { data } = await baseUrl.get(centerPath(centerId, "/grades"), {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل الصفوف");
  return Array.isArray(payload) ? payload : [];
}

export async function createGrade(centerId, payload) {
  const { data } = await baseUrl.post(centerPath(centerId, "/grades"), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إضافة الصف");
}

export async function updateGrade(centerId, gradeId, payload) {
  const { data } = await baseUrl.put(centerPath(centerId, `/grades/${gradeId}`), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث الصف");
}

export async function deleteGrade(centerId, gradeId) {
  const { data } = await baseUrl.delete(centerPath(centerId, `/grades/${gradeId}`), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل حذف الصف");
}

// ---------- Groups ----------
export async function fetchGroups(centerId, params = {}) {
  const { data } = await baseUrl.get(centerPath(centerId, `/groups${buildQuery(params)}`), {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل المجموعات");
  return Array.isArray(payload) ? payload : [];
}

export async function fetchGroup(centerId, groupId) {
  const { data } = await baseUrl.get(centerPath(centerId, `/groups/${groupId}`), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل المجموعة");
}

export async function createGroup(centerId, payload) {
  const { data } = await baseUrl.post(centerPath(centerId, "/groups"), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إنشاء المجموعة");
}

export async function updateGroup(centerId, groupId, payload) {
  const { data } = await baseUrl.put(centerPath(centerId, `/groups/${groupId}`), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث المجموعة");
}

export async function deleteGroup(centerId, groupId) {
  const { data } = await baseUrl.delete(centerPath(centerId, `/groups/${groupId}`), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل حذف المجموعة");
}

export async function fetchGroupStudents(centerId, groupId) {
  const { data } = await baseUrl.get(centerPath(centerId, `/groups/${groupId}/students`), {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل طلاب المجموعة");
  return Array.isArray(payload) ? payload : [];
}

// ---------- Students ----------
export async function fetchStudents(centerId, params = {}) {
  const { data } = await baseUrl.get(centerPath(centerId, `/students${buildQuery(params)}`), {
    headers: authHeaders(),
  });
  return unwrapList(data, "فشل تحميل الطلاب");
}

export async function fetchStudent(centerId, studentId) {
  const { data } = await baseUrl.get(centerPath(centerId, `/students/${studentId}`), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل بيانات الطالب");
}

export async function createStudent(centerId, payload) {
  const { data } = await baseUrl.post(centerPath(centerId, "/students"), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إضافة الطالب");
}

export async function updateStudent(centerId, studentId, payload) {
  const { data } = await baseUrl.put(centerPath(centerId, `/students/${studentId}`), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث الطالب");
}

export async function deleteStudent(centerId, studentId) {
  const { data } = await baseUrl.delete(centerPath(centerId, `/students/${studentId}`), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل حذف الطالب");
}

export async function fetchStudentQr(centerId, studentId) {
  const { data } = await baseUrl.get(centerPath(centerId, `/students/${studentId}/qr`), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل QR الطالب");
}

export async function enrollStudent(centerId, studentId, payload) {
  const { data } = await baseUrl.post(
    centerPath(centerId, `/students/${studentId}/enroll`),
    payload,
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل تسجيل الطالب في المجموعة");
}

export async function unenrollStudent(centerId, studentId, payload) {
  const { data } = await baseUrl.post(
    centerPath(centerId, `/students/${studentId}/unenroll`),
    payload,
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل إلغاء تسجيل الطالب");
}

// ---------- Attendance ----------
export async function createAttendanceSession(centerId, payload) {
  const { data } = await baseUrl.post(centerPath(centerId, "/attendance/sessions"), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل فتح جلسة الحضور");
}

export async function fetchAttendanceSessions(centerId, params = {}) {
  const { data } = await baseUrl.get(
    centerPath(centerId, `/attendance/sessions${buildQuery(params)}`),
    { headers: authHeaders() }
  );
  return unwrapList(data, "فشل تحميل جلسات الحضور");
}

export async function fetchSessionAttendance(centerId, sessionId) {
  const { data } = await baseUrl.get(
    centerPath(centerId, `/attendance/sessions/${sessionId}`),
    { headers: authHeaders() }
  );
  const payload = unwrap(data, "فشل تحميل حضور الجلسة");
  return Array.isArray(payload) ? payload : [];
}

export async function scanAttendance(centerId, payload) {
  const { data } = await baseUrl.post(centerPath(centerId, "/attendance/scan"), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تسجيل الحضور بالـ QR");
}

export async function recordAttendance(centerId, payload) {
  const { data } = await baseUrl.post(centerPath(centerId, "/attendance/record"), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تسجيل الحضور");
}

export async function bulkRecordAttendance(centerId, payload) {
  const { data } = await baseUrl.post(centerPath(centerId, "/attendance/bulk"), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل التسجيل الجماعي");
}

export async function fetchStudentAttendanceStats(centerId, studentId, params = {}) {
  const { data } = await baseUrl.get(
    centerPath(centerId, `/attendance/students/${studentId}/stats${buildQuery(params)}`),
    { headers: authHeaders() }
  );
  return unwrap(data, "فشل تحميل إحصائيات الحضور");
}

export async function fetchTodayAttendance(centerId) {
  const { data } = await baseUrl.get(centerPath(centerId, "/attendance/today"), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل حضور اليوم");
}

// ---------- Subscriptions ----------
export async function fetchSubscriptions(centerId, params = {}) {
  const { data } = await baseUrl.get(
    centerPath(centerId, `/subscriptions${buildQuery(params)}`),
    { headers: authHeaders() }
  );
  return unwrapList(data, "فشل تحميل الاشتراكات");
}

export async function generateMonthlySubscriptions(centerId, payload) {
  const { data } = await baseUrl.post(
    centerPath(centerId, "/subscriptions/generate-monthly"),
    payload,
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل توليد الاشتراكات");
}

export async function updateSubscriptionStatus(centerId, subscriptionId, status) {
  const { data } = await baseUrl.patch(
    centerPath(centerId, `/subscriptions/${subscriptionId}/status`),
    { status },
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل تحديث حالة الاشتراك");
}

// ---------- Payments ----------
export async function fetchPayments(centerId, params = {}) {
  const { data } = await baseUrl.get(centerPath(centerId, `/payments${buildQuery(params)}`), {
    headers: authHeaders(),
  });
  return unwrapList(data, "فشل تحميل المدفوعات");
}

export async function createPayment(centerId, payload) {
  const { data } = await baseUrl.post(centerPath(centerId, "/payments"), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تسجيل الدفعة");
}

export async function fetchPaymentReceipt(centerId, paymentId) {
  const { data } = await baseUrl.get(centerPath(centerId, `/payments/${paymentId}/receipt`), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل تحميل الإيصال");
}

// ---------- Staff ----------
export async function fetchStaff(centerId) {
  const { data } = await baseUrl.get(centerPath(centerId, "/staff"), {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل الموظفين");
  return Array.isArray(payload) ? payload : [];
}

export async function inviteStaff(centerId, payload) {
  const { data } = await baseUrl.post(centerPath(centerId, "/staff"), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل إضافة الموظف");
}

export async function updateStaff(centerId, staffId, payload) {
  const { data } = await baseUrl.patch(centerPath(centerId, `/staff/${staffId}`), payload, {
    headers: authHeaders("application/json"),
  });
  return unwrap(data, "فشل تحديث الموظف");
}

export async function removeStaff(centerId, staffId) {
  const { data } = await baseUrl.delete(centerPath(centerId, `/staff/${staffId}`), {
    headers: authHeaders(),
  });
  return unwrap(data, "فشل حذف الموظف");
}

// ---------- Activity & Notifications ----------
export async function fetchActivityLogs(centerId, params = {}) {
  const { data } = await baseUrl.get(
    centerPath(centerId, `/activity-logs${buildQuery(params)}`),
    { headers: authHeaders() }
  );
  return unwrapList(data, "فشل تحميل سجل النشاط");
}

export async function fetchNotifications(centerId) {
  const { data } = await baseUrl.get(centerPath(centerId, "/notifications"), {
    headers: authHeaders(),
  });
  const payload = unwrap(data, "فشل تحميل الإشعارات");
  return Array.isArray(payload) ? payload : [];
}

export async function markNotificationRead(centerId, notificationId) {
  const { data } = await baseUrl.patch(
    centerPath(centerId, `/notifications/${notificationId}/read`),
    {},
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل تحديث الإشعار");
}

export async function markAllNotificationsRead(centerId) {
  const { data } = await baseUrl.post(
    centerPath(centerId, "/notifications/read-all"),
    {},
    { headers: authHeaders("application/json") }
  );
  return unwrap(data, "فشل تحديث الإشعارات");
}

// ---------- Reports ----------
export async function fetchReport(centerId, type, params = {}) {
  const format = params.format || "json";
  const { data } = await baseUrl.get(
    centerPath(centerId, `/reports/${type}${buildQuery({ ...params, format })}`),
    {
      headers: authHeaders(),
      responseType: format === "csv" ? "blob" : "json",
    }
  );
  if (format === "csv") return data;
  return unwrap(data, "فشل تحميل التقرير");
}
