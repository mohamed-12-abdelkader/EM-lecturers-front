import baseUrl from "./baseUrl";
import {
  normalizeCorrectAnswerLetters,
} from "./courseExamsApi";
import {
  normalizeCourseLevelExam,
  normalizeStudentCodeInput,
  parseCourseExamsResponse,
} from "../utils/courseLevelExamUtils";
import { normalizeExamQuestionsFromApi } from "../utils/examFlowUtils";

const API = "/api/public-exams";
const EXAMS_API = "/api/exams";
const QUESTIONS_API = "/api/questions";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function publicExamsApiError(err, fallback = "حدث خطأ غير متوقع") {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.msg ||
    err?.message ||
    fallback
  );
}

function unwrapExam(data) {
  if (!data) return null;
  if (data.exam) return data.exam;
  if (data.data?.exam) return data.data.exam;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  return data;
}

function unwrapExams(data) {
  if (Array.isArray(data?.exams)) return data.exams;
  if (Array.isArray(data?.data?.exams)) return data.data.exams;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return parseCourseExamsResponse(data);
}

export function normalizePublicExam(raw = {}) {
  const base = normalizeCourseLevelExam(raw) || {};
  const gradeId = raw.gradeId ?? raw.grade_id ?? base.grade_id ?? null;
  const gradeName = raw.gradeName ?? raw.grade_name ?? base.grade_name ?? "";
  return {
    ...base,
    id: base.id ?? raw.id,
    title: base.title || raw.title || "",
    description: raw.description ?? base.description ?? null,
    grade_id: gradeId,
    gradeId,
    grade_name: gradeName,
    gradeName,
    exam_scope: "public",
    examScope: "public",
    examKind: "public",
    submissionsCount: Number(raw.submissionsCount ?? raw.submissions_count ?? 0) || 0,
    studentsAttemptedCount:
      Number(raw.studentsAttemptedCount ?? raw.students_attempted_count ?? 0) || 0,
    available_from: base.available_from,
    visibility_end_date: base.visibility_end_date,
    answers_release_mode: base.answers_release_mode,
    show_answers_after_hours:
      raw.showAnswersAfterHours ?? raw.show_answers_after_hours ?? null,
    show_answers_immediately: base.show_answers_immediately,
    answers_visible_at: base.answers_visible_at,
    is_visible_to_students: base.is_visible_to_students,
    is_active: base.is_active,
    attempt_limit: base.attempt_limit,
    duration_minutes: base.duration_minutes,
    duration_unlimited: base.duration_unlimited,
    questions_count: base.questions_count,
    actual_questions_count: base.actual_questions_count,
    question_display_mode: base.question_display_mode,
  };
}

/** GET /api/public-exams/teacher?gradeId= */
export async function fetchTeacherPublicExams({ gradeId } = {}, token) {
  const params = {};
  if (gradeId) params.gradeId = gradeId;
  const { data } = await baseUrl.get(`${API}/teacher`, {
    headers: authHeaders(token),
    params,
  });
  return unwrapExams(data).map(normalizePublicExam).filter(Boolean);
}

/** GET /api/public-exams/student */
export async function fetchStudentPublicExams(token) {
  const { data } = await baseUrl.get(`${API}/student`, {
    headers: authHeaders(token),
  });
  return unwrapExams(data).map(normalizePublicExam).filter(Boolean);
}

/** GET /api/public-exams/:examId */
export async function fetchPublicExam(examId, token) {
  const { data } = await baseUrl.get(`${API}/${encodeURIComponent(examId)}`, {
    headers: authHeaders(token),
  });
  return normalizePublicExam(unwrapExam(data));
}

