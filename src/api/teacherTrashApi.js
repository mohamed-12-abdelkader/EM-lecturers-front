import baseUrl from "./baseUrl";

const API = "/api/teacher/trash";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function trashApiError(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

export const TRASH_RESTORE = {
  FULL: "full",
  PARTIAL: "partial",
  NONE: "none",
};

/** أنواع قابلة للاستعادة الكاملة (soft-delete أو snapshot حساب طالب) */
const FULL_TYPES = new Set([
  "center_group",
  "center_student",
  "center_subscription",
  "center_exam",
  "center_payment",
  "payment",
  "monthly_subscription",
  "teacher_file",
  "my_file",
  "file",
  "course_file",
  "platform_student",
]);

/** استعادة جزئية للسجل فقط */
const PARTIAL_TYPES = new Set(["course", "lecture"]);

/** أنواع تُستعاد من snapshot — يُفضّل تمرير source=snapshot */
const SNAPSHOT_RESTORE_TYPES = new Set([
  "platform_student",
  "course",
  "lecture",
]);

/** عرض فقط — لا استعادة */
const VIEW_ONLY_TYPES = new Set([
  "question",
  "lesson",
  "question_bank_question",
  "question_bank_lesson",
  "activity",
]);

export const TRASH_TYPE_META = {
  center_group: { label: "مجموعة سنتر", color: "blue", group: "center" },
  center_student: { label: "طالب سنتر", color: "teal", group: "center" },
  center_subscription: { label: "اشتراك سنتر", color: "cyan", group: "center" },
  center_exam: { label: "امتحان سنتر", color: "purple", group: "center" },
  center_payment: { label: "دفعة", color: "green", group: "center" },
  payment: { label: "دفعة", color: "green", group: "center" },
  monthly_subscription: { label: "اشتراك شهري", color: "orange", group: "center" },
  teacher_file: { label: "ملف من ملفاتي", color: "blue", group: "files" },
  my_file: { label: "ملف من ملفاتي", color: "blue", group: "files" },
  file: { label: "ملف", color: "blue", group: "files" },
  course_file: { label: "ملف PDF للكورس", color: "red", group: "files" },
  course: { label: "كورس", color: "blue", group: "content" },
  lecture: { label: "محاضرة", color: "orange", group: "content" },
  platform_student: { label: "طالب منصة", color: "teal", group: "students" },
  question: { label: "سؤال محذوف", color: "gray", group: "view" },
  lesson: { label: "درس محذوف", color: "gray", group: "view" },
  question_bank_question: { label: "سؤال من البنك", color: "gray", group: "view" },
  question_bank_lesson: { label: "درس من البنك", color: "gray", group: "view" },
  activity: { label: "سجل نشاط", color: "gray", group: "view" },
};

export function trashTypeMeta(type) {
  return (
    TRASH_TYPE_META[type] || {
      label: type || "عنصر",
      color: "gray",
      group: "other",
    }
  );
}

export function trashRestoreKind(type, raw = {}) {
  if (raw.canRestore === false || raw.can_restore === false) return TRASH_RESTORE.NONE;
  if (raw.restoreKind) return raw.restoreKind;
  if (raw.restore_kind) return raw.restore_kind;
  // احترام إشارة الـ API أولاً (مثلاً platform_student بعد تفعيل الاستعادة)
  if (raw.canRestore === true || raw.can_restore === true) {
    if (PARTIAL_TYPES.has(type)) return TRASH_RESTORE.PARTIAL;
    return TRASH_RESTORE.FULL;
  }
  if (VIEW_ONLY_TYPES.has(type)) return TRASH_RESTORE.NONE;
  if (PARTIAL_TYPES.has(type)) return TRASH_RESTORE.PARTIAL;
  if (FULL_TYPES.has(type)) return TRASH_RESTORE.FULL;
  return TRASH_RESTORE.NONE;
}

export function trashNeedsSnapshotSource(type, raw = {}) {
  const source = String(raw.source || "").toLowerCase();
  if (source === "snapshot") return true;
  return SNAPSHOT_RESTORE_TYPES.has(type) && source !== "live";
}

function unwrap(raw) {
  if (!raw || typeof raw !== "object") return {};
  return raw.data ?? raw.result ?? raw;
}

export function normalizeTrashItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id ?? raw.entityId ?? raw.entity_id ?? raw.itemId ?? raw.item_id;
  const type = String(raw.type ?? raw.entityType ?? raw.entity_type ?? "").trim();
  const source = String(raw.source || "").trim().toLowerCase() || null;
  const restoreBlockers = Array.isArray(raw.restoreBlockers)
    ? raw.restoreBlockers
    : Array.isArray(raw.restore_blockers)
      ? raw.restore_blockers
      : [];
  const restoreKind = trashRestoreKind(type, raw);
  return {
    id,
    type,
    title:
      raw.title ||
      raw.name ||
      raw.label ||
      raw.displayName ||
      raw.display_name ||
      (id != null ? `#${id}` : "عنصر محذوف"),
    subtitle:
      raw.subtitle ||
      raw.description ||
      raw.details ||
      raw.note ||
      raw.restoreNote ||
      raw.restore_note ||
      "",
    deletedAt: raw.deletedAt ?? raw.deleted_at ?? raw.deletedOn ?? raw.createdAt ?? raw.created_at,
    source,
    restoreBlockers,
    restoreKind,
    canRestore: restoreKind === TRASH_RESTORE.FULL || restoreKind === TRASH_RESTORE.PARTIAL,
    needsSnapshotSource: trashNeedsSnapshotSource(type, { ...raw, source }),
    extra: raw.meta ?? raw.metadata ?? raw.extra ?? null,
  };
}

