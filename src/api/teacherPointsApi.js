import baseUrl from "./baseUrl";

const TEACHER_API = "/api/teacher/points";
const STUDENT_API = "/api/student/points";

function unwrap(data, fallback) {
  if (data?.success === false) {
    const err = new Error(data?.message || fallback);
    err.response = { data };
    throw err;
  }
  return data?.data ?? data;
}

export function pointsApiError(err, fallback = "حدث خطأ غير متوقع") {
  const data = err?.response?.data;
  const base = data?.message || data?.error || err?.message || fallback;
  const errors = data?.errors;
  if (Array.isArray(errors) && errors.length) {
    const parts = errors
      .map((item) => (typeof item === "string" ? item : item?.message || item?.msg || ""))
      .filter(Boolean);
    if (parts.length) return `${base} — ${parts.join("، ")}`;
  }
  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    const parts = Object.values(errors)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .map((v) => (typeof v === "string" ? v : ""))
      .filter(Boolean);
    if (parts.length) return `${base} — ${parts.join("، ")}`;
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

function teacherScope(teacherId) {
  return teacherId ? { teacherId } : {};
}

export const DEFAULT_POINTS_SETTINGS = {
  teacher_id: null,
  video_watch_enabled: true,
  video_watch_points: 5,
  exam_start_enabled: true,
  exam_start_points: 5,
  assignment_start_enabled: true,
  assignment_start_points: 3,
  exam_score_enabled: true,
  assignment_score_enabled: true,
};

function toBool(value, fallback = true) {
  if (value === true || value === false) return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizePointsSettings(raw = {}) {
  const src = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  return {
    teacher_id: src.teacher_id ?? src.teacherId ?? null,
    video_watch_enabled: toBool(src.video_watch_enabled ?? src.videoWatchEnabled, true),
    video_watch_points: toInt(src.video_watch_points ?? src.videoWatchPoints, 5),
    exam_start_enabled: toBool(src.exam_start_enabled ?? src.examStartEnabled, true),
    exam_start_points: toInt(src.exam_start_points ?? src.examStartPoints, 5),
    assignment_start_enabled: toBool(
      src.assignment_start_enabled ?? src.assignmentStartEnabled,
      true,
    ),
    assignment_start_points: toInt(
      src.assignment_start_points ?? src.assignmentStartPoints,
      3,
    ),
    exam_score_enabled: toBool(src.exam_score_enabled ?? src.examScoreEnabled, true),
    assignment_score_enabled: toBool(
      src.assignment_score_enabled ?? src.assignmentScoreEnabled,
      true,
    ),
    created_at: src.created_at ?? src.createdAt ?? null,
    updated_at: src.updated_at ?? src.updatedAt ?? null,
  };
}

export function settingsToPayload(settings) {
  return {
    video_watch_enabled: Boolean(settings.video_watch_enabled),
    video_watch_points: Math.max(0, toInt(settings.video_watch_points, 0)),
    exam_start_enabled: Boolean(settings.exam_start_enabled),
    exam_start_points: Math.max(0, toInt(settings.exam_start_points, 0)),
    assignment_start_enabled: Boolean(settings.assignment_start_enabled),
    assignment_start_points: Math.max(0, toInt(settings.assignment_start_points, 0)),
    exam_score_enabled: Boolean(settings.exam_score_enabled),
    assignment_score_enabled: Boolean(settings.assignment_score_enabled),
  };
}

export function normalizeLeaderboardStudent(row = {}) {
  return {
    rank: toInt(row.rank, 0),
    studentId: row.studentId ?? row.student_id ?? null,
    name: row.name ?? row.studentName ?? row.student_name ?? "طالب",
    email: row.email ?? "",
    avatar: row.avatar ?? row.studentAvatar ?? row.student_avatar ?? null,
    gradeId: row.gradeId ?? row.grade_id ?? null,
    gradeName: row.gradeName ?? row.grade_name ?? "",
    points: toInt(row.points ?? row.totalPoints ?? row.total_points, 0),
  };
}

export function normalizeTransaction(row = {}) {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return {
    id: row.id,
    points: toInt(row.points, 0),
    eventType: row.eventType ?? row.event_type ?? "",
    referenceType: row.referenceType ?? row.reference_type ?? "",
    referenceId: row.referenceId ?? row.reference_id ?? null,
    referenceKey: row.referenceKey ?? row.reference_key ?? "",
    metadata,
    gradeId: row.gradeId ?? row.grade_id ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
  };
}

export function normalizeStudentSummary(raw = {}) {
  const src = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  return {
    totalPoints: toInt(src.totalPoints ?? src.total_points, 0),
    rank: toInt(src.rank, 0),
    totalStudents: toInt(src.totalStudents ?? src.total_students, 0),
    pointsToNextRank: toInt(src.pointsToNextRank ?? src.points_to_next_rank, 0),
    gradeId: src.gradeId ?? src.grade_id ?? null,
    teacherId: src.teacherId ?? src.teacher_id ?? null,
  };
}

export async function fetchTeacherPointsSettings(teacherId) {
  const { data } = await baseUrl.get(
    `${TEACHER_API}/settings${buildQuery(teacherScope(teacherId))}`,
  );
  return normalizePointsSettings(unwrap(data, "فشل تحميل إعدادات النقاط"));
}

export async function updateTeacherPointsSettings(payload, teacherId) {
  const body = teacherId ? { ...payload, teacherId } : payload;
  const { data } = await baseUrl.put(`${TEACHER_API}/settings`, body);
  return normalizePointsSettings(unwrap(data, "فشل حفظ إعدادات النقاط"));
}

export async function fetchTeacherPointsLeaderboard(params = {}) {
  const { data } = await baseUrl.get(
    `${TEACHER_API}/leaderboard${buildQuery({
      gradeId: params.gradeId,
      groupId: params.groupId,
      search: params.search,
      page: params.page || 1,
      limit: params.limit || 50,
      teacherId: params.teacherId,
    })}`,
  );
  const payload = unwrap(data, "فشل تحميل ترتيب الطلاب");
  const students = Array.isArray(payload?.students) ? payload.students : [];
  return {
    page: toInt(payload?.page, 1),
    limit: toInt(payload?.limit, 50),
    total: toInt(payload?.total, students.length),
    students: students.map(normalizeLeaderboardStudent),
  };
}

export async function awardManualPoints(body, teacherId) {
  const payload = teacherId ? { ...body, teacherId } : body;
  const { data } = await baseUrl.post(`${TEACHER_API}/manual`, payload);
  const result = unwrap(data, "فشل منح النقاط");
  return {
    awarded: result?.awarded !== false,
    points: toInt(result?.points, body.points),
    totalPoints: toInt(result?.totalPoints ?? result?.total_points, 0),
    transactionId: result?.transactionId ?? result?.transaction_id ?? null,
  };
}

export async function fetchStudentPointTransactions(studentId, params = {}) {
  const { data } = await baseUrl.get(
    `${TEACHER_API}/students/${studentId}/transactions${buildQuery({
      gradeId: params.gradeId,
      limit: params.limit || 100,
      teacherId: params.teacherId,
    })}`,
  );
  const payload = unwrap(data, "فشل تحميل سجل النقاط");
  const list = Array.isArray(payload?.transactions) ? payload.transactions : [];
  return {
    studentId: payload?.studentId ?? payload?.student_id ?? studentId,
    transactions: list.map(normalizeTransaction),
  };
}

export async function fetchStudentPointsSummary() {
  const { data } = await baseUrl.get(`${STUDENT_API}/summary`);
  return normalizeStudentSummary(unwrap(data, "فشل تحميل ملخص النقاط"));
}

export async function fetchStudentPointsLeaderboard(limit = 10) {
  const { data } = await baseUrl.get(
    `${STUDENT_API}/leaderboard${buildQuery({ limit })}`,
  );
  const payload = unwrap(data, "فشل تحميل الترتيب");
  const list = Array.isArray(payload?.topStudents)
    ? payload.topStudents
    : Array.isArray(payload?.students)
      ? payload.students
      : [];
  return {
    classId: payload?.classId ?? payload?.gradeId ?? payload?.grade_id ?? null,
    teacherId: payload?.teacherId ?? payload?.teacher_id ?? null,
    topStudents: list.map(normalizeLeaderboardStudent),
  };
}