/** POST /api/public-exams */
export async function createPublicExam(payload, token) {
  const { data } = await baseUrl.post(API, payload, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  return normalizePublicExam(unwrapExam(data));
}

/** PATCH /api/public-exams/:examId */
export async function updatePublicExam(examId, payload, token) {
  const { data } = await baseUrl.patch(`${API}/${encodeURIComponent(examId)}`, payload, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  return normalizePublicExam(unwrapExam(data));
}

/** POST /api/public-exams/:examId/publish */
export async function publishPublicExam(examId, token) {
  const { data } = await baseUrl.post(
    `${API}/${encodeURIComponent(examId)}/publish`,
    {},
    { headers: authHeaders(token) },
  );
  return normalizePublicExam(unwrapExam(data));
}

/** POST /api/public-exams/:examId/unpublish */
export async function unpublishPublicExam(examId, token) {
  const { data } = await baseUrl.post(
    `${API}/${encodeURIComponent(examId)}/unpublish`,
    {},
    { headers: authHeaders(token) },
  );
  return normalizePublicExam(unwrapExam(data));
}

/** DELETE /api/public-exams/:examId */
export async function deletePublicExam(examId, token) {
  const { data } = await baseUrl.delete(`${API}/${encodeURIComponent(examId)}`, {
    headers: authHeaders(token),
  });
  return data;
}

/** GET /api/public-exams/:examId/report */
export async function fetchPublicExamReport(examId, { passPercentage } = {}, token) {
  const params = {};
  const pass = Number(passPercentage);
  if (Number.isFinite(pass) && pass >= 0) params.passPercentage = pass;
  const { data } = await baseUrl.get(`${API}/${encodeURIComponent(examId)}/report`, {
    headers: authHeaders(token),
    params,
  });
  return data?.data && data.exam == null && !data.questions ? data.data : data;
}

/** GET /api/public-exams/:examId/grades */
export async function fetchPublicExamGrades(examId, token) {
  const { data } = await baseUrl.get(`${API}/${encodeURIComponent(examId)}/grades`, {
    headers: authHeaders(token),
  });
  return data;
}

function normalizeLateAccessGrant(row = {}) {
  const rawCode = row.studentCode ?? row.student_code ?? "";
  return {
    id: row.id ?? null,
    examId: row.examId ?? row.exam_id ?? null,
    studentId: row.studentId ?? row.student_id ?? null,
    studentCode: normalizeStudentCodeInput(rawCode) || null,
    studentName: row.studentName ?? row.student_name ?? "طالب",
    remainingAttempts: Number(row.remainingAttempts ?? row.remaining_attempts ?? 0) || 0,
    note: row.note ?? null,
    grantedBy: row.grantedBy ?? row.granted_by ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

function unwrapLateAccessList(data) {
  const payload = data?.data ?? data;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.grants)
      ? payload.grants
      : [];
  return list.map(normalizeLateAccessGrant);
}

/** GET /api/public-exams/:examId/late-access */
export async function fetchPublicExamLateAccess(examId, token) {
  const { data } = await baseUrl.get(
    `${API}/${encodeURIComponent(examId)}/late-access`,
    { headers: authHeaders(token) },
  );
  return unwrapLateAccessList(data);
}

/** POST /api/public-exams/:examId/late-access — الجسم: { studentCode, extraAttempts } */
export async function grantPublicExamLateAccess(
  examId,
  { studentCode, extraAttempts = 1, note } = {},
  token,
) {
  const code = normalizeStudentCodeInput(studentCode);
  const body = { studentCode: code };
  const extra = Number(extraAttempts);
  if (Number.isInteger(extra) && extra >= 1) body.extraAttempts = Math.min(10, extra);
  if (note != null && String(note).trim()) body.note = String(note).trim();
  const { data } = await baseUrl.post(
    `${API}/${encodeURIComponent(examId)}/late-access`,
    body,
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
  return {
    grant: normalizeLateAccessGrant(data?.data ?? data),
    message: data?.message || "تم السماح للطالب بمحاولة إضافية",
  };
}

/** DELETE /api/public-exams/:examId/late-access/:studentCode */
export async function revokePublicExamLateAccess(examId, studentCode, token) {
  const code = normalizeStudentCodeInput(studentCode);
  const { data } = await baseUrl.delete(
    `${API}/${encodeURIComponent(examId)}/late-access/${encodeURIComponent(code)}`,
    { headers: authHeaders(token) },
  );
  return data;
}

/** POST /api/public-exams/:examId/start */
export async function startPublicExamAttempt(examId, token) {
  const { data } = await baseUrl.post(
    `${API}/${encodeURIComponent(examId)}/start`,
    {},
    { headers: authHeaders(token) },
  );
  return data;
}

/** POST /api/public-exams/:examId/autosave */
export async function autosavePublicExamAnswers(examId, token, { attemptId, answers }) {
  const { data } = await baseUrl.post(
    `${API}/${encodeURIComponent(examId)}/autosave`,
    { attemptId, attempt_id: attemptId, answers },
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
  return data;
}

/** POST /api/public-exams/:examId/submit */
export async function submitPublicExamAttempt(examId, token, { attemptId, answers }) {
  const { data } = await baseUrl.post(
    `${API}/${encodeURIComponent(examId)}/submit`,
    { attemptId, attempt_id: attemptId, answers },
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
  return data;
}

/** GET /api/public-exams/:examId/my-report */
export async function fetchPublicExamMyReport(examId, token) {
  const { data } = await baseUrl.get(`${API}/${encodeURIComponent(examId)}/my-report`, {
    headers: authHeaders(token),
  });
  return data?.data && data.exam == null ? data.data : data;
}

/** GET /api/public-exams/:examId/student-report */
export async function fetchPublicExamStudentReport(examId, token, attemptId) {
  const params = {};
  if (attemptId) params.attemptId = attemptId;
  const { data } = await baseUrl.get(`${API}/${encodeURIComponent(examId)}/student-report`, {
    headers: authHeaders(token),
    params,
  });
  return data?.data && data.exam == null ? data.data : data;
}

/** بناء payload إنشاء/تعديل من نموذج الواجهة */
export function buildPublicExamPayload(form = {}) {
  const payload = {
    title: String(form.title || "").trim(),
    description:
      form.description === undefined || form.description === null || form.description === ""
        ? undefined
        : String(form.description).trim() || null,
    gradeId: Number(form.gradeId || form.grade_id),
    questionsCount: Number(form.questions_count ?? form.questionsCount),
    questionDisplayMode: form.question_display_mode || form.questionDisplayMode || "ordered",
    answersReleaseMode: form.answers_release_mode || form.answersReleaseMode || "immediate",
    showAnswersImmediately: Boolean(
      form.show_answers_immediately ?? form.showAnswersImmediately ?? true,
    ),
    isVisibleToStudents: Boolean(
      form.is_visible_to_students ?? form.isVisibleToStudents ?? false,
    ),
    isActive: form.is_active ?? form.isActive ?? true,
  };

  const unlimited = Boolean(form.duration_unlimited ?? form.durationUnlimited);
  if (unlimited) {
    payload.durationMinutes = null;
  } else if (form.duration_minutes !== "" && form.duration_minutes != null) {
    payload.durationMinutes = Number(form.duration_minutes);
  }

  if (form.attempt_limit !== "" && form.attempt_limit != null) {
    payload.attemptLimit = Number(form.attempt_limit);
  } else if (form.attempt_limit === "") {
    payload.attemptLimit = null;
  }

  if (form.available_from) payload.availableFrom = form.available_from;
  if (form.visibility_end_date) payload.visibilityEndDate = form.visibility_end_date;
  if (form.answers_visible_at) payload.answersVisibleAt = form.answers_visible_at;
  if (form.show_answers_after_hours != null && form.show_answers_after_hours !== "") {
    payload.showAnswersAfterHours = Number(form.show_answers_after_hours);
  }

  return payload;
}

/**
 * أسئلة الامتحان العام
 * المفضّل: /api/public-exams/:examId/...
 * (لا تستخدم /api/course/course-exam لأن JOIN على courses يفشل عندما course_id = null)
 */

/** GET /api/public-exams/:examId/questions */
export async function fetchPublicExamQuestions(examId, token) {
  const { data } = await baseUrl.get(`${API}/${encodeURIComponent(examId)}/questions`, {
    headers: authHeaders(token),
    params: { _t: Date.now() },
  });
  const list = data?.questions ?? data?.data?.questions ?? (Array.isArray(data) ? data : []);
  return normalizeExamQuestionsFromApi(list);
}

/** POST /api/public-exams/:examId/questions/from-bank */
export async function addPublicExamQuestionsFromBank(examId, questionIds, token) {
  const ids = (Array.isArray(questionIds) ? questionIds : [])
    .map((id) => Number(id))
    .filter((n) => Number.isInteger(n) && n > 0);
  const { data } = await baseUrl.post(
    `${API}/${encodeURIComponent(examId)}/questions/from-bank`,
    { questionIds: ids },
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
  return data;
}

/**
 * POST /api/public-exams/:examId/questions/from-teacher-library
 * Body: { questionIds } | { gradeId } | { lessonId } | { passageId }
 */
export async function addPublicExamQuestionsFromTeacherLibrary(examId, payload, token) {
  const body = {};
  if (Array.isArray(payload?.questionIds)) {
    body.questionIds = payload.questionIds
      .map((id) => Number(id))
      .filter((n) => Number.isInteger(n) && n > 0);
  }
  if (payload?.gradeId != null && payload.gradeId !== "") {
    body.gradeId = Number(payload.gradeId);
  }
  if (payload?.lessonId != null && payload.lessonId !== "") {
    body.lessonId = Number(payload.lessonId);
  }
  if (payload?.passageId != null && payload.passageId !== "") {
    body.passageId = Number(payload.passageId);
  }
  const { data } = await baseUrl.post(
    `${API}/${encodeURIComponent(examId)}/questions/from-teacher-library`,
    body,
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
  return data;
}

/** POST /api/exams/:examId/questions/bulk */
export async function addPublicExamBulkQuestions(examId, { text, correctAnswers }, token) {
  const body = { text };
  if (Array.isArray(correctAnswers) && correctAnswers.length) {
    body.correctAnswers = correctAnswers;
  }
  const { data } = await baseUrl.post(
    `${EXAMS_API}/${encodeURIComponent(examId)}/questions/bulk`,
    body,
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
  return data;
}

/** POST /api/exams/:examId/questions — سؤال نصي (مع صورة اختيارية عبر FormData) */
export async function addPublicExamTextQuestion(examId, formData, token) {
  const { data } = await baseUrl.post(
    `${EXAMS_API}/${encodeURIComponent(examId)}/questions`,
    formData,
    { headers: authHeaders(token) },
  );
  return data;
}

/** POST /api/exams/:examId/questions/images */
export async function addPublicExamImageQuestions(examId, formData, token) {
  const { data } = await baseUrl.post(
    `${EXAMS_API}/${encodeURIComponent(examId)}/questions/images`,
    formData,
    { headers: authHeaders(token) },
  );
  return data;
}

/** POST /api/exams/:examId/questions/from-passage */
export async function addPublicExamPassageQuestions(examId, passageId, token) {
  const { data } = await baseUrl.post(
    `${EXAMS_API}/${encodeURIComponent(examId)}/questions/from-passage`,
    { passageId: Number(passageId) },
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
  return data;
}

/** PUT /api/questions/:questionId */
export async function updatePublicExamQuestion(questionId, payload, token) {
  const { data } = await baseUrl.put(
    `${QUESTIONS_API}/${encodeURIComponent(questionId)}`,
    payload,
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
  return data?.question ?? data;
}

/** DELETE /api/questions/:questionId */
export async function deletePublicExamQuestion(questionId, token) {
  const { data } = await baseUrl.delete(
    `${QUESTIONS_API}/${encodeURIComponent(questionId)}`,
    { headers: authHeaders(token) },
  );
  return data;
}

/** PATCH /api/questions/:questionId/correct-answers */
export async function patchPublicExamQuestionCorrectAnswers(
  questionId,
  correctAnswers,
  token,
) {
  const answers = normalizeCorrectAnswerLetters(correctAnswers);
  if (answers.length < 1 || answers.length > 2) {
    throw new Error("يجب اختيار إجابة واحدة أو إجابتين من A–D");
  }
  const { data } = await baseUrl.patch(
    `${QUESTIONS_API}/${encodeURIComponent(questionId)}/correct-answers`,
    { correctAnswers: answers },
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    },
  );
  return data;
}
