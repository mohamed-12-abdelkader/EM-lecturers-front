import baseUrl from "./baseUrl";

const FINANCE_API = "/api/finance";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function financeHeaders(contentType) {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
    "X-Tenant-Subdomain": "default",
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function assertSuccess(data, fallback) {
  if (data?.success === false) {
    const err = new Error(data?.message || fallback);
    err.response = { data };
    throw err;
  }
  return data?.data ?? data;
}

function formatValidationErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return "";
  return errors
    .map((item) => {
      const path = Array.isArray(item.path) ? item.path.join(".") : "";
      const msg = item.message || item.msg || "";
      return path ? `${path}: ${msg}` : msg;
    })
    .filter(Boolean)
    .join(" — ");
}

export function financeErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  const data = err?.response?.data;
  const base = data?.message || data?.error || err?.message || fallback;
  const validation = formatValidationErrors(data?.errors);
  const extra =
    typeof data?.details === "string"
      ? data.details
      : data?.details?.message || data?.reason;

  const parts = [base];
  if (validation && validation !== base) parts.push(validation);
  if (extra && !parts.includes(extra)) parts.push(extra);
  return parts.filter(Boolean).join("\n");
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

export async function fetchFinanceDashboard(period = "month") {
  const { data } = await baseUrl.get(`${FINANCE_API}/dashboard${buildQuery({ period })}`, {
    headers: financeHeaders(),
  });
  return assertSuccess(data, "فشل تحميل لوحة المالية");
}

export async function fetchFinanceIncomeDetails(params = {}) {
  const { data } = await baseUrl.get(`${FINANCE_API}/income/details${buildQuery(params)}`, {
    headers: financeHeaders(),
  });
  const payload = assertSuccess(data, "فشل تحميل تفاصيل الدخل");
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, summary: {} };
  }
  const summary = payload?.summary ?? {};
  return {
    items: payload?.items ?? payload?.income ?? payload?.details ?? [],
    total: Number(payload?.total) || 0,
    limit: payload?.limit,
    offset: payload?.offset,
    summary: {
      gross_collected: summary.gross_collected ?? payload?.gross_collected,
      active_revenue: summary.active_revenue ?? payload?.active_revenue,
      reversed_amount: summary.reversed_amount ?? payload?.reversed_amount,
    },
  };
}

export async function fetchFinancePlans() {
  const { data } = await baseUrl.get(`${FINANCE_API}/plans`, {
    headers: financeHeaders(),
  });
  const payload = assertSuccess(data, "فشل تحميل الباقات");
  return Array.isArray(payload) ? payload : payload?.plans ?? [];
}

export async function updateFinancePlan(planId, payload) {
  const { data } = await baseUrl.put(`${FINANCE_API}/plans/${planId}`, payload, {
    headers: financeHeaders("application/json"),
  });
  return assertSuccess(data, "فشل تحديث الباقة");
}

export async function fetchFinanceSubscriptions(params = {}) {
  const { data } = await baseUrl.get(`${FINANCE_API}/subscriptions${buildQuery(params)}`, {
    headers: financeHeaders(),
  });
  const payload = assertSuccess(data, "فشل تحميل الاشتراكات");
  if (Array.isArray(payload)) return { subscriptions: payload, total: payload.length };
  return {
    subscriptions: payload?.subscriptions ?? [],
    total: Number(payload?.total) || 0,
    limit: payload?.limit,
    offset: payload?.offset,
  };
}

export async function fetchExpiringSoonSubscriptions(params = {}) {
  const { data } = await baseUrl.get(
    `${FINANCE_API}/subscriptions/expiring-soon${buildQuery(params)}`,
    { headers: financeHeaders() },
  );
  const payload = assertSuccess(data, "فشل تحميل الاشتراكات المنتهية قريباً");
  if (Array.isArray(payload)) {
    return { subscriptions: payload, total: payload.length };
  }
  return {
    subscriptions: payload?.subscriptions ?? [],
    total: Number(payload?.total) || 0,
    limit: payload?.limit,
    offset: payload?.offset,
    days: payload?.days,
    as_of: payload?.as_of,
  };
}

export async function createFinanceSubscription(payload) {
  const { data } = await baseUrl.post(`${FINANCE_API}/subscriptions`, payload, {
    headers: financeHeaders("application/json"),
  });
  return assertSuccess(data, "فشل إنشاء الاشتراك");
}

export async function updateFinanceSubscriptionStatus(id, payload) {
  const { data } = await baseUrl.patch(`${FINANCE_API}/subscriptions/${id}/status`, payload, {
    headers: financeHeaders("application/json"),
  });
  return assertSuccess(data, "فشل تحديث حالة الاشتراك");
}

