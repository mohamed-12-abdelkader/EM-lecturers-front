import baseUrl from "./baseUrl";

const API = "/api/admin/grades";

function authHeaders(token, contentType) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export function adminGradesErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

export function unwrapAdminGradesError(err) {
  const data = err?.response?.data;
  return {
    message: data?.message || err?.message || "حدث خطأ غير متوقع",
    status: err?.response?.status,
    usage: data?.usage || data?.details || data?.data?.usage || null,
  };
}

function normalizeGrade(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: raw.id ?? raw.grade_id ?? raw.gradeId,
    name: raw.name || "",
    stage: raw.stage || "general",
    slug: raw.slug || "",
    level: raw.level ?? raw.order ?? null,
    status: raw.status || (raw.is_active === false ? "inactive" : "active"),
    teachers_count: raw.teachers_count ?? raw.teachersCount ?? null,
    students_count: raw.students_count ?? raw.studentsCount ?? null,
    courses_count: raw.courses_count ?? raw.coursesCount ?? null,
    groups_count: raw.groups_count ?? raw.groupsCount ?? null,
    created_at: raw.created_at || raw.createdAt || null,
    updated_at: raw.updated_at || raw.updatedAt || null,
    ...raw,
  };
}

function normalizeList(payload) {
  const root = payload?.data ?? payload;
  const list =
    root?.grades ??
    root?.items ??
    (Array.isArray(root) ? root : Array.isArray(payload) ? payload : []);
  return (Array.isArray(list) ? list : []).map(normalizeGrade).filter((g) => g?.id != null);
}

/** GET /api/admin/grades */
export async function fetchAdminGrades(params = {}, token = getToken()) {
  const { data } = await baseUrl.get(API, {
    headers: authHeaders(token),
    params: {
      ...(params.search ? { search: params.search } : {}),
      ...(params.stage ? { stage: params.stage } : {}),
      ...(params.status ? { status: params.status } : {}),
      _t: Date.now(),
    },
  });
  return normalizeList(data);
}

/** POST /api/admin/grades */
export async function createAdminGrade(payload, token = getToken()) {
  const { data } = await baseUrl.post(API, payload, {
    headers: authHeaders(token, "application/json"),
  });
  const grade = data?.grade ?? data?.data?.grade ?? data?.data ?? data;
  return normalizeGrade(grade) || grade;
}

/** PATCH /api/admin/grades/:id */
export async function updateAdminGrade(gradeId, payload, token = getToken()) {
  const { data } = await baseUrl.patch(`${API}/${gradeId}`, payload, {
    headers: authHeaders(token, "application/json"),
  });
  const grade = data?.grade ?? data?.data?.grade ?? data?.data ?? data;
  return normalizeGrade(grade) || grade;
}

/** PATCH /api/admin/grades/:id/status */
export async function updateAdminGradeStatus(gradeId, status, token = getToken()) {
  const { data } = await baseUrl.patch(
    `${API}/${gradeId}/status`,
    { status },
    { headers: authHeaders(token, "application/json") },
  );
  const grade = data?.grade ?? data?.data?.grade ?? data?.data ?? data;
  return normalizeGrade(grade) || grade;
}

/** DELETE /api/admin/grades/:id */
export async function deleteAdminGrade(gradeId, token = getToken()) {
  const { data } = await baseUrl.delete(`${API}/${gradeId}`, {
    headers: authHeaders(token),
  });
  return data;
}

export const GRADE_STAGES = [
  { value: "prep", label: "إعدادي" },
  { value: "secondary", label: "ثانوي" },
  { value: "university", label: "جامعي" },
  { value: "general", label: "عام" },
];

export function gradeStageLabel(stage) {
  return GRADE_STAGES.find((s) => s.value === stage)?.label || stage || "—";
}