export function normalizeTrashList(raw) {
  const data = unwrap(raw);
  const list =
    data.items ||
    data.rows ||
    data.records ||
    data.trash ||
    (Array.isArray(data) ? data : []) ||
    [];
  const paginationRaw = data.pagination || data.meta || {};
  const page = Number(paginationRaw.page ?? data.page ?? 1) || 1;
  const limit = Number(paginationRaw.limit ?? data.limit ?? 20) || 20;
  const total = Number(paginationRaw.total ?? data.total ?? list.length) || 0;
  const totalPages =
    Number(paginationRaw.totalPages ?? paginationRaw.total_pages ?? data.totalPages) ||
    Math.max(1, Math.ceil(total / limit) || 1);

  return {
    items: (Array.isArray(list) ? list : []).map(normalizeTrashItem).filter(Boolean),
    pagination: { page, limit, total, totalPages },
  };
}

export function normalizeTrashSummary(raw) {
  const data = unwrap(raw);
  const byType = {};

  const push = (type, count) => {
    if (!type) return;
    byType[type] = Number(count) || 0;
  };

  const arr = data.byType || data.types || data.items || data.counts;
  if (Array.isArray(arr)) {
    arr.forEach((row) => {
      if (row && typeof row === "object") {
        push(row.type || row.key || row.name, row.count ?? row.total ?? row.value);
      }
    });
  } else if (arr && typeof arr === "object") {
    Object.entries(arr).forEach(([type, count]) => push(type, count));
  } else if (data && typeof data === "object") {
    Object.entries(data).forEach(([key, value]) => {
      if (["total", "message", "success", "status"].includes(key)) return;
      if (typeof value === "number") push(key, value);
    });
  }

  const total =
    Number(data.total) ||
    Object.values(byType).reduce((sum, n) => sum + Number(n || 0), 0);

  return { total, byType };
}

export async function fetchTeacherTrash({ page = 1, limit = 20, type, search } = {}, token) {
  const params = { page, limit };
  if (type) params.type = type;
  if (search) {
    params.search = search;
    params.q = search;
  }
  const { data } = await baseUrl.get(API, {
    params,
    headers: authHeaders(token),
  });
  return normalizeTrashList(data);
}

export async function fetchTeacherTrashSummary(token) {
  const { data } = await baseUrl.get(`${API}/summary`, {
    headers: authHeaders(token),
  });
  return normalizeTrashSummary(data);
}

/**
 * POST /api/teacher/trash/:type/:id/restore
 * لطلاب المنصة والكورسات/المحاضرات من snapshot: مرّر source=snapshot
 */
export async function restoreTeacherTrashItem(type, id, token, options = {}) {
  const params = {};
  const source = options.source || (trashNeedsSnapshotSource(type, options) ? "snapshot" : undefined);
  if (source) params.source = source;

  const { data } = await baseUrl.post(
    `${API}/${encodeURIComponent(type)}/${encodeURIComponent(id)}/restore`,
    source ? { source } : {},
    {
      params,
      headers: authHeaders(token),
    },
  );
  return data;
}