export async function cancelFinanceSubscription(id, payload = {}) {
  const { data } = await baseUrl.post(`${FINANCE_API}/subscriptions/${id}/cancel`, payload, {
    headers: financeHeaders("application/json"),
  });
  return assertSuccess(data, "فشل إلغاء الاشتراك");
}

export async function deleteFinanceSubscription(id, { force = false } = {}) {
  const { data } = await baseUrl.delete(
    `${FINANCE_API}/subscriptions/${id}${buildQuery({ force: force ? true : undefined })}`,
    { headers: financeHeaders() },
  );
  return assertSuccess(data, "فشل حذف الاشتراك");
}

export async function fetchFinanceSubscriptionById(id) {
  const { data } = await baseUrl.get(`${FINANCE_API}/subscriptions/${id}`, {
    headers: financeHeaders(),
  });
  return assertSuccess(data, "فشل تحميل الاشتراك");
}

export async function fetchUpgradeQuote(subscriptionId, planId, actualPrice) {
  const { data } = await baseUrl.get(
    `${FINANCE_API}/subscriptions/${subscriptionId}/upgrade-quote${buildQuery({
      plan_id: planId,
      actual_price: actualPrice != null && actualPrice !== "" ? actualPrice : undefined,
    })}`,
    { headers: financeHeaders() },
  );
  return assertSuccess(data, "فشل معاينة الترقية");
}

export async function upgradeFinanceSubscription(subscriptionId, payload) {
  const { data } = await baseUrl.post(
    `${FINANCE_API}/subscriptions/${subscriptionId}/upgrade`,
    payload,
    { headers: financeHeaders("application/json") },
  );
  return assertSuccess(data, "فشل ترقية الباقة");
}

export async function renewFinanceSubscription(id, payload) {
  const { data } = await baseUrl.post(`${FINANCE_API}/subscriptions/${id}/renew`, payload, {
    headers: financeHeaders("application/json"),
  });
  return assertSuccess(data, "فشل تجديد الاشتراك");
}

export async function recordSubscriptionPayment(id, payload) {
  const { data } = await baseUrl.post(`${FINANCE_API}/subscriptions/${id}/payments`, payload, {
    headers: financeHeaders("application/json"),
  });
  return assertSuccess(data, "فشل تسجيل الدفعة");
}

export async function fetchOutstandingBalances(params = {}) {
  const { data } = await baseUrl.get(
    `${FINANCE_API}/subscriptions/outstanding-balances${buildQuery(params)}`,
    { headers: financeHeaders() },
  );
  const payload = assertSuccess(data, "فشل تحميل المستحقات");
  if (Array.isArray(payload)) {
    return { balances: payload, total_outstanding: 0, count: payload.length };
  }
  return {
    balances: payload?.balances ?? [],
    total_outstanding: Number(payload?.total_outstanding) || 0,
    count: Number(payload?.count) || 0,
    limit: payload?.limit,
    offset: payload?.offset,
  };
}

export async function fetchFinanceReportsRevenue(params = {}) {
  const { data } = await baseUrl.get(`${FINANCE_API}/reports/revenue${buildQuery(params)}`, {
    headers: financeHeaders(),
  });
  return assertSuccess(data, "فشل تحميل تقرير الإيرادات");
}

export async function fetchFinanceReportsExpenses(params = {}) {
  const { data } = await baseUrl.get(`${FINANCE_API}/reports/expenses${buildQuery(params)}`, {
    headers: financeHeaders(),
  });
  return assertSuccess(data, "فشل تحميل تقرير المصروفات");
}

export async function fetchFinanceReportsProfit(period) {
  const { data } = await baseUrl.get(
    `${FINANCE_API}/reports/profit${buildQuery({ period: period || undefined })}`,
    { headers: financeHeaders() },
  );
  return assertSuccess(data, "فشل تحميل تقرير الأرباح");
}

export async function fetchFinanceReportsSubscriptions(params = {}) {
  const { data } = await baseUrl.get(`${FINANCE_API}/reports/subscriptions${buildQuery(params)}`, {
    headers: financeHeaders(),
  });
  return assertSuccess(data, "فشل تحميل تقرير الاشتراكات");
}

export async function resolveCustomPrice(teacherId, planId) {
  const { data } = await baseUrl.get(
    `${FINANCE_API}/custom-prices/resolve${buildQuery({ teacher_id: teacherId, plan_id: planId })}`,
    { headers: financeHeaders() },
  );
  return assertSuccess(data, "فشل حساب السعر");
}

export async function fetchTeacherCustomPrices(teacherId, includeInactive = false) {
  const { data } = await baseUrl.get(
    `${FINANCE_API}/custom-prices/teacher/${teacherId}${buildQuery({ include_inactive: includeInactive ? "true" : "" })}`,
    { headers: financeHeaders() },
  );
  const payload = assertSuccess(data, "فشل تحميل الأسعار المخصصة");
  return Array.isArray(payload) ? payload : payload?.prices ?? [];
}

export async function createCustomPrice(payload) {
  const { data } = await baseUrl.post(`${FINANCE_API}/custom-prices`, payload, {
    headers: financeHeaders("application/json"),
  });
  return assertSuccess(data, "فشل تعيين السعر المخصص");
}

export async function deleteCustomPrice(id) {
  const { data } = await baseUrl.delete(`${FINANCE_API}/custom-prices/${id}`, {
    headers: financeHeaders(),
  });
  return assertSuccess(data, "فشل حذف السعر المخصص");
}

export async function fetchFinanceExpenses(params = {}) {
  const { data } = await baseUrl.get(`${FINANCE_API}/expenses/list${buildQuery(params)}`, {
    headers: financeHeaders(),
  });
  const payload = assertSuccess(data, "فشل تحميل المصروفات");
  if (Array.isArray(payload)) return { expenses: payload, total: payload.length };
  return {
    expenses: payload?.expenses ?? [],
    total: Number(payload?.total) || 0,
  };
}

export async function createFinanceExpense(payload) {
  const { data } = await baseUrl.post(`${FINANCE_API}/expenses`, payload, {
    headers: financeHeaders("application/json"),
  });
  return assertSuccess(data, "فشل إضافة المصروف");
}

export async function updateFinanceExpense(id, payload) {
  const { data } = await baseUrl.put(`${FINANCE_API}/expenses/${id}`, payload, {
    headers: financeHeaders("application/json"),
  });
  return assertSuccess(data, "فشل تحديث المصروف");
}

export async function deleteFinanceExpense(id) {
  const { data } = await baseUrl.delete(`${FINANCE_API}/expenses/${id}`, {
    headers: financeHeaders(),
  });
  return assertSuccess(data, "فشل حذف المصروف");
}

export async function fetchFinanceAuditLogs(params = {}) {
  const { data } = await baseUrl.get(`${FINANCE_API}/audit-logs${buildQuery(params)}`, {
    headers: financeHeaders(),
  });
  const payload = assertSuccess(data, "فشل تحميل سجل التدقيق");
  if (Array.isArray(payload)) return { logs: payload, total: payload.length };
  return {
    logs: payload?.logs ?? [],
    total: Number(payload?.total) || 0,
  };
}

export async function fetchFinanceInvoices(params = {}) {
  const { data } = await baseUrl.get(`${FINANCE_API}/invoices${buildQuery(params)}`, {
    headers: financeHeaders(),
  });
  const payload = assertSuccess(data, "فشل تحميل الفواتير");
  if (Array.isArray(payload)) return { invoices: payload, total: payload.length };
  return {
    invoices: payload?.invoices ?? [],
    total: Number(payload?.total) || 0,
    limit: payload?.limit,
    offset: payload?.offset,
  };
}

export async function fetchFinanceInvoiceById(id) {
  const { data } = await baseUrl.get(`${FINANCE_API}/invoices/${id}`, {
    headers: financeHeaders(),
  });
  return assertSuccess(data, "فشل تحميل تفاصيل الفاتورة");
}

export async function fetchFinanceTeachers() {
  const { data } = await baseUrl.get("/api/users/teachers", {
    headers: financeHeaders(),
  });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.teachers)) return data.teachers;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function fetchTeacherSubscriptionExpiryAlert(params = {}) {
  const { days = 3, grace_days = 3 } = params;
  const { data } = await baseUrl.get(
    `/api/teacher/subscription/expiry-alert${buildQuery({ days, grace_days })}`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  return assertSuccess(data, "فشل تحميل تنبيه الاشتراك");
}

export async function fetchTeacherInvoices(params = {}) {
  const { data } = await baseUrl.get(
    `/api/teacher/subscription/invoices${buildQuery(params)}`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  const payload = assertSuccess(data, "فشل تحميل الفواتير");
  if (Array.isArray(payload)) return { invoices: payload, total: payload.length };
  return {
    invoices: payload?.invoices ?? [],
    total: Number(payload?.total) || 0,
    limit: payload?.limit,
    offset: payload?.offset,
  };
}

export async function fetchTeacherInvoiceById(id) {
  const { data } = await baseUrl.get(`/api/teacher/subscription/invoices/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return assertSuccess(data, "فشل تحميل تفاصيل الفاتورة");
}
